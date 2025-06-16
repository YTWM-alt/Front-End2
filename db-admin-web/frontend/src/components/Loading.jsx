import React from 'react';

/**
 * 加载动画组件
 * @param {string} text - 加载提示文字
 * @param {string} size - 加载动画的大小
 */
const Loading = ({ text = '加载中...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className="loading-container">
      <div className="loading-content">
        {/* 主要的螺旋加载器 */}
        <div className="relative">
          <div className={`loading-spinner ${sizeClasses[size]}`}>
            <div className="loading-ring loading-ring-1"></div>
            <div className="loading-ring loading-ring-2"></div>
            <div className="loading-ring loading-ring-3"></div>
          </div>
          
          {/* 中心脉冲点 */}
          <div className="loading-center-dot"></div>
        </div>

        {/* 加载文本 */}
        {text && (
          <div className={`loading-text ${textSizeClasses[size]}`}>
            {text}
            <span className="loading-dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>
        )}
      </div>

      <style jsx>{`
        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-12);
          min-height: 200px;
          position: relative;
        }

        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-6);
        }

        .loading-spinner {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid transparent;
          animation: spin 2s linear infinite;
        }

        .loading-ring-1 {
          width: 100%;
          height: 100%;
          border-top: 2px solid var(--primary-color);
          border-right: 2px solid rgba(14, 165, 233, 0.3);
          animation-duration: 1.5s;
        }

        .loading-ring-2 {
          width: 80%;
          height: 80%;
          border-top: 2px solid var(--secondary-color);
          border-left: 2px solid rgba(6, 182, 212, 0.3);
          animation-duration: 1.8s;
          animation-direction: reverse;
        }

        .loading-ring-3 {
          width: 60%;
          height: 60%;
          border-top: 2px solid var(--accent-color);
          border-bottom: 2px solid rgba(139, 92, 246, 0.3);
          animation-duration: 1.2s;
        }

        .loading-center-dot {
          position: absolute;
          width: 12px;
          height: 12px;
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
          box-shadow: 0 0 12px rgba(14, 165, 233, 0.4);
        }

        .loading-text {
          color: var(--text-secondary);
          font-weight: 500;
          text-align: center;
          display: flex;
          align-items: center;
          gap: var(--spacing-1);
        }

        .loading-dots {
          display: inline-flex;
          gap: 1px;
        }

        .loading-dots span {
          animation: dots 1.5s ease-in-out infinite;
          opacity: 0.4;
        }

        .loading-dots span:nth-child(1) {
          animation-delay: 0s;
        }

        .loading-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .loading-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
        }

        @keyframes dots {
          0%, 60%, 100% {
            opacity: 0.4;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-8px);
          }
        }

        /* 响应式调整 */
        @media (max-width: 640px) {
          .loading-container {
            padding: var(--spacing-8);
            min-height: 150px;
          }
        }

        /* 减少动画模式 */
        @media (prefers-reduced-motion: reduce) {
          .loading-ring,
          .loading-center-dot,
          .loading-dots span {
            animation: none;
          }
          
          .loading-ring-1 {
            border: 2px solid var(--primary-color);
          }
        }
      `}</style>
    </div>
  );
};

export default Loading; 