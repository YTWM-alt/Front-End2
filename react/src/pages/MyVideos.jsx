import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import FloatingElements from '../components/common/FloatingElements';
import Notification from '../components/common/Notification';
import { deleteVideo } from '../utils/api';

/**
 * 我的视频页面组件
 * 展示本地video文件夹中的所有视频文件，支持筛选功能
 */
const MyVideos = ({ authHook, onNavigate, onLoginClick, onLogout, showNotification }) => {
  const [notification, setNotification] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  // 筛选状态
  const [filters, setFilters] = useState({
    sizeCategory: 'all', // all, small, medium, large, xlarge
    durationCategory: 'all', // all, short, medium, long, xlong
    dateRange: 'all', // all, today, week, month, year
    sortBy: 'modifiedTime', // modifiedTime, createdTime, size, duration, filename
    sortOrder: 'desc' // desc, asc
  });
  const [filteredVideos, setFilteredVideos] = useState([]);

  // 获取视频列表
  useEffect(() => {
    fetchVideos();
  }, []);

  // 添加键盘快捷键支持 (ESC键返回主界面)
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape') {
        handleGoHome();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  /**
   * 从后端获取视频列表
   */
  const fetchVideos = async () => {
    try {
      setLoading(true);
      console.log('🔍 开始获取视频列表...');
      const timestamp = new Date().getTime();
      const url = `http://localhost:3003/videos/?_t=${timestamp}`;
      console.log('🌐 请求URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',  // 改回omit，因为我们不需要发送cookie
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      console.log('📥 收到响应:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 响应错误:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const text = await response.text();
      console.log('📄 原始响应文本:', text);
      
      let data;
      try {
        // 如果响应内容为空，返回空数组
        if (!text.trim()) {
          console.log('⚠️ 响应内容为空，使用空数组');
          data = { success: true, videos: [], count: 0 };
        } else {
          data = JSON.parse(text);
          console.log('✅ 解析后的数据:', data);
        }
      } catch (e) {
        console.error('❌ JSON解析错误:', e);
        throw new Error('响应格式错误');
      }

      // 检查data.success或自行构造一个有效的响应
      if ((data.success && Array.isArray(data.videos)) || Array.isArray(data)) {
        // 兼容两种可能的数据结构
        const videoArray = Array.isArray(data.videos) ? data.videos : (Array.isArray(data) ? data : []);
        console.log('✅ 获取视频列表成功:', videoArray);
        const processedVideos = videoArray.map(video => ({
          ...video,
          sizeCategory: getSizeCategory(video.file_size || 0),
          durationCategory: getDurationCategory(video.duration || 0),
          createdTime: video.upload_time || new Date().toISOString(),
          modifiedTime: video.upload_time || new Date().toISOString(),
          // 添加默认值
          title: video.title || '未命名视频',
          description: video.description || '',
          format: video.format || 'mp4',
          status: video.status || 'ready',
          file_size: video.file_size || 0,
          duration: video.duration || 0
        }));
        console.log('🎥 处理后的视频列表:', processedVideos);
        setVideos(processedVideos);
        setFilteredVideos(processedVideos);
        showLocalNotification(`成功加载 ${processedVideos.length} 个视频`, 'success');
      } else {
        console.warn('⚠️ 数据格式异常，使用空数组:', data);
        setVideos([]);
        setFilteredVideos([]);
        showLocalNotification('没有找到视频', 'info');
      }
    } catch (error) {
      console.error('❌ 获取视频列表错误:', error);
      setNotification({
        type: 'error',
        message: `获取视频列表失败: ${error.message}`
      });
      setVideos([]);
      setFilteredVideos([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取文件大小分类
   */
  const getSizeCategory = (size) => {
    const sizeInMB = size / (1024 * 1024);
    if (sizeInMB < 10) return 'small';
    if (sizeInMB < 50) return 'medium';
    if (sizeInMB < 200) return 'large';
    return 'xlarge';
  };

  /**
   * 获取视频时长分类
   */
  const getDurationCategory = (duration) => {
    if (duration < 60) return 'short';
    if (duration < 300) return 'medium';
    if (duration < 900) return 'long';
    return 'xlong';
  };

  /**
   * 应用筛选条件
   */
  const applyFilters = (videosToFilter) => {
    let filtered = [...videosToFilter];

    // 文件大小筛选
    if (filters.sizeCategory !== 'all') {
      filtered = filtered.filter(video => video.sizeCategory === filters.sizeCategory);
    }

    // 视频时长筛选
    if (filters.durationCategory !== 'all') {
      filtered = filtered.filter(video => video.durationCategory === filters.durationCategory);
    }

    // 创建日期筛选
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setDate(now.getDate());
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          break;
      }
      
      if (filters.dateRange !== 'all') {
        filtered = filtered.filter(video => new Date(video.createdTime) >= filterDate);
      }
    }

    // 排序
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (filters.sortBy) {
        case 'filename':
          valueA = a.filename.toLowerCase();
          valueB = b.filename.toLowerCase();
          break;
        case 'size':
          valueA = a.size;
          valueB = b.size;
          break;
        case 'duration':
          valueA = a.duration;
          valueB = b.duration;
          break;
        case 'createdTime':
          valueA = new Date(a.createdTime);
          valueB = new Date(b.createdTime);
          break;
        case 'modifiedTime':
        default:
          valueA = new Date(a.modifiedTime);
          valueB = new Date(b.modifiedTime);
          break;
      }

      if (filters.sortOrder === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });

    return filtered;
  };

  /**
   * 处理筛选条件变化
   */
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    console.log('🔍 筛选条件更新:', newFilters);
  };

  /**
   * 重置筛选条件
   */
  const resetFilters = () => {
    const defaultFilters = {
      sizeCategory: 'all',
      durationCategory: 'all',
      dateRange: 'all',
      sortBy: 'modifiedTime',
      sortOrder: 'desc'
    };
    setFilters(defaultFilters);
    console.log('🔄 筛选条件已重置');
    showLocalNotification('筛选条件已重置', 'info');
  };

  /**
   * 强制刷新视频数据（清除缓存）
   */
  const forceRefreshData = async () => {
    console.log('🔄 强制刷新视频数据...');
    showLocalNotification('正在强制刷新数据...', 'info');
    
    // 清除当前数据
    setVideos([]);
    setFilteredVideos([]);
    
    // 重新获取数据
    await fetchVideos();
  };

  /**
   * 获取筛选统计信息
   */
  const getFilterStats = () => {
    const stats = {
      total: videos.length,
      filtered: filteredVideos.length,
      sizeCategories: {},
      durationCategories: {},
      dateRanges: {}
    };

    videos.forEach(video => {
      // 统计文件大小分类
      stats.sizeCategories[video.sizeCategory] = (stats.sizeCategories[video.sizeCategory] || 0) + 1;
      
      // 统计时长分类
      stats.durationCategories[video.durationCategory] = (stats.durationCategories[video.durationCategory] || 0) + 1;
    });

    return stats;
  };

  // 当videos或filters变化时，重新应用筛选
  useEffect(() => {
    const filtered = applyFilters(videos);
    setFilteredVideos(filtered);
    console.log(`🎯 筛选结果: ${filtered.length}/${videos.length} 个视频`);
  }, [videos, filters]);

  /**
   * 显示本地通知消息
   */
  const showLocalNotification = (message, type = 'info') => {
    // 优先使用父组件传入的通知函数
    if (showNotification) {
      showNotification(message, type);
      return;
    }

    // 备用本地通知
    const newNotification = {
      id: Date.now(),
      message,
      type
    };
    setNotification(newNotification);

    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  /**
   * 处理登录按钮点击
   */
  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      showLocalNotification('请先登录查看您的视频', 'warning');
    }
  };

  /**
   * 处理返回主界面
   */
  const handleGoHome = () => {
    if (onNavigate) {
      onNavigate('home');
      showLocalNotification('正在返回主界面...', 'info');
    } else {
      // 备用方案：直接跳转到根路径
      window.location.href = '/';
    }
  };

  /**
   * 处理视频播放
   */
  const handlePlayVideo = (video) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
    showLocalNotification(`开始播放：${video.title}`, 'success');
  };

  /**
   * 关闭视频播放器
   */
  const handleClosePlayer = () => {
    setShowVideoPlayer(false);
    setSelectedVideo(null);
  };

  /**
   * 删除视频
   * @param {Object} video - 要删除的视频对象
   */
  const handleDeleteVideo = async (video, event) => {
    // 阻止事件冒泡，避免触发播放
    event.stopPropagation();
    
    // 确认删除
    const confirmDelete = window.confirm(
      `确定要删除视频 "${video.title}" 吗？\n\n文件名: ${video.filename}\n此操作不可撤销！`
    );
    
    if (!confirmDelete) {
      return;
    }
    
    try {
      showLocalNotification('正在删除视频...', 'info');
      
      // 调用删除API
      const result = await deleteVideo(video.filename);
      
      if (result.success) {
        // 删除成功，更新视频列表
        const updatedVideos = videos.filter(v => v.filename !== video.filename);
        setVideos(updatedVideos);
        
        showLocalNotification(`视频 "${video.title}" 已成功删除`, 'success');
        console.log(`🗑️ 视频删除成功: ${video.filename}`);
        
        // 如果当前正在播放被删除的视频，关闭播放器
        if (selectedVideo && selectedVideo.filename === video.filename) {
          handleClosePlayer();
        }
        
      } else {
        showLocalNotification(`删除失败: ${result.message}`, 'error');
        console.error('❌ 删除视频失败:', result.message);
      }
      
    } catch (error) {
      showLocalNotification('删除视频时发生错误', 'error');
      console.error('❌ 删除视频异常:', error);
    }
  };

  /**
   * 格式化时间
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  /**
   * 生成视频封面（使用视频的第一帧或默认图片）
   */
  const getVideoThumbnail = (video) => {
    // 这里可以使用视频的第一帧作为封面，暂时使用默认图片
    const defaultThumbnails = [
      'https://cdn.pixabay.com/photo/2017/01/25/17/35/background-2008590_1280.jpg',
      'https://cdn.pixabay.com/photo/2016/11/19/14/00/code-1839877_1280.jpg',
      'https://cdn.pixabay.com/photo/2017/05/30/03/58/building-2355722_1280.jpg',
      'https://cdn.pixabay.com/photo/2018/07/31/22/08/physics-3576896_1280.jpg',
      'https://cdn.pixabay.com/photo/2016/11/29/06/15/book-1867171_1280.jpg'
    ];
    
    // 根据视频ID选择不同的封面图
    const index = Math.abs(video.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % defaultThumbnails.length;
    return defaultThumbnails[index];
  };

  return (
    <div className="MyVideos">
      {/* 浮动装饰元素 */}
      <FloatingElements />

      {/* 主容器 */}
      <div className="container">
        {/* 页面头部导航 */}
        <Header 
          authHook={authHook}
          onLoginClick={handleLoginClick}
          onLogout={onLogout}
          onNavigate={onNavigate}
          currentPage="my-videos"
        />

        {/* 主要内容区域 */}
        <main style={{ minHeight: '70vh', paddingTop: '20px' }}>
          {/* 页面标题 */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '30px' 
          }}>
            <h1 style={{ 
              fontSize: '2.2rem', 
              color: 'var(--dark)', 
              marginBottom: '10px',
              fontWeight: '700'
            }}>
              <i className="fas fa-video" style={{ color: 'var(--primary)', marginRight: '10px' }}></i>
              我的视频库
            </h1>
            <p style={{ 
              color: 'var(--gray)', 
              fontSize: '1rem',
              marginBottom: '20px'
            }}>
              本地视频文件管理与播放
            </p>
            
            {/* 返回主界面按钮 */}
            <button
              onClick={handleGoHome}
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '25px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(74, 111, 227, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(74, 111, 227, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(74, 111, 227, 0.3)';
              }}
              title="返回AI平台主界面 (ESC键快捷返回)"
            >
              <i className="fas fa-home"></i>
              返回主界面
            </button>
          </div>

          {/* 筛选栏 */}
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '30px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
            border: '1px solid var(--light)'
          }}>
            {/* 筛选标题 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                color: 'var(--dark)',
                fontWeight: '600'
              }}>
                <i className="fas fa-filter" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
                筛选与排序
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ 
                  fontSize: '14px', 
                  color: 'var(--gray)',
                  background: 'var(--light)',
                  padding: '4px 12px',
                  borderRadius: '20px'
                }}>
                  {filteredVideos.length}/{videos.length} 个视频
                </span>
                <button
                  onClick={forceRefreshData}
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                  title="强制刷新视频数据，获取最新的文件信息"
                >
                  <i className="fas fa-sync-alt" style={{ marginRight: '5px' }}></i>
                  刷新
                </button>
                <button
                  onClick={resetFilters}
                  style={{
                    background: 'var(--warning)',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  <i className="fas fa-undo" style={{ marginRight: '5px' }}></i>
                  重置
                </button>
              </div>
            </div>

            {/* 筛选控件 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '15px'
            }}>
              {/* 视频大小筛选 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--dark)',
                  marginBottom: '8px'
                }}>
                  <i className="fas fa-hdd" style={{ color: 'var(--primary)', marginRight: '6px' }}></i>
                  视频大小
                </label>
                <select
                  value={filters.sizeCategory}
                  onChange={(e) => handleFilterChange('sizeCategory', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--light)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">全部大小</option>
                  <option value="small">小文件 (&lt;50MB)</option>
                  <option value="medium">中等 (50-200MB)</option>
                  <option value="large">大文件 (200-500MB)</option>
                  <option value="xlarge">超大 (&gt;500MB)</option>
                </select>
              </div>

              {/* 视频时长筛选 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--dark)',
                  marginBottom: '8px'
                }}>
                  <i className="fas fa-clock" style={{ color: 'var(--secondary)', marginRight: '6px' }}></i>
                  视频时长
                </label>
                <select
                  value={filters.durationCategory}
                  onChange={(e) => handleFilterChange('durationCategory', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--light)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">全部时长</option>
                  <option value="short">短视频 (&lt;5分钟)</option>
                  <option value="medium">中等 (5-30分钟)</option>
                  <option value="long">长视频 (30-120分钟)</option>
                  <option value="xlong">超长 (&gt;120分钟)</option>
                </select>
              </div>

              {/* 创建日期筛选 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--dark)',
                  marginBottom: '8px'
                }}>
                  <i className="fas fa-calendar" style={{ color: 'var(--warning)', marginRight: '6px' }}></i>
                  创建日期
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--light)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">全部日期</option>
                  <option value="today">今天</option>
                  <option value="week">最近一周</option>
                  <option value="month">最近一月</option>
                  <option value="year">最近一年</option>
                </select>
              </div>

              {/* 排序方式 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--dark)',
                  marginBottom: '8px'
                }}>
                  <i className="fas fa-sort" style={{ color: 'var(--success)', marginRight: '6px' }}></i>
                  排序方式
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid var(--light)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="modifiedTime">修改时间</option>
                    <option value="createdTime">创建时间</option>
                    <option value="filename">文件名</option>
                    <option value="size">文件大小</option>
                    <option value="duration">视频时长</option>
                  </select>
                  <button
                    onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid var(--light)',
                      borderRadius: '8px',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: 'var(--gray)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'var(--light)'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                    title={filters.sortOrder === 'desc' ? '点击切换为升序' : '点击切换为降序'}
                  >
                    <i className={`fas fa-sort-${filters.sortOrder === 'desc' ? 'down' : 'up'}`}></i>
                  </button>
                </div>
              </div>
            </div>

            {/* 筛选统计 */}
            {videos.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                paddingTop: '15px',
                borderTop: '1px solid var(--light)',
                fontSize: '13px',
                color: 'var(--gray)'
              }}>
                <span>
                  <i className="fas fa-chart-bar" style={{ marginRight: '5px' }}></i>
                  统计: 
                </span>
                {Object.entries(getFilterStats().sizeCategories).map(([category, count]) => (
                  <span key={category} style={{
                    background: 'var(--light)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {category === 'small' ? '小文件' : 
                     category === 'medium' ? '中等' :
                     category === 'large' ? '大文件' : '超大'}: {count}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 加载状态 */}
          {loading && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: 'var(--gray)',
              background: 'white',
              borderRadius: '15px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
              margin: '20px 0'
            }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
              <p>正在加载视频列表...</p>
            </div>
          )}

          {/* 错误状态 */}
          {!loading && notification?.type === 'error' && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: 'var(--danger)',
              background: 'white',
              borderRadius: '15px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
              margin: '20px 0'
            }}>
              <i className="fas fa-exclamation-circle" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
              <p>{notification.message}</p>
              <button
                onClick={fetchVideos}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  marginTop: '15px',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-sync-alt" style={{ marginRight: '5px' }}></i>
                重试
              </button>
            </div>
          )}

          {/* 空状态 */}
          {!loading && !notification?.type === 'error' && videos.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'white',
              borderRadius: '15px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
              margin: '20px 0'
            }}>
              <i className="fas fa-film" style={{ 
                fontSize: '64px', 
                color: 'var(--gray)', 
                opacity: 0.5,
                marginBottom: '20px'
              }}></i>
              <h3 style={{ color: 'var(--dark)', marginBottom: '15px' }}>暂无视频</h3>
              <p style={{ color: 'var(--gray)', marginBottom: '25px' }}>
                您还没有上传任何视频
              </p>
            </div>
          )}

          {/* 筛选结果为空 */}
          {!loading && videos.length > 0 && filteredVideos.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'white',
              borderRadius: '15px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
            }}>
              <i className="fas fa-filter" style={{ 
                fontSize: '64px', 
                color: 'var(--gray)', 
                opacity: 0.5,
                marginBottom: '20px'
              }}></i>
              <h3 style={{ color: 'var(--dark)', marginBottom: '15px' }}>没有符合条件的视频</h3>
              <p style={{ color: 'var(--gray)', marginBottom: '25px' }}>
                请调整筛选条件或重置筛选器
              </p>
              <button
                onClick={resetFilters}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  padding: '12px 30px',
                  borderRadius: '30px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <i className="fas fa-undo" style={{ marginRight: '8px' }}></i>
                重置筛选条件
              </button>
            </div>
          )}

          {/* 视频网格 */}
          {!loading && videos.length > 0 && filteredVideos.length > 0 && (
            <div className="videos-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '25px',
              marginBottom: '40px'
            }}>
              {filteredVideos.map(video => (
                <div key={video.id} className="video-card" style={{
                  background: 'white',
                  borderRadius: '15px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  {/* 视频封面 */}
                  <div style={{
                    position: 'relative',
                    height: '200px',
                    background: `url(${getVideoThumbnail(video)}) center/cover`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(135deg, rgba(74, 111, 227, 0.3) 0%, rgba(32, 178, 170, 0.3) 100%)'
                    }}></div>
                    
                    {/* 播放按钮 */}
                    <button 
                      onClick={() => handlePlayVideo(video)}
                      style={{
                        position: 'relative',
                        background: 'rgba(255,255,255,0.95)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '70px',
                        height: '70px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '28px',
                        color: 'var(--primary)',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.1)';
                        e.target.style.boxShadow = '0 6px 20px rgba(74, 111, 227, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                      }}
                    >
                      <i className="fas fa-play" style={{ marginLeft: '3px' }}></i>
                    </button>
                    
                    {/* 文件大小标签 */}
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {video.sizeFormatted}
                    </div>

                    {/* 视频时长标签 */}
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'rgba(32, 178, 170, 0.9)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {video.durationFormatted}
                    </div>

                    {/* 文件格式标签 */}
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      background: 'var(--primary)',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {video.extension.replace('.', '').toUpperCase()}
                    </div>
                  </div>

                  {/* 视频信息 */}
                  <div style={{ padding: '20px' }}>
                    <h3 style={{
                      fontSize: '18px',
                      marginBottom: '8px',
                      color: 'var(--dark)',
                      fontWeight: '600',
                      wordBreak: 'break-all'
                    }}>
                      {video.title}
                    </h3>
                    
                    <p style={{
                      color: 'var(--gray)',
                      fontSize: '14px',
                      marginBottom: '12px'
                    }}>
                      文件名: {video.filename}
                    </p>

                    {/* 视频详细信息 */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      marginBottom: '15px',
                      fontSize: '13px',
                      color: 'var(--gray)'
                    }}>
                      <div>
                        <i className="fas fa-clock" style={{ marginRight: '5px', color: 'var(--secondary)' }}></i>
                        时长: {video.durationFormatted}
                      </div>
                      <div>
                        <i className="fas fa-hdd" style={{ marginRight: '5px', color: 'var(--primary)' }}></i>
                        大小: {video.sizeFormatted}
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <i className="fas fa-calendar" style={{ marginRight: '5px', color: 'var(--warning)' }}></i>
                        创建: {formatDate(video.createdTime)}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <button 
                        onClick={() => handlePlayVideo(video)}
                        style={{
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'var(--primary-dark)';
                          e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'var(--primary)';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        <i className="fas fa-play" style={{ marginRight: '5px' }}></i>
                        播放视频
                      </button>
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--gray)',
                          cursor: 'pointer',
                          fontSize: '16px',
                          transition: 'all 0.3s ease',
                          padding: '5px'
                        }}
                        title="收藏视频"
                        >
                          <i className="fas fa-heart"></i>
                        </button>
                        <button style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--gray)',
                          cursor: 'pointer',
                          fontSize: '16px',
                          transition: 'all 0.3s ease',
                          padding: '5px'
                        }}
                        title="分享视频"
                        >
                          <i className="fas fa-share"></i>
                        </button>
                        <button 
                          onClick={(e) => handleDeleteVideo(video, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--gray)',
                            cursor: 'pointer',
                            fontSize: '16px',
                            transition: 'all 0.3s ease',
                            padding: '5px'
                          }}
                          title="删除视频"
                          onMouseEnter={(e) => {
                            e.target.style.color = '#ff3860';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = 'var(--gray)';
                          }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* 页脚 */}
        <Footer />
      </div>

      {/* 视频播放器模态框 */}
      {showVideoPlayer && selectedVideo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.9)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            position: 'relative',
            width: '90%',
            maxWidth: '1000px',
            background: 'white',
            borderRadius: '15px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}>
            {/* 播放器头部 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '15px 20px',
              background: 'var(--dark)',
              color: 'white'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>
                <i className="fas fa-play-circle" style={{ marginRight: '10px', color: 'var(--primary)' }}></i>
                {selectedVideo.title}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '14px', color: 'var(--gray)' }}>
                  时长: {selectedVideo.durationFormatted}
                </span>
                <button
                  onClick={handleClosePlayer}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '5px',
                    borderRadius: '50%',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'none';
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* 视频播放器 */}
            <video
              controls
              autoPlay
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '70vh',
                background: '#000'
              }}
              src={`http://localhost:3003/videos/${encodeURIComponent(selectedVideo.filename)}`}
            >
              您的浏览器不支持视频播放。
            </video>

            {/* 视频信息 */}
            <div style={{
              padding: '20px',
              background: 'var(--light)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                fontSize: '14px'
              }}>
                <div>
                  <strong style={{ color: 'var(--dark)' }}>文件名:</strong>
                  <br />
                  <span style={{ color: 'var(--gray)' }}>{selectedVideo.filename}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--dark)' }}>文件大小:</strong>
                  <br />
                  <span style={{ color: 'var(--gray)' }}>{selectedVideo.sizeFormatted}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--dark)' }}>视频时长:</strong>
                  <br />
                  <span style={{ color: 'var(--gray)' }}>{selectedVideo.durationFormatted}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--dark)' }}>创建时间:</strong>
                  <br />
                  <span style={{ color: 'var(--gray)' }}>{formatDate(selectedVideo.createdTime)}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--dark)' }}>格式:</strong>
                  <br />
                  <span style={{ color: 'var(--gray)' }}>{selectedVideo.extension.replace('.', '').toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 本地通知组件 */}
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

export default MyVideos; 