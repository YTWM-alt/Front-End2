import React from 'react';

/**
 * 分页组件
 * @param {number} currentPage - 当前页码
 * @param {number} totalPages - 总页数
 * @param {function} onPageChange - 页码变化回调
 * @param {number} total - 总条数
 * @param {number} pageSize - 每页显示条数
 */
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  total = 0,
  pageSize = 20
}) => {
  if (totalPages <= 1) return null;

  // 生成页码数组
  const getPageNumbers = () => {
    const delta = 2; // 当前页前后显示的页数
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  return (
    <div className="pagination-container">
      {/* 数据统计信息 */}
      <div className="pagination-info">
        <span className="text-sm text-secondary">
          显示第 <span className="font-semibold text-primary">{startItem}</span> 到{' '}
          <span className="font-semibold text-primary">{endItem}</span> 条，
          共 <span className="font-semibold text-primary">{total}</span> 条数据
        </span>
      </div>

      {/* 分页控件 */}
      <div className="pagination-controls">
        {/* 上一页按钮 */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-btn pagination-btn-nav"
          title="上一页"
        >
          <svg className="pagination-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="pagination-nav-text">上一页</span>
        </button>

        {/* 页码按钮 */}
        <div className="pagination-numbers">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="pagination-dots">
                  <svg className="pagination-dots-icon" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="4" cy="10" r="1.5" />
                    <circle cx="10" cy="10" r="1.5" />
                    <circle cx="16" cy="10" r="1.5" />
                  </svg>
                </span>
              ) : (
                <button
                  onClick={() => onPageChange(page)}
                  className={`pagination-btn pagination-btn-number ${
                    page === currentPage ? 'pagination-btn-active' : ''
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* 下一页按钮 */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-btn pagination-btn-nav"
          title="下一页"
        >
          <span className="pagination-nav-text">下一页</span>
          <svg className="pagination-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        .pagination-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--spacing-6);
          padding: var(--spacing-6) 0;
          border-top: 1px solid var(--border-primary);
          margin-top: var(--spacing-6);
          background: linear-gradient(135deg, 
            rgba(240, 249, 255, 0.5) 0%, 
            rgba(255, 255, 255, 0.8) 100%
          );
          backdrop-filter: blur(10px);
          border-radius: var(--border-radius-xl);
        }

        .pagination-info {
          flex: 1;
          min-width: 0;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
        }

        .pagination-numbers {
          display: flex;
          align-items: center;
          gap: var(--spacing-1);
        }

        .pagination-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-2) var(--spacing-3);
          border: 1px solid var(--border-primary);
          border-radius: var(--border-radius-lg);
          background: rgba(255, 255, 255, 0.9);
          color: var(--text-secondary);
          font-size: var(--text-sm);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-normal);
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
          min-width: 40px;
          height: 40px;
        }

        .pagination-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transition: left var(--transition-smooth);
        }

        .pagination-btn:hover::before {
          left: 100%;
        }

        .pagination-btn:hover:not(:disabled) {
          border-color: var(--primary-color);
          color: var(--primary-color);
          background: rgba(14, 165, 233, 0.05);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .pagination-btn:active:not(:disabled) {
          transform: translateY(0);
          transition: transform var(--transition-fast);
        }

        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }

        .pagination-btn:disabled:hover {
          border-color: var(--border-primary);
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.9);
          transform: none;
          box-shadow: none;
        }

        .pagination-btn-nav {
          gap: var(--spacing-2);
          padding: var(--spacing-2) var(--spacing-4);
          min-width: auto;
        }

        .pagination-btn-number {
          font-weight: 600;
        }

        .pagination-btn-active {
          background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
          color: var(--text-inverse);
          border-color: var(--primary-color);
          box-shadow: var(--shadow-md), 0 0 0 3px rgba(14, 165, 233, 0.1);
          transform: scale(1.05);
        }

        .pagination-btn-active:hover {
          background: linear-gradient(135deg, var(--primary-dark), var(--primary-color));
          transform: scale(1.05) translateY(-2px);
          box-shadow: var(--shadow-lg), 0 0 0 3px rgba(14, 165, 233, 0.2);
        }

        .pagination-icon {
          width: 16px;
          height: 16px;
          transition: transform var(--transition-normal);
        }

        .pagination-btn:hover:not(:disabled) .pagination-icon {
          transform: scale(1.1);
        }

        .pagination-nav-text {
          font-size: var(--text-sm);
          font-weight: 500;
        }

        .pagination-dots {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          color: var(--text-tertiary);
        }

        .pagination-dots-icon {
          width: 20px;
          height: 20px;
          opacity: 0.6;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
          .pagination-container {
            flex-direction: column;
            gap: var(--spacing-4);
            align-items: stretch;
            text-align: center;
          }

          .pagination-info {
            order: 2;
          }

          .pagination-controls {
            order: 1;
            justify-content: center;
          }

          .pagination-nav-text {
            display: none;
          }

          .pagination-btn {
            min-width: 36px;
            height: 36px;
            padding: var(--spacing-2);
          }

          .pagination-btn-nav {
            padding: var(--spacing-2);
          }
        }

        @media (max-width: 480px) {
          .pagination-numbers {
            gap: 1px;
          }

          .pagination-btn {
            min-width: 32px;
            height: 32px;
            font-size: var(--text-xs);
          }

          .pagination-info .text-sm {
            font-size: var(--text-xs);
          }
        }

        /* 减少动画模式 */
        @media (prefers-reduced-motion: reduce) {
          .pagination-btn,
          .pagination-icon {
            transition: none;
          }
          
          .pagination-btn:hover:not(:disabled) {
            transform: none;
          }
          
          .pagination-btn-active {
            transform: none;
          }
        }

        /* 焦点状态 */
        .pagination-btn:focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default Pagination; 