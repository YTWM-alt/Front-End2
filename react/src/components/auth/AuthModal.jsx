import React, { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { MODAL_TYPES } from '../../utils/constants';

/**
 * 认证模态框组件
 * 包含登录和注册表单的切换
 */
const AuthModal = ({ authHook, onClose, onLoginSuccess, onRegisterSuccess, onError }) => {
  const [currentTab, setCurrentTab] = useState(MODAL_TYPES.LOGIN);
  const [isActive, setIsActive] = useState(false);

  // 组件挂载后显示动画
  useEffect(() => {
    setTimeout(() => setIsActive(true), 10);
  }, []);

  /**
   * 处理模态框关闭
   */
  const handleClose = () => {
    setIsActive(false);
    setTimeout(() => onClose(), 300);
  };

  /**
   * 处理背景点击关闭
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  /**
   * 切换标签页
   */
  const handleTabChange = (tab) => {
    setCurrentTab(tab);
  };

  /**
   * 处理登录成功
   */
  const handleLoginSuccess = (message) => {
    onLoginSuccess(message);
  };

  /**
   * 处理注册成功
   */
  const handleRegisterSuccess = (message) => {
    onRegisterSuccess(message);
  };

  /**
   * 处理Google登录
   */
  const handleGoogleLogin = async () => {
    const result = await authHook.loginWithGoogle();
    if (result.success) {
      handleLoginSuccess(result.message);
    } else {
      onError(result.message);
    }
  };

  return (
    <div 
      className="modal-backdrop" 
      style={{ display: 'flex' }}
      onClick={handleBackdropClick}
    >
      <div className={`auth-modal ${isActive ? 'modal-active' : ''}`}>
        {/* 关闭按钮 */}
        <button className="close-modal" onClick={handleClose}>
          <i className="fas fa-times"></i>
        </button>

        {/* 标签页切换 */}
        <div className="modal-tabs">
          <button
            className={`tab-btn ${currentTab === MODAL_TYPES.LOGIN ? 'active' : ''}`}
            onClick={() => handleTabChange(MODAL_TYPES.LOGIN)}
          >
            登录
          </button>
          <button
            className={`tab-btn ${currentTab === MODAL_TYPES.REGISTER ? 'active' : ''}`}
            onClick={() => handleTabChange(MODAL_TYPES.REGISTER)}
          >
            注册
          </button>
        </div>

        {/* 表单内容 */}
        {currentTab === MODAL_TYPES.LOGIN ? (
          <LoginForm
            authHook={authHook}
            onSuccess={handleLoginSuccess}
            onError={onError}
            onGoogleLogin={handleGoogleLogin}
            onSwitchToRegister={() => handleTabChange(MODAL_TYPES.REGISTER)}
          />
        ) : (
          <RegisterForm
            authHook={authHook}
            onSuccess={handleRegisterSuccess}
            onError={onError}
            onGoogleLogin={handleGoogleLogin}
            onSwitchToLogin={() => handleTabChange(MODAL_TYPES.LOGIN)}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal; 