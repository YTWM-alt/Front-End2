import React, { useState, useEffect } from 'react';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import HeroSection from './components/common/HeroSection';
import LearningContainer from './components/video/LearningContainer';
import AuthModal from './components/auth/AuthModal';
import Notification from './components/common/Notification';
import FloatingElements from './components/common/FloatingElements';
import MyVideos from './pages/MyVideos';
import Feedback from './pages/Feedback';
import Profile from './pages/Profile';
import Community from './pages/Community';
import { useAuth } from './hooks/useAuth';

/**
 * 主应用组件
 * 整合所有功能模块，管理全局状态和页面切换
 */
const App = () => {
  // 用户认证Hook
  const authHook = useAuth();
  
  // 应用状态管理
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'my-videos' | 'community' | 'feedback' | 'profile'
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLearningContainer, setShowLearningContainer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  // 页面初始化效果
  useEffect(() => {
    // 页面加载完成后的初始化逻辑
    console.log('智映教匠AI平台已加载');
    console.log('💾 输入内容自动保存到question文件夹');
  }, []);

  /**
   * 显示通知消息
   * @param {string} message - 通知内容
   * @param {string} type - 通知类型 (success, error, warning, info)
   */
  const showNotification = (message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      message,
      type
    };
    setNotification(newNotification);

    // 3秒后自动隐藏通知
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  /**
   * 处理页面导航
   * @param {string} page - 页面名称
   */
  const handleNavigate = (page) => {
    setCurrentPage(page);
    // 切换页面时关闭学习容器
    if (showLearningContainer) {
      setShowLearningContainer(false);
      setSearchTerm('');
    }
  };

  /**
   * 处理搜索功能
   * @param {string|object} searchData - 搜索词或搜索数据对象
   */
  const handleSearch = (searchData) => {
    let question = '';
    let filters = {};
    
    // 处理搜索数据
    if (typeof searchData === 'string') {
      question = searchData;
    } else if (searchData && typeof searchData === 'object') {
      question = searchData.question || '';
      filters = searchData.filters || {};
    }
    
    if (!question || question.trim() === '') {
      showNotification('请输入搜索内容', 'error');
      return;
    }

    // 确保在主页
    setCurrentPage('home');
    
    // 更新搜索词
    setSearchTerm(question.trim());
    
    // 显示学习容器
    setShowLearningContainer(true);
    
    // 构建通知消息
    let message = 'AI正在为您生成学习内容...';
    if (filters.gradeLabel || filters.subjectLabel) {
      message = `AI正在为您生成${filters.gradeLabel || ''}${filters.subjectLabel || ''}相关的学习内容...`;
    }
    
    // 显示成功通知
    showNotification(message, 'success');
    
    // 滚动到学习容器
    setTimeout(() => {
      const learningElement = document.getElementById('learning-container');
      if (learningElement) {
        learningElement.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 300);
  };

  /**
   * 处理登录按钮点击
   */
  const handleLoginClick = () => {
    setShowAuthModal(true);
  };

  /**
   * 关闭认证模态框
   */
  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
  };

  /**
   * 关闭学习容器
   */
  const handleCloseLearningContainer = () => {
    setShowLearningContainer(false);
    setSearchTerm('');
  };

  /**
   * 处理用户登录成功
   * @param {string} message - 成功消息
   */
  const handleLoginSuccess = (message) => {
    setShowAuthModal(false);
    showNotification(message, 'success');
  };

  /**
   * 处理用户注册成功
   * @param {string} message - 成功消息
   */
  const handleRegisterSuccess = (message) => {
    setShowAuthModal(false);
    showNotification(message, 'success');
  };

  /**
   * 处理用户登出
   */
  const handleLogout = () => {
    authHook.logout();
    showNotification('您已成功退出登录', 'success');
    
    // 如果正在学习，关闭学习容器
    if (showLearningContainer) {
      setShowLearningContainer(false);
      setSearchTerm('');
    }
  };

  /**
   * 处理认证错误
   * @param {string} message - 错误消息
   */
  const handleAuthError = (message) => {
    showNotification(message, 'error');
  };

  // 渲染主页内容
  const renderHomePage = () => (
    <>
      {/* 浮动装饰元素 */}
      <FloatingElements />

      {/* 主容器 */}
      <div className="container">
        {/* 页面头部导航 */}
        <Header 
          authHook={authHook}
          onLoginClick={handleLoginClick}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          currentPage={currentPage}
        />

        {/* 主要内容区域 */}
        <main>
          {/* 主页面标题和搜索区域 */}
          <HeroSection 
            onSearch={handleSearch}
            searchTerm={searchTerm}
          />

          {/* 学习容器 - 视频播放和AI聊天 */}
          {showLearningContainer && (
            <LearningContainer
              searchTerm={searchTerm}
              onClose={handleCloseLearningContainer}
              authHook={authHook}
            />
          )}
        </main>

        {/* 页脚 */}
        <Footer />
      </div>
    </>
  );

  // 渲染我的视频页面
  const renderMyVideosPage = () => (
    <MyVideos 
      authHook={authHook}
      onNavigate={handleNavigate}
      onLoginClick={handleLoginClick}
      onLogout={handleLogout}
      showNotification={showNotification}
    />
  );

  // 渲染问题反馈页面
  const renderFeedbackPage = () => (
    <Feedback 
      authHook={authHook}
      onNavigate={handleNavigate}
      onLoginClick={handleLoginClick}
      onLogout={handleLogout}
      showNotification={showNotification}
    />
  );

  // 渲染社区页面
  const renderCommunityPage = () => (
    <Community 
      authHook={authHook}
      onNavigate={handleNavigate}
      showNotification={showNotification}
    />
  );

  // 渲染个人中心页面
  const renderProfilePage = () => (
    <Profile 
      authHook={authHook}
      onNavigate={handleNavigate}
      onLoginClick={handleLoginClick}
      onLogout={handleLogout}
      showNotification={showNotification}
    />
  );

  return (
    <div className="App">
      {/* 根据当前页面状态渲染对应内容 */}
      {currentPage === 'home' && renderHomePage()}
      {currentPage === 'my-videos' && renderMyVideosPage()}
      {currentPage === 'community' && renderCommunityPage()}
      {currentPage === 'feedback' && renderFeedbackPage()}
      {currentPage === 'profile' && renderProfilePage()}

      {/* 认证模态框 */}
      {showAuthModal && (
        <AuthModal
          authHook={authHook}
          onClose={handleCloseAuthModal}
          onLoginSuccess={handleLoginSuccess}
          onRegisterSuccess={handleRegisterSuccess}
          onError={handleAuthError}
        />
      )}

      {/* 通知组件 */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default App; 