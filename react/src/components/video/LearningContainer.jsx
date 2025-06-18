import React, { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import VideoInfo from './VideoInfo';
import AIAssistant from '../chat/AIAssistant';
import { useChat } from '../../hooks/useChat';
import { SAMPLE_VIDEO } from '../../utils/constants';
import { processAIVideo } from '../../utils/api';

// 全局处理状态，防止重复执行
let globalProcessingState = {
  isProcessing: false,
  hasProcessed: false,
  lastProcessTime: 0
};

/**
 * 学习容器组件
 * 整合视频播放和AI聊天功能
 */
const LearningContainer = ({ searchTerm, onClose, authHook }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [videoData, setVideoData] = useState(SAMPLE_VIDEO);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false); // 防止重复处理
  
  // 使用聊天Hook
  const chatHook = useChat();

  // 组件挂载后显示动画和处理AI视频（只触发一次）
  useEffect(() => {
    console.log('📦 LearningContainer 组件挂载, hasProcessed:', hasProcessed);
    setTimeout(() => setIsVisible(true), 50);
    if (!hasProcessed) {
      console.log('🚀 首次挂载，开始处理AI视频');
      handleProcessAIVideo();
    } else {
      console.log('🚫 已处理过，跳过AI视频处理');
    }
  }, []); // 移除hasProcessed依赖，避免循环触发

  // 根据搜索词更新视频标题
  useEffect(() => {
    if (searchTerm) {
      setVideoData(prev => ({
        ...prev,
        title: `${searchTerm} - 学习视频`,
        description: `关于"${searchTerm}"的详细学习内容。本视频将为您全面介绍相关概念、原理和实际应用，帮助您深入理解这个主题。`
      }));
    }
  }, [searchTerm]);

  /**
   * 处理AI生成的视频（只允许执行一次）
   */
  const handleProcessAIVideo = async () => {
    if (hasProcessed || isProcessingVideo) {
      console.log('🚫 AI视频处理已执行过或正在处理中，跳过重复调用');
      return;
    }

    setIsProcessingVideo(true);
    setHasProcessed(true); // 标记为已处理，防止重复触发
    
    try {
      const result = await processAIVideo();
      
      if (result.success) {
        // 构建完整的视频URL（现在视频已移动到video文件夹）
        const fullVideoUrl = `http://localhost:3003${result.videoUrl}`;
        const videoFileName = result.videoFileName || result.newFileName || 'ai_video';
        
        // 更新视频数据
        setVideoData(prev => ({
          ...prev,
          source: fullVideoUrl,
          fileName: videoFileName, // 保存视频文件名
          title: searchTerm ? `${searchTerm} - AI生成视频` : 'AI生成视频',
          description: searchTerm 
            ? `关于"${searchTerm}"的AI生成视频内容。该视频基于您的搜索关键词自动生成，为您提供个性化的学习体验。`
            : 'AI为您生成的个性化学习视频。',
          thumbnail: "https://cdn.pixabay.com/photo/2017/01/25/17/35/background-2008590_1280.jpg",
          isFromAIProduct: result.isFromAIProduct || false // 标识来源
        }));
        
        console.log('✅ AI视频处理成功（已从AI_product移动到video）:', result);
        console.log('🎬 视频文件名:', videoFileName);
      } else {
        console.log('ℹ️ 没有找到AI视频文件，使用默认视频');
      }
    } catch (error) {
      console.error('❌ 处理AI视频异常:', error);
    } finally {
      setIsProcessingVideo(false);
    }
  };

  /**
   * 处理关闭容器
   */
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 600);
  };

  return (
    <div 
      id="learning-container"
      className={`learning-container ${isVisible ? 'visible' : ''}`}
      style={{ display: 'block' }}
    >
      {/* 学习容器头部 */}
      <div className="learning-header">
        <h2>
          <i className={`fas ${isProcessingVideo ? 'fa-spinner fa-spin' : 'fa-play-circle'}`}></i>
          {isProcessingVideo ? '正在处理AI视频...' : videoData.title}
        </h2>
        <div className="video-controls">
          <button 
            className="control-btn" 
            title="关闭"
            onClick={handleClose}
            style={{
              background: '#6b7a8e',
              color: 'white',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(107, 122, 142, 0.3)',
              width: 'auto',
              height: 'auto'
            }}
          >
            <i className="fas fa-times"></i>
            关闭
          </button>
        </div>
      </div>

      {/* 视频和聊天主体区域 */}
      <div className="video-main">
        {/* 左侧视频播放区域 */}
        <div className="player-section">
          {/* 视频播放器 */}
          <VideoPlayer videoData={videoData} />
          
          {/* 视频信息 */}
          <VideoInfo 
            videoData={videoData}
            searchTerm={searchTerm}
          />
        </div>

        {/* 右侧AI助手聊天区域 */}
        <div className="chat-section">
          <AIAssistant 
            chatHook={chatHook}
            authHook={authHook}
            videoTitle={videoData.title}
          />
        </div>
      </div>
    </div>
  );
};

export default LearningContainer; 