import React from 'react';
import { APP_CONFIG } from '../../utils/constants';

/**
 * 页脚组件
 * 显示品牌信息和版权声明
 */
const Footer = () => {
  return (
    <footer>
      <div className="footer-brand">{APP_CONFIG.name}· AI平台</div>
      <p className="footer-subtitle">Academind· AI platform</p>
      <p>广州大学网络空间安全学院</p>
    </footer>
  );
};

export default Footer; 