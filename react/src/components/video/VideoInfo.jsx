import React from 'react';

/**
 * 视频信息组件
 * 显示视频标题和描述
 */
const VideoInfo = ({ videoData, searchTerm }) => {
  return (
    <div className="video-info">
      <h3>{videoData.title}</h3>
      <p>{videoData.description}</p>
      
      {searchTerm && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px 15px', 
          background: 'rgba(74, 111, 227, 0.1)', 
          borderRadius: '8px',
          fontSize: '14px',
          color: 'var(--primary)'
        }}>
          <i className="fas fa-search" style={{ marginRight: '8px' }}></i>
          基于搜索关键词: <strong>{searchTerm}</strong>
        </div>
      )}
    </div>
  );
};

export default VideoInfo; 