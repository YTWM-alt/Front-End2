import React, { useState, useEffect } from 'react'
import axios from 'axios'

// 简单的图标组件
const Icon = ({ name, size = 20 }) => {
  const icons = {
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
    trending: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
      </svg>
    ),
    refresh: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
      </svg>
    )
  }
  
  return icons[name] || <div style={{width: size, height: size}} />
}

const StatCard = ({ title, value, subValue, icon, color, trend }) => {
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-secondary mb-2">{title}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{value}</span>
              {subValue && (
                <span className="text-sm text-secondary">/ {subValue}</span>
              )}
            </div>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <Icon name="trending" size={16} />
                <span className="text-sm text-success">{trend}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-${color}-100`}>
            <Icon name={icon} size={24} />
          </div>
        </div>
      </div>
    </div>
  )
}

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/dashboard/stats')
      if (response.data.success) {
        setStats(response.data.data)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // 每30秒自动刷新
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loading"></div>
        <span className="ml-2">加载中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">仪表板</h1>
          <p className="text-secondary mt-1">
            数据库管理系统概览 - 最后更新: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="btn btn-primary"
        >
          <Icon name="refresh" size={16} />
          {loading ? '刷新中...' : '刷新数据'}
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="用户总数"
          value={stats?.users?.total || 0}
          subValue={`${stats?.users?.active || 0} 活跃`}
          icon="users"
          color="primary"
          trend="+12% 本月"
        />
        
        <StatCard
          title="问题管理"
          value={stats?.questions?.total || 0}
          subValue={`${stats?.questions?.pending || 0} 待处理`}
          icon="questions"
          color="warning"
          trend="+8% 本周"
        />
        
        <StatCard
          title="视频文件"
          value={stats?.videos?.total || 0}
          subValue={formatFileSize(stats?.videos?.total_size)}
          icon="videos"
          color="info"
          trend="+5 个新文件"
        />
        
        <StatCard
          title="用户反馈"
          value={stats?.feedbacks?.total || 0}
          subValue={`${stats?.feedbacks?.pending || 0} 待处理`}
          icon="feedbacks"
          color="success"
          trend="+3 条新反馈"
        />
      </div>

      {/* 系统状态 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 数据库状态 */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-4">数据库状态</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>连接状态</span>
                <div className="status-indicator">
                  <div className="status-dot online"></div>
                  <span>正常</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>总表数量</span>
                <span className="font-medium">5 个表</span>
              </div>
              <div className="flex items-center justify-between">
                <span>总记录数</span>
                <span className="font-medium">
                  {((stats?.users?.total || 0) + 
                    (stats?.questions?.total || 0) + 
                    (stats?.videos?.total || 0) + 
                    (stats?.feedbacks?.total || 0))} 条
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 最近活动 */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-4">系统信息</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>服务运行时间</span>
                <span className="font-medium">正常运行</span>
              </div>
              <div className="flex items-center justify-between">
                <span>管理端口</span>
                                    <span className="font-medium">8081</span>
              </div>
              <div className="flex items-center justify-between">
                <span>前端端口</span>
                <span className="font-medium">5173</span>
              </div>
              <div className="flex items-center justify-between">
                <span>数据库</span>
                <span className="font-medium">MySQL 8.0+</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="card">
        <div className="card-body">
          <h3 className="text-lg font-semibold mb-4">快速操作</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/users" className="btn btn-secondary">
              <Icon name="users" size={16} />
              管理用户
            </a>
            <a href="/questions" className="btn btn-secondary">
              <Icon name="questions" size={16} />
              管理问题
            </a>
            <a href="/videos" className="btn btn-secondary">
              <Icon name="videos" size={16} />
              管理视频
            </a>
            <a href="/feedbacks" className="btn btn-secondary">
              <Icon name="feedbacks" size={16} />
              管理反馈
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 