import React, { useRef, useEffect, useState, useCallback } from 'react';
import useVideoCache from '../hooks/useVideoCache';

/**
 * 优化的视频播放器组件
 * 特性：
 * 1. 支持HTTP Range请求的流式播放
 * 2. 智能缓存和预加载
 * 3. 播放进度记录和恢复
 * 4. 保持原有播放器样式
 */
const OptimizedVideoPlayer = ({ 
  videoData, 
  className = "video-player",
  style = {},
  onProgress = null,
  onError = null,
  ...props 
}) => {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const progressUpdateTimer = useRef(null);
  
  const {
    getCachedVideoData,
    setCachedVideoData,
    smartPreload,
    recordPlaybackProgress,
    getPlaybackProgress,
    isPreloading,
    getCacheStats
  } = useVideoCache();

  // 从缓存中构建 Blob URL
  const createBlobUrl = useCallback((data) => {
    const blob = new Blob([data], { type: 'video/mp4' });
    return URL.createObjectURL(blob);
  }, []);

  // 优化的视频加载逻辑
  const loadOptimizedVideo = useCallback(async () => {
    if (!videoData?.streamUrl || !videoData?.id) {
      setError('无效的视频数据');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 首先检查缓存
      const cachedData = getCachedVideoData(videoData.id);
      if (cachedData) {
        console.log('使用缓存的视频数据');
        const blobUrl = createBlobUrl(cachedData);
        if (videoRef.current) {
          videoRef.current.src = blobUrl;
          // 恢复播放进度
          const progress = getPlaybackProgress(videoData.id);
          if (progress.currentTime > 0) {
            videoRef.current.currentTime = progress.currentTime;
          }
        }
        setLoading(false);
        return;
      }

      // 尝试通过Range请求加载首个片段
      const initialChunkSize = 5 * 1024 * 1024; // 5MB初始加载
      const response = await fetch(videoData.streamUrl, {
        headers: {
          'Range': `bytes=0-${initialChunkSize - 1}`
        }
      });

      if (response.status === 206) {
        // 服务器支持Range请求
        console.log('服务器支持Range请求，使用流式播放');
        
        // 获取完整文件信息
        const contentRange = response.headers.get('Content-Range');
        const totalSize = contentRange ? parseInt(contentRange.split('/')[1]) : 0;
        
        setVideoInfo({
          totalSize,
          supportsRange: true,
          chunkSize: initialChunkSize
        });

        // 加载初始块并设置播放器
        const initialData = await response.arrayBuffer();
        setCachedVideoData(videoData.id, initialData, { start: 0, end: initialChunkSize - 1 });
        
        // 创建 Blob URL
        const blobUrl = createBlobUrl(initialData);
        if (videoRef.current) {
          videoRef.current.src = blobUrl;
        }

        // 开始后台加载剩余部分
        loadRemainingVideo(totalSize, initialChunkSize);
        
      } else {
        // 回退到常规加载
        console.log('服务器不支持Range请求，使用常规加载');
        if (videoRef.current) {
          videoRef.current.src = videoData.streamUrl;
        }
        setVideoInfo({ supportsRange: false });
      }

    } catch (err) {
      console.error('视频加载失败:', err);
      setError('视频加载失败，请稍后重试');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }, [videoData, getCachedVideoData, setCachedVideoData, createBlobUrl, getPlaybackProgress, onError]);

  // 加载剩余的视频数据
  const loadRemainingVideo = useCallback(async (totalSize, loadedSize) => {
    if (!videoData?.streamUrl || loadedSize >= totalSize) return;

    try {
      const chunkSize = 10 * 1024 * 1024; // 10MB块大小
      let currentPosition = loadedSize;

      while (currentPosition < totalSize) {
        const endPosition = Math.min(currentPosition + chunkSize - 1, totalSize - 1);
        
        // 检查是否已缓存
        const cachedChunk = getCachedVideoData(videoData.id, { 
          start: currentPosition, 
          end: endPosition 
        });

        if (!cachedChunk) {
          const response = await fetch(videoData.streamUrl, {
            headers: {
              'Range': `bytes=${currentPosition}-${endPosition}`
            }
          });

          if (response.status === 206) {
            const chunkData = await response.arrayBuffer();
            setCachedVideoData(videoData.id, chunkData, {
              start: currentPosition,
              end: endPosition
            });
            console.log(`后台加载块: ${currentPosition}-${endPosition} (${(chunkData.byteLength / 1024 / 1024).toFixed(2)}MB)`);
          }
        }

        currentPosition = endPosition + 1;
        
        // 添加延迟避免阻塞主线程
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('所有视频块加载完成');
    } catch (error) {
      console.error('后台加载失败:', error);
    }
  }, [videoData, getCachedVideoData, setCachedVideoData]);

  // 处理播放进度更新
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || !videoData?.id) return;

    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;

    if (duration > 0) {
      // 记录播放进度
      recordPlaybackProgress(videoData.id, currentTime, duration);

      // 触发外部进度回调
      if (onProgress) {
        onProgress({
          currentTime,
          duration,
          progress: currentTime / duration
        });
      }

      // 智能预加载
      if (videoInfo?.supportsRange && videoInfo?.totalSize) {
        smartPreload(
          videoData.id,
          videoData.streamUrl,
          currentTime,
          duration,
          videoInfo.totalSize
        );
      }
    }
  }, [videoData, recordPlaybackProgress, onProgress, smartPreload, videoInfo]);

  // 处理播放器事件
  const handleLoadStart = useCallback(() => {
    setLoading(true);
    console.log('开始加载视频:', videoData?.streamUrl);
  }, [videoData]);

  const handleCanPlay = useCallback(() => {
    setLoading(false);
    console.log('视频可以播放');
    
    // 恢复播放进度
    if (videoRef.current && videoData?.id) {
      const progress = getPlaybackProgress(videoData.id);
      if (progress.currentTime > 0 && progress.currentTime < videoRef.current.duration) {
        videoRef.current.currentTime = progress.currentTime;
        console.log(`恢复播放进度: ${progress.currentTime}秒`);
      }
    }
  }, [videoData, getPlaybackProgress]);

  const handleError = useCallback((e) => {
    console.error('视频播放错误:', e);
    setError('视频播放失败');
    setLoading(false);
    if (onError) onError(e);
  }, [onError]);

  const handleLoadedMetadata = useCallback(() => {
    console.log('视频元数据加载完成');
    if (videoRef.current) {
      console.log(`视频时长: ${videoRef.current.duration}秒`);
    }
  }, []);

  // 清理定时器和Blob URL
  useEffect(() => {
    return () => {
      if (progressUpdateTimer.current) {
        clearInterval(progressUpdateTimer.current);
      }
      
      // 清理可能的Blob URL
      if (videoRef.current?.src && videoRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(videoRef.current.src);
      }
    };
  }, []);

  // 初始化视频
  useEffect(() => {
    if (videoData?.streamUrl) {
      loadOptimizedVideo();
    }
  }, [videoData?.streamUrl, loadOptimizedVideo]);

  // 设置进度更新定时器
  useEffect(() => {
    if (videoRef.current) {
      progressUpdateTimer.current = setInterval(() => {
        handleTimeUpdate();
      }, 1000); // 每秒更新一次

      return () => {
        if (progressUpdateTimer.current) {
          clearInterval(progressUpdateTimer.current);
        }
      };
    }
  }, [handleTimeUpdate]);

  const cacheStats = getCacheStats();

  return (
    <div className="optimized-video-player-container" style={{ position: 'relative' }}>
      {/* 视频播放器 - 保持原有样式 */}
      <video
        ref={videoRef}
        controls
        className={className}
        style={{
          width: '100%',
          height: 'auto',
          maxHeight: '50vh',
          borderRadius: '8px',
          backgroundColor: '#000',
          ...style
        }}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        poster={videoData?.poster}
        {...props}
      >
        您的浏览器不支持视频播放。
      </video>

      {/* 加载状态指示器 */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <div
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid transparent',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          {isPreloading ? '智能预加载中...' : '视频加载中...'}
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(220, 38, 38, 0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '14px',
            textAlign: 'center'
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* 缓存状态指示器（开发模式） */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}
        >
          缓存: {cacheStats.totalSizeMB}MB ({cacheStats.totalEntries}项)
          {isPreloading && <span style={{ color: '#10b981' }}> ⚡预加载中</span>}
        </div>
      )}

      {/* 添加旋转动画样式 */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OptimizedVideoPlayer; 