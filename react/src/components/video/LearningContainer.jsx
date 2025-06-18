import React, { useState, useEffect, useRef } from 'react';
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

// 等待状态的占位视频数据
const WAITING_VIDEO = {
  ...SAMPLE_VIDEO,
  source: '', // 空源，避免加载失败
  title: '等待AI视频生成...',
  description: '正在为您生成个性化的学习视频，请稍候...',
  isWaiting: true // 特殊标识
};

/**
 * 学习容器组件
 * 整合视频播放和AI聊天功能
 */
const LearningContainer = ({ searchTerm, onClose, authHook }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [videoData, setVideoData] = useState(WAITING_VIDEO);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false); // 防止重复处理
  const [monitoringStatus, setMonitoringStatus] = useState('waiting'); // waiting, monitoring, found, timeout
  const monitoringTimerRef = useRef(null);
  const monitoringStartTimeRef = useRef(null);
  
  // 使用聊天Hook
  const chatHook = useChat();

  // 组件挂载后显示动画和处理AI视频（只触发一次）
  useEffect(() => {
    console.log('📦 LearningContainer 组件挂载, hasProcessed:', hasProcessed);
    setTimeout(() => setIsVisible(true), 50);
    if (!hasProcessed) {
      console.log('🚀 首次挂载，开始监听AI视频生成');
      startVideoMonitoring();
    } else {
      console.log('🚫 已处理过，跳过AI视频处理');
    }
  }, []); // 移除hasProcessed依赖，避免循环触发

  // 清理定时器
  useEffect(() => {
    return () => {
      if (monitoringTimerRef.current) {
        clearInterval(monitoringTimerRef.current);
        console.log('🧹 清理监听定时器');
      }
    };
  }, []);

  // 根据搜索词更新视频标题
  useEffect(() => {
    if (searchTerm) {
      setVideoData(prev => ({
        ...prev,
        title: prev.isWaiting ? `正在生成"${searchTerm}"相关视频...` : `${searchTerm} - 学习视频`,
        description: prev.isWaiting 
          ? `正在为您生成关于"${searchTerm}"的个性化学习视频，请稍候...` 
          : `关于"${searchTerm}"的详细学习内容。本视频将为您全面介绍相关概念、原理和实际应用，帮助您深入理解这个主题。`
      }));
    }
  }, [searchTerm]);

  /**
   * 开始监听AI视频生成（持续5分钟）
   */
  const startVideoMonitoring = () => {
    if (hasProcessed || isProcessingVideo) {
      console.log('🚫 AI视频处理已执行过或正在处理中，跳过重复调用');
      return;
    }

    setIsProcessingVideo(true);
    setHasProcessed(true);
    setMonitoringStatus('monitoring');
    monitoringStartTimeRef.current = Date.now();
    
    // 设置等待状态的视频数据
    setVideoData({
      ...WAITING_VIDEO,
      title: searchTerm ? `正在生成"${searchTerm}"相关视频...` : '正在生成AI视频...',
      description: searchTerm 
        ? `正在为您生成关于"${searchTerm}"的个性化学习视频，预计需要几分钟时间，请耐心等待...`
        : '正在为您生成个性化的学习视频，预计需要几分钟时间，请耐心等待...'
    });
    
    console.log('🎯 开始5分钟AI视频监听');
    
    // 立即检查一次
    checkForAIVideo();
    
    // 设置定时检查（每10秒检查一次）
    monitoringTimerRef.current = setInterval(() => {
      const elapsedTime = Date.now() - monitoringStartTimeRef.current;
      const remainingTime = 300000 - elapsedTime; // 5分钟 = 300000毫秒
      
      if (remainingTime <= 0) {
        // 监听超时
        stopVideoMonitoring('timeout');
        return;
      }
      
      console.log(`⏰ 继续监听AI视频生成，剩余时间: ${Math.ceil(remainingTime / 1000)}秒`);
      checkForAIVideo();
    }, 10000); // 每10秒检查一次
  };

  /**
   * 停止监听
   */
  const stopVideoMonitoring = (reason = 'manual') => {
    if (monitoringTimerRef.current) {
      clearInterval(monitoringTimerRef.current);
      monitoringTimerRef.current = null;
    }
    
    setIsProcessingVideo(false);
    
    if (reason === 'timeout') {
      setMonitoringStatus('timeout');
      console.log('⏰ AI视频监听超时（5分钟），使用默认视频');
      // 超时后使用默认视频
      setVideoData({
        ...SAMPLE_VIDEO,
        title: searchTerm ? `${searchTerm} - 学习视频` : '默认学习视频',
        description: searchTerm 
          ? `关于"${searchTerm}"的学习内容。AI视频生成超时，为您提供默认学习视频。`
          : '默认学习视频内容。AI视频生成超时，为您提供基础学习材料。'
      });
    } else if (reason === 'found') {
      setMonitoringStatus('found');
      console.log('✅ 找到AI视频，停止监听');
    } else {
      setMonitoringStatus('waiting');
      console.log('🛑 手动停止AI视频监听');
    }
  };

  /**
   * 检查AI生成的视频
   */
  const checkForAIVideo = async () => {
    try {
      const result = await processAIVideo();
      
      if (result.success && result.videoUrl) {
        // 找到AI视频，停止监听
        stopVideoMonitoring('found');
        
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
          isFromAIProduct: result.isFromAIProduct || false, // 标识来源
          isWaiting: false // 不再是等待状态
        }));
        
        console.log('✅ AI视频处理成功（已从AI_product移动到video）:', result);
        console.log('🎬 视频文件名:', videoFileName);
      } else {
        console.log('🔍 暂未找到AI视频文件，继续监听...');
      }
    } catch (error) {
      console.error('❌ 检查AI视频异常:', error);
    }
  };

  /**
   * 处理AI生成的视频（只允许执行一次） - 已被新的监听机制替代
   */
  const handleProcessAIVideo = async () => {
    // 这个函数已被 startVideoMonitoring 替代
    console.warn('⚠️ handleProcessAIVideo 已被新的监听机制替代');
  };

  /**
   * 处理关闭容器
   */
  const handleClose = () => {
    // 停止监听
    stopVideoMonitoring('manual');
    setIsVisible(false);
    setTimeout(() => onClose(), 600);
  };

  /**
   * 获取监听状态显示文本
   */
  const getMonitoringStatusText = () => {
    switch (monitoringStatus) {
      case 'monitoring':
        return '正在监听AI视频生成...';
      case 'found':
        return 'AI视频已生成';
      case 'timeout':
        return '监听超时，使用默认视频';
      default:
        return videoData.title;
    }
  };

  /**
   * 获取监听状态图标
   */
  const getMonitoringStatusIcon = () => {
    switch (monitoringStatus) {
      case 'monitoring':
        return 'fa-spinner fa-spin';
      case 'found':
        return 'fa-check-circle';
      case 'timeout':
        return 'fa-clock';
      default:
        return 'fa-play-circle';
    }
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
          <i className={`fas ${getMonitoringStatusIcon()}`}></i>
          {getMonitoringStatusText()}
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