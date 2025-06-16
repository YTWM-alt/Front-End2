import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Layout.css'

// 简单的图标组件
const Icon = ({ name, size = 20 }) => {
  const icons = {
    dashboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
      </svg>
    ),
    users: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 7c0-2.21-1.79-4-4-4S8 4.79 8 7s1.79 4 4 4 4-1.79 4-4zm-4 7c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z"/>
      </svg>
    ),
    questions: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.07,12.85c0.77-1.39,2.25-2.21,3.11-3.44c0.91-1.29,0.4-3.7-2.18-3.7c-1.69,0-2.52,1.28-2.87,2.34L6.54,6.96C7.25,4.83,9.18,3,11.99,3c2.35,0,3.96,1.07,4.78,2.41c0.7,1.15,1.11,3.3,0.03,4.9c-1.2,1.77-2.35,2.31-2.97,3.45c-0.25,0.46-0.35,0.76-0.35,2.24h-2.89C10.58,15.22,10.46,13.95,11.07,12.85z M14,20c0,1.1-0.9,2-2,2s-2-0.9-2-2c0-1.1,0.9-2,2-2S14,18.9,14,20z"/>
      </svg>
    ),
    videos: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
      </svg>
    ),
    feedbacks: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/>
      </svg>
    ),
    menu: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
      </svg>
    ),
    close: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    ),
    logo: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5"/>
      </svg>
    )
  }
  
  return icons[name] || <div style={{width: size, height: size}} />
}

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: '仪表板', href: '/dashboard', icon: 'dashboard' },
    { name: '用户管理', href: '/users', icon: 'users' },
    { name: '问题管理', href: '/questions', icon: 'questions' },
    { name: '视频管理', href: '/videos', icon: 'videos' },
    { name: '反馈管理', href: '/feedbacks', icon: 'feedbacks' }
  ]

  const isActive = (href) => location.pathname === href

  return (
    <div className="layout">
      {/* 移动端遮罩层 */}
      {sidebarOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Logo区域 */}
        <div className="sidebar-header">
          <div className="logo">
            <Icon name="logo" size={32} />
            <div className="logo-text">
              <h2>智映教匠</h2>
              <p>数据库管理系统</p>
            </div>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`nav-link ${isActive(item.href) ? 'nav-link-active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon name={item.icon} size={20} />
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* 侧边栏底部 */}
        <div className="sidebar-footer">
          <div className="status-indicator">
            <div className="status-dot online"></div>
            <span>系统运行正常</span>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="main-container">
        {/* 顶部栏 */}
        <header className="header">
          <div className="header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Icon name={sidebarOpen ? 'close' : 'menu'} size={24} />
            </button>
            <h1 className="page-title">
              {navigation.find(item => item.href === location.pathname)?.name || '数据库管理'}
            </h1>
          </div>
          
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">
                <Icon name="users" size={20} />
              </div>
              <span>管理员</span>
            </div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="main-content fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout 