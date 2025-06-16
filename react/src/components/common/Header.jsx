import React, { useState, useRef, useEffect } from 'react';
import { APP_CONFIG, NAV_ITEMS, USER_MENU_ITEMS, LANGUAGES } from '../../utils/constants';

/**
 * 页面头部导航组件
 * 包含Logo、导航菜单、语言切换器和用户状态
 */
const Header = ({ authHook, onLoginClick, onLogout, onNavigate, currentPage }) => {
  const { isLoggedIn, user, getUserAvatar } = authHook;
  
  // 用户下拉菜单状态
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('zh');
  
  // 下拉菜单引用
  const dropdownRef = useRef(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * 处理Logo点击
   */
  const handleLogoClick = () => {
    onNavigate('home');
  };

  /**
   * 处理导航链接点击
   * @param {Object} item - 导航项
   */
  const handleNavClick = (item) => {
    console.log(`导航到: ${item.label}`);
    
    // 根据导航项key进行页面切换
    switch (item.key) {
      case 'videos':
        onNavigate('my-videos');
        break;
      case 'community':
        onNavigate('community');
        break;
      case 'feedback':
        onNavigate('feedback');
        break;
      default:
        console.log(`未知导航项: ${item.key}`);
    }
  };

  /**
   * 处理语言切换
   * @param {string} langCode - 语言代码
   */
  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    console.log(`切换语言到: ${LANGUAGES[langCode].name}`);
    // TODO: 实现国际化语言切换
  };

  /**
   * 切换用户下拉菜单
   */
  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  /**
   * 处理用户菜单项点击
   * @param {Object} item - 菜单项
   */
  const handleUserMenuClick = (item) => {
    setShowUserDropdown(false);
    
    switch (item.key) {
      case 'logout':
        onLogout();
        break;
      case 'profile':
        onNavigate('profile');
        break;
      default:
        console.log(`点击菜单项: ${item.label}`);
    }
  };

  return (
    <nav>
      {/* Logo区域 */}
      <a 
        href="#" 
        className="logo"
        onClick={(e) => {
          e.preventDefault();
          handleLogoClick();
        }}
      >
        <img 
          src="/logo.png" 
          alt="智映教匠Logo" 
          style={{
            width: '48px',
            height: '48px',
            objectFit: 'contain'
          }}
        />
        <span className="logo-text">{APP_CONFIG.name}</span>
      </a>

      {/* 导航链接 */}
      <div className="nav-links">
        {NAV_ITEMS.map((item) => (
          <a 
            key={item.key}
            href="#"
            className={
              (currentPage === 'my-videos' && item.key === 'videos') ||
              (currentPage === 'community' && item.key === 'community') ||
              (currentPage === 'feedback' && item.key === 'feedback')
                ? 'active' : ''
            }
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(item);
            }}
          >
            {item.label}
          </a>
        ))}
      </div>

      {/* 右侧功能区域 */}
      <div className="nav-right">
        {/* 语言切换器 */}
        <div className="language-switcher">
          {Object.values(LANGUAGES).map((lang) => (
            <button
              key={lang.code}
              className={currentLanguage === lang.code ? 'active' : ''}
              onClick={() => handleLanguageChange(lang.code)}
            >
              {lang.name}
            </button>
          ))}
        </div>

        {/* 用户状态区域 */}
        {isLoggedIn ? (
          <div className="user-profile-container" ref={dropdownRef}>
            {/* 已登录用户信息 */}
            <div 
              className="user-profile" 
              onClick={toggleUserDropdown}
            >
              <div className="user-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt="用户头像" style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }} />
                ) : (
                  getUserAvatar()
                )}
              </div>
              <div className="user-name">
                {user.name}
              </div>
            </div>

            {/* 用户下拉菜单 */}
            {showUserDropdown && (
              <div className="user-dropdown visible">
                {/* 下拉菜单头部 */}
                <div className="dropdown-header">
                  <div className="user-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt="用户头像" style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }} />
                    ) : (
                      getUserAvatar()
                    )}
                  </div>
                  <div>
                    <div className="user-name">{user.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--gray)' }}>
                      高级会员
                    </div>
                  </div>
                </div>

                {/* 下拉菜单操作项 */}
                <div className="dropdown-actions">
                  {USER_MENU_ITEMS.map((item) => (
                    <div
                      key={item.key}
                      className={`dropdown-item ${item.className || ''}`}
                      onClick={() => handleUserMenuClick(item)}
                    >
                      <i className={item.icon}></i>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 未登录状态显示登录按钮 */
          <button 
            className="login-btn" 
            onClick={onLoginClick}
          >
            登录
          </button>
        )}
      </div>
    </nav>
  );
};

export default Header; 