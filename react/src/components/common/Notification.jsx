import React, { useEffect, useState } from 'react';
import { NOTIFICATION_TYPES } from '../../utils/constants';

/**
 * 通知组件
 * 显示系统消息和用户反馈
 */
const Notification = ({ message, type = NOTIFICATION_TYPES.INFO, onClose, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  // 组件挂载后显示动画
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
    
    // 自动隐藏
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  /**
   * 获取通知图标
   */
  const getIcon = () => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return 'fas fa-check-circle';
      case NOTIFICATION_TYPES.ERROR:
        return 'fas fa-exclamation-circle';
      case NOTIFICATION_TYPES.WARNING:
        return 'fas fa-exclamation-triangle';
      default:
        return 'fas fa-info-circle';
    }
  };

  return (
    <div className={`notification ${type} ${isVisible ? 'show' : ''}`}>
      <i className={getIcon()}></i>
      {message}
    </div>
  );
};

export default Notification; 