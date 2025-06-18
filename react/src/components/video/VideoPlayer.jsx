import React, { useState, useRef, useEffect } from 'react';

/**
 * 视频播放器组件
 * 提供视频播放控制功能
 */
const VideoPlayer = ({ videoData }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 检查是否为等待状态
  const isWaitingForAI = videoData?.isWaiting || false;
  const hasValidSource = videoData?.source && videoData.source.length > 0;

  // 当videoData.source变化时，重置播放器状态
  useEffect(() => {
    if (videoRef.current && hasValidSource && !isWaitingForAI) {
      setIsLoading(true);
      setHasError(false);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setProgress(0);
      
      // 重新加载视频
      videoRef.current.load();
      // 修改：添加视频源路径的日志输出
      const videoSource = videoData.source.startsWith('http') 
        ? videoData.source 
        : `/videos/${videoData.source}`;
      console.log('🎬 加载新视频源:', videoSource);
    } else if (isWaitingForAI) {
      // 等待状态，重置错误状态
      setHasError(false);
      setIsLoading(false);
      setIsPlaying(false);
      console.log('⏳ 视频播放器进入等待AI生成状态');
    }
  }, [videoData.source, isWaitingForAI, hasValidSource]);

  // 格式化时间显示
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // 处理播放/暂停
  const togglePlayPause = async () => {
    if (!videoRef.current || isLoading || hasError || isWaitingForAI) {
      console.warn('⚠️ 视频未准备好或有错误，无法播放');
      return;
    }

    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        await videoRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('❌ 播放/暂停错误:', error);
      setHasError(true);
      setIsPlaying(false);
    }
  };

  // 处理时间更新
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setDuration(total);
      setProgress((current / total) * 100);
    }
  };

  // 处理进度条点击
  const handleProgressClick = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const newTime = pos * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(pos * 100);
    }
  };

  // 处理全屏
  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  // 处理视频加载完成
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
      console.log('✅ 视频元数据加载完成，时长:', videoRef.current.duration);
    }
  };

  // 处理视频可以播放
  const handleCanPlay = () => {
    setIsLoading(false);
    console.log('✅ 视频可以播放');
  };

  // 处理视频错误
  const handleVideoError = (error) => {
    // 如果是等待状态，不显示错误
    if (isWaitingForAI) {
      console.log('⏳ 等待状态中，忽略视频加载错误');
      return;
    }
    console.error('❌ 视频加载错误:', error);
    setHasError(true);
    setIsLoading(false);
  };

  // 处理视频播放事件
  const handlePlay = () => {
    setIsPlaying(true);
  };

  // 处理视频暂停事件
  const handlePause = () => {
    setIsPlaying(false);
  };

  return (
    <div className="video-player">
      {/* 只有在非等待状态且有有效源时才渲染video元素 */}
      {!isWaitingForAI && hasValidSource && (
        <video
          ref={videoRef}
          poster={videoData.thumbnail}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onError={handleVideoError}
          onPlay={handlePlay}
          onPause={handlePause}
          onLoadStart={() => setIsLoading(true)}
          preload="metadata"
        >
          <source src={videoData.source.startsWith('http') ? videoData.source : `/videos/${videoData.source}`} type="video/mp4" />
          您的浏览器不支持视频播放。
        </video>
      )}
      
      {/* 等待AI生成的状态覆盖层 */}
      {isWaitingForAI && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '18px',
          textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <i className="fas fa-magic fa-3x" style={{ 
              animation: 'pulse 2s infinite',
              color: '#ffd700'
            }}></i>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
            AI正在为您生成视频
          </div>
          <div style={{ fontSize: '16px', opacity: 0.9, marginBottom: '15px' }}>
            请耐心等待，这可能需要几分钟时间
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '5px', 
            alignItems: 'center',
            fontSize: '14px',
            opacity: 0.8
          }}>
            <i className="fas fa-clock"></i>
            <span>预计生成时间: 2-5分钟</span>
          </div>
          <style>
            {`
              @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
              }
            `}
          </style>
        </div>
      )}
      
      {/* 加载状态覆盖层 */}
      {!isWaitingForAI && isLoading && hasValidSource && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '16px'
        }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
          加载视频中...
        </div>
      )}
      
      {/* 错误状态覆盖层 */}
      {!isWaitingForAI && hasError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '16px',
          textAlign: 'center'
        }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '24px', marginBottom: '10px', color: '#ff3860' }}></i>
          <div>视频加载失败</div>
          <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.8 }}>
            请检查视频文件是否存在
          </div>
        </div>
      )}
      
      {/* 播放器控制条 */}
      {!isWaitingForAI && (
        <div className="player-controls">
          {/* 播放/暂停按钮 */}
          <button 
            onClick={togglePlayPause}
            disabled={isLoading || hasError}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: (isLoading || hasError) ? 'not-allowed' : 'pointer',
              opacity: (isLoading || hasError) ? 0.5 : 1,
              padding: '5px 10px'
            }}
          >
            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
          </button>

          {/* 进度条 */}
          <div 
            onClick={handleProgressClick}
            style={{
              flex: 1,
              height: '6px',
              background: 'rgba(255, 255, 255, 0.3)',
              margin: '0 10px',
              borderRadius: '3px',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <div 
              style={{
                width: `${progress}%`,
                height: '100%',
                background: '#fff',
                borderRadius: '3px',
                transition: 'width 0.1s'
              }}
            />
          </div>

          {/* 时间显示 */}
          <span style={{ 
            color: 'white', 
            fontSize: '14px',
            minWidth: '80px',
            textAlign: 'center'
          }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* 全屏按钮 */}
          <button 
            onClick={toggleFullscreen}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '5px 10px'
            }}
          >
            <i className="fas fa-expand"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer; 