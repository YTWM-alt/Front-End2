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

  // 当videoData.source变化时，重置播放器状态
  useEffect(() => {
    if (videoRef.current && videoData.source) {
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
    }
  }, [videoData.source]);

  // 格式化时间显示
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // 处理播放/暂停
  const togglePlayPause = async () => {
    if (!videoRef.current || isLoading || hasError) {
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
      
      {/* 加载状态覆盖层 */}
      {isLoading && (
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
      {hasError && (
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
      <div className="player-controls">
        {/* 播放/暂停按钮 */}
        <button 
          onClick={togglePlayPause}
          disabled={isLoading || hasError}
          style={{
            opacity: (isLoading || hasError) ? 0.5 : 1,
            cursor: (isLoading || hasError) ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
          )}
        </button>
        
        {/* 进度条 */}
        <div 
          className="progress-bar" 
          onClick={hasError ? undefined : handleProgressClick}
          style={{
            cursor: hasError ? 'not-allowed' : 'pointer',
            opacity: hasError ? 0.5 : 1
          }}
        >
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* 时间信息 */}
        <div className="time-info">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        
        {/* 全屏按钮 */}
        <button 
          onClick={toggleFullscreen}
          disabled={isLoading || hasError}
          style={{
            opacity: (isLoading || hasError) ? 0.5 : 1,
            cursor: (isLoading || hasError) ? 'not-allowed' : 'pointer'
          }}
        >
          <i className="fas fa-expand"></i>
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer; 