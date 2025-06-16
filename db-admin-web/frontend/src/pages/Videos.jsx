import React, { useState, useEffect } from 'react';
import { videoAPI } from '../utils/api';
import Pagination from '../components/Pagination';
import Loading from '../components/Loading';

const Videos = () => {
  // 状态管理
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [perPage] = useState(20);
  const [previewVideo, setPreviewVideo] = useState(null);
  
  // 编辑相关状态
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // 状态选项
  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'processing', label: '处理中' },
    { value: 'ready', label: '就绪' },
    { value: 'error', label: '错误' }
  ];

  // 加载视频数据
  const loadVideos = async (page = 1, search = '', status = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        per_page: perPage,
      };
      
      if (search.trim()) {
        params.search = search.trim();
      }
      if (status) {
        params.status = status;
      }
      
      const response = await videoAPI.getVideos(params);
      
      if (response.success) {
        setVideos(response.data.videos || []);
        setTotalPages(response.data.pages || 0);
        setTotal(response.data.total || 0);
        setCurrentPage(page);
      } else {
        setError(response.message || '加载视频数据失败');
      }
    } catch (err) {
      setError(err.message || '网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 编辑视频
  const handleEditVideo = (video) => {
    setEditingVideo(video);
    setEditFormData({
      title: video.title,
      description: video.description || '',
      status: video.status
    });
    setIsEditModalOpen(true);
  };

  // 保存视频编辑
  const handleSaveVideo = async () => {
    if (!editingVideo) return;
    
    try {
      const response = await videoAPI.updateVideo(editingVideo.id, editFormData);
      if (response.success) {
        alert('视频信息更新成功');
        setIsEditModalOpen(false);
        setEditingVideo(null);
        setEditFormData({});
        // 重新加载当前页数据
        loadVideos(currentPage, searchTerm, statusFilter);
      } else {
        alert(response.message || '更新失败');
      }
    } catch (err) {
      alert(err.message || '更新失败');
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingVideo(null);
    setEditFormData({});
  };

  // 删除视频
  const handleDeleteVideo = async (videoId, title) => {
    if (!confirm(`确定要删除视频 "${title}" 吗？此操作不可恢复。`)) {
      return;
    }
    
    try {
      const response = await videoAPI.deleteVideo(videoId);
      if (response.success) {
        alert('视频删除成功');
        // 重新加载当前页数据
        loadVideos(currentPage, searchTerm, statusFilter);
      } else {
        alert(response.message || '删除失败');
      }
    } catch (err) {
      alert(err.message || '删除失败');
    }
  };

  // 预览视频
  const handlePreviewVideo = (video) => {
    setPreviewVideo(video);
  };

  // 关闭预览
  const closePreview = () => {
    setPreviewVideo(null);
  };

  // 搜索处理
  const handleSearch = () => {
    setCurrentPage(1);
    loadVideos(1, searchTerm, statusFilter);
  };

  // 重置筛选
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCurrentPage(1);
    loadVideos(1, '', '');
  };

  // 页码变化
  const handlePageChange = (page) => {
    loadVideos(page, searchTerm, statusFilter);
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // 格式化时长
  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化状态
  const formatStatus = (status) => {
    const statusMap = {
      processing: { text: '处理中', class: 'bg-yellow-100 text-yellow-800' },
      ready: { text: '就绪', class: 'bg-green-100 text-green-800' },
      error: { text: '错误', class: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { text: status, class: 'bg-gray-100 text-gray-800' };
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadVideos();
  }, []);

  return (
    <div className="videos-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
            </svg>
          </div>
          <div className="header-text">
            <h1 className="page-title gradient-text">视频管理</h1>
            <p className="page-subtitle">
              <svg className="inline-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
              </svg>
              管理平台教学视频资源和内容
            </p>
          </div>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="card">
        <div className="card-body space-y-4">
          {/* 搜索框 */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索视频标题或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="btn btn-primary px-6 py-2"
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
              搜索
            </button>
          </div>
          
          {/* 筛选选项 */}
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
                loadVideos(1, searchTerm, e.target.value);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'calc(100% - 0.5rem) center',
                backgroundSize: '16px 16px',
                paddingRight: '2.5rem'
              }}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={handleResetFilters}
              className="btn btn-secondary px-4 py-2"
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              重置
            </button>
          </div>
        </div>
      </div>

      {/* 视频列表 */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">视频列表</h2>
          <span className="text-sm text-secondary">共 {total} 个视频</span>
        </div>
        
        <div className="card-body p-0">
          {loading ? (
            <Loading message="正在加载视频数据..." />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">❌ {error}</p>
              <button
                onClick={() => loadVideos(currentPage, searchTerm, statusFilter)}
                className="btn btn-warning"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                重新加载
              </button>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary">
                {searchTerm || statusFilter 
                  ? '没有找到匹配的视频' 
                  : '暂无视频数据'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        视频信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        文件信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        统计
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        上传时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {videos.map((video) => {
                      const statusInfo = formatStatus(video.status);
                      return (
                        <tr key={video.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {video.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {video.description || '无描述'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              大小: {formatFileSize(video.file_size)}
                            </div>
                            <div className="text-sm text-gray-500">
                              时长: {formatDuration(video.duration)}
                            </div>
                            <div className="text-sm text-gray-500">
                              格式: {video.format || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.class}`}>
                              {statusInfo.text}
                            </span>
                            {video.error_message && (
                              <div className="text-xs text-red-500 mt-1">
                                {video.error_message}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>浏览: {video.view_count}</div>
                            <div>点赞: {video.like_count}</div>
                            <div>评论: {video.comment_count}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(video.upload_time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditVideo(video)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                                </svg>
                                编辑
                              </button>
                              <a
                                href={video.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                                预览
                              </a>
                              <button
                                onClick={() => handleDeleteVideo(video.id, video.title)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                                </svg>
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* 分页组件 */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                total={total}
                perPage={perPage}
              />
            </>
          )}
        </div>
      </div>

      {/* 视频预览模态框 */}
      {previewVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={closePreview}>
          <div className="bg-white rounded-2xl p-8 max-w-5xl max-h-[90vh] overflow-auto shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{previewVideo.title}</h3>
                <p className="text-sm text-gray-500">视频预览</p>
              </div>
              <button
                onClick={closePreview}
                className="modal-close-btn"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>关闭</span>
              </button>
            </div>
            
            <div className="mb-6">
              <div className="video-container">
                <video
                  controls
                  className="video-player"
                  src={videoAPI.getVideoStream(previewVideo.id)}
                  poster="/api/placeholder-video.jpg"
                >
                  您的浏览器不支持视频播放。
                </video>
              </div>
            </div>
            
            <div className="video-info-grid">
              <div className="info-item">
                <span className="info-label">📝 描述</span>
                <span className="info-value">{previewVideo.description || '无描述'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">📊 文件大小</span>
                <span className="info-value">{formatFileSize(previewVideo.file_size)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">⏱️ 时长</span>
                <span className="info-value">{formatDuration(previewVideo.duration)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">🎬 格式</span>
                <span className="info-value">{previewVideo.format}</span>
              </div>
              <div className="info-item">
                <span className="info-label">📅 上传时间</span>
                <span className="info-value">{formatDate(previewVideo.upload_time)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑视频模态框 */}
      {isEditModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh'
          }}
          onClick={handleCancelEdit}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl transform transition-all duration-300 ease-out animate-modal-enter modal-scrollbar"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              position: 'relative',
              width: '380px',
              height: '380px',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <div className="mb-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h7.5A2.25 2.25 0 0013 13.75v-7.5A2.25 2.25 0 0010.75 4h-7.5zM19 4.75a.75.75 0 00-1.28-.53l-3 3a.75.75 0 00-.22.53v4.5c0 .199.079.39.22.53l3 3a.75.75 0 001.28-.53V4.75z" />
                    </svg>
                  </div>
                  编辑视频信息
                </h3>
              </div>
              
              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">视频标题</label>
                  <input
                    type="text"
                    value={editFormData.title || ''}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    placeholder="请输入视频标题"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">视频描述</label>
                  <textarea
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    rows="3"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none text-xs"
                    placeholder="请输入视频描述"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">状态</label>
                  <select
                    value={editFormData.status || ''}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white text-xs"
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'calc(100% - 0.5rem) center',
                      backgroundSize: '16px 16px',
                      paddingRight: '2.5rem',
                      paddingLeft: '0.625rem'
                    }}
                  >
                    {statusOptions.filter(option => option.value !== '').map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={handleCancelEdit}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: 'rgba(59, 130, 246, 0.7)',
                    backgroundColor: 'rgba(239, 246, 255, 0.6)',
                    border: '1px solid rgba(191, 219, 254, 0.8)',
                    borderRadius: '6px',
                    minWidth: '45px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(239, 246, 255, 0.9)';
                    e.target.style.borderColor = 'rgba(147, 197, 253, 0.9)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(239, 246, 255, 0.6)';
                    e.target.style.borderColor = 'rgba(191, 219, 254, 0.8)';
                  }}
                >
                  <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  取消
                </button>
                <button
                  onClick={handleSaveVideo}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: 'rgba(59, 130, 246, 0.8)',
                    backgroundColor: 'rgba(239, 246, 255, 0.8)',
                    border: '1px solid rgba(147, 197, 253, 0.9)',
                    borderRadius: '6px',
                    minWidth: '45px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(219, 234, 254, 0.9)';
                    e.target.style.borderColor = 'rgba(59, 130, 246, 0.9)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(239, 246, 255, 0.8)';
                    e.target.style.borderColor = 'rgba(147, 197, 253, 0.9)';
                  }}
                >
                  <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        :root {
          --primary-color: #0ea5e9;
          --secondary-color: #06b6d4;
          --accent-color: #8b5cf6;
          --text-primary: #1f2937;
          --text-secondary: #6b7280;
          --text-inverse: #ffffff;
          --bg-primary: #ffffff;
          --bg-secondary: #f8fafc;
          --border-color: #e5e7eb;
          --border-primary: #d1d5db;
          --error-color: #ef4444;
          --error-dark: #dc2626;
          --spacing-2: 0.5rem;
          --spacing-4: 1rem;
          --spacing-5: 1.25rem;
          --spacing-6: 1.5rem;
          --spacing-8: 2rem;
          --border-radius-lg: 0.5rem;
          --border-radius-xl: 0.75rem;
          --border-radius-2xl: 1rem;
          --text-sm: 0.875rem;
          --text-base: 1rem;
          --text-lg: 1.125rem;
          --text-3xl: 1.875rem;
          --text-4xl: 2.25rem;
          --transition-normal: 0.15s ease-in-out;
          --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .videos-page {
          padding: var(--spacing-6);
          max-width: 1400px;
          margin: 0 auto;
          animation: fadeIn 0.6s ease-out;
        }

        .page-header {
          margin-bottom: var(--spacing-8);
          padding: var(--spacing-8);
          background: linear-gradient(135deg, 
            rgba(240, 249, 255, 0.8) 0%, 
            rgba(255, 255, 255, 0.9) 100%
          );
          border-radius: var(--border-radius-2xl);
          border: 1px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(20px);
          box-shadow: var(--shadow-lg);
          position: relative;
          overflow: hidden;
        }

        .page-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--primary-color), var(--secondary-color), var(--accent-color));
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: var(--spacing-6);
        }

        .header-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          border-radius: var(--border-radius-2xl);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-inverse);
          box-shadow: var(--shadow-lg);
          position: relative;
          overflow: hidden;
        }

        .header-icon::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: shimmer 3s ease-in-out infinite;
        }

        .header-icon svg {
          width: 32px;
          height: 32px;
          z-index: 1;
          position: relative;
        }

        .header-text {
          flex: 1;
        }

        .page-title {
          font-size: var(--text-4xl);
          font-weight: 800;
          margin: 0 0 var(--spacing-2);
          line-height: 1.2;
        }

        .gradient-text {
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }

        .page-subtitle {
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
          color: var(--text-secondary);
          font-size: var(--text-lg);
          font-weight: 500;
          margin: 0;
        }

        .inline-icon {
          width: 20px;
          height: 20px;
          color: var(--primary-color);
        }

        /* 卡片增强样式 */
        .videos-page :global(.card) {
          margin-bottom: var(--spacing-6);
          border-radius: var(--border-radius-2xl);
          overflow: hidden;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all var(--transition-normal);
        }

        .videos-page :global(.card:hover) {
          transform: translateY(-4px);
          box-shadow: var(--shadow-2xl);
          border-color: rgba(14, 165, 233, 0.2);
        }

        .videos-page :global(.card-header) {
          background: linear-gradient(135deg, 
            rgba(240, 249, 255, 0.6) 0%, 
            rgba(255, 255, 255, 0.8) 100%
          );
          border-bottom: 1px solid rgba(14, 165, 233, 0.1);
          position: relative;
        }

        .videos-page :global(.card-header::after) {
          content: '';
          position: absolute;
          bottom: 0;
          left: var(--spacing-6);
          right: var(--spacing-6);
          height: 1px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            var(--primary-color) 50%, 
            transparent 100%
          );
        }

        /* 视频预览模态框样式 */
        .video-container {
          position: relative;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border-radius: var(--border-radius-2xl);
          padding: var(--spacing-4);
          box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .video-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--primary-color), var(--secondary-color), var(--accent-color));
        }

        .video-player {
          width: 100%;
          max-height: 500px;
          border-radius: var(--border-radius-xl);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          background: #000;
        }

        .video-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-4);
          margin-top: var(--spacing-6);
        }

        .info-item {
          background: linear-gradient(135deg, rgba(240, 249, 255, 0.8), rgba(255, 255, 255, 0.9));
          border: 1px solid rgba(14, 165, 233, 0.1);
          border-radius: var(--border-radius-xl);
          padding: var(--spacing-4);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-2);
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
        }

        .info-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
          opacity: 0;
          transition: opacity var(--transition-normal);
        }

        .info-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(14, 165, 233, 0.15);
          border-color: rgba(14, 165, 233, 0.3);
        }

        .info-item:hover::before {
          opacity: 1;
        }

        .info-label {
          font-weight: 600;
          color: var(--text-secondary);
          font-size: var(--text-sm);
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
        }

        .info-value {
          color: var(--text-primary);
          font-size: var(--text-base);
          font-weight: 500;
          word-break: break-word;
        }

        /* 搜索栏和筛选器样式 */
        .videos-page :global(.card-body input),
        .videos-page :global(.card-body select) {
          border: 2px solid var(--border-primary);
          border-radius: var(--border-radius-xl);
          padding: var(--spacing-4) var(--spacing-5);
          font-size: var(--text-base);
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          transition: all var(--transition-normal);
        }

        .videos-page :global(.card-body input:focus),
        .videos-page :global(.card-body select:focus) {
          border-color: var(--primary-color);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1), var(--shadow-lg);
          transform: translateY(-2px);
        }

        /* 下拉选择框样式优化 */
        .videos-page select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-repeat: no-repeat;
          background-position: calc(100% - 0.5rem) center !important;
          background-size: 16px 16px !important;
          padding-right: 2.5rem !important;
          direction: ltr;
        }

        .videos-page select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .videos-page select::-ms-expand {
          display: none;
        }

        .videos-page select option {
          padding: 8px 12px;
          background: white;
          color: #374151;
        }

        .videos-page select option:hover,
        .videos-page select option:focus {
          background: #f3f4f6;
        }

        /* 表格增强样式 */
        .videos-page :global(table) {
          border-radius: var(--border-radius-xl);
          overflow: hidden;
        }

        .videos-page :global(thead) {
          background: linear-gradient(135deg, 
            rgba(240, 249, 255, 0.8) 0%, 
            rgba(248, 250, 252, 0.9) 100%
          );
        }

        .videos-page :global(thead th) {
          font-weight: 600;
          color: var(--text-primary);
          font-size: var(--text-sm);
          letter-spacing: 0.05em;
          border-bottom: 2px solid rgba(14, 165, 233, 0.1);
        }

        .videos-page :global(tbody tr) {
          transition: all var(--transition-normal);
          border-bottom: 1px solid rgba(14, 165, 233, 0.05);
        }

        .videos-page :global(tbody tr:hover) {
          background: linear-gradient(135deg, 
            rgba(240, 249, 255, 0.3) 0%, 
            rgba(255, 255, 255, 0.6) 100%
          );
          transform: scale(1.01);
          box-shadow: var(--shadow-md);
        }

        /* 状态徽章增强 */
        .videos-page :global(.bg-yellow-100) {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 1px solid #f59e0b;
          box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
        }

        .videos-page :global(.bg-green-100) {
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          border: 1px solid #10b981;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
        }

        .videos-page :global(.bg-gray-100) {
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
          border: 1px solid #6b7280;
          box-shadow: 0 2px 4px rgba(107, 114, 128, 0.2);
        }

        .videos-page :global(.bg-red-100) {
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          border: 1px solid #ef4444;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
        }

        /* 按钮增强 */
        .videos-page :global(.text-blue-600) {
          color: var(--primary-color);
          font-weight: 600;
          padding: var(--spacing-2) var(--spacing-4);
          border-radius: var(--border-radius-lg);
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
        }

        .videos-page :global(.text-blue-600:hover) {
          background: rgba(14, 165, 233, 0.1);
          color: var(--primary-dark);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .videos-page :global(.text-red-600) {
          color: var(--error-color);
          font-weight: 600;
          padding: var(--spacing-2) var(--spacing-4);
          border-radius: var(--border-radius-lg);
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
        }

        .videos-page :global(.text-red-600:hover) {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error-dark);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        /* 预览模态框增强 */
        .videos-page :global(.fixed) {
          backdrop-filter: blur(4px);
        }

        .videos-page :global(.bg-white.rounded-lg) {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: var(--shadow-2xl);
          border-radius: var(--border-radius-2xl);
        }

        /* 动画定义 */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
          100% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
        }

        @keyframes modal-enter {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-modal-enter {
          animation: modal-enter 0.3s ease-out;
        }

        /* 自定义滚动条样式 */
        .modal-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .modal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 3px;
        }

        .modal-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.3);
          border-radius: 3px;
          transition: all 0.2s ease;
        }

        .modal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }

        .modal-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }

        /* Firefox滚动条样式 */
        .modal-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
          .videos-page {
            padding: var(--spacing-4);
          }

          .page-header {
            padding: var(--spacing-6);
            margin-bottom: var(--spacing-6);
          }

          .header-content {
            flex-direction: column;
            text-align: center;
            gap: var(--spacing-4);
          }

          .header-icon {
            width: 48px;
            height: 48px;
          }

          .header-icon svg {
            width: 24px;
            height: 24px;
          }

          .page-title {
            font-size: var(--text-3xl);
          }

          .page-subtitle {
            font-size: var(--text-base);
            justify-content: center;
          }
        }

        /* 减少动画模式 */
        @media (prefers-reduced-motion: reduce) {
          .videos-page {
            animation: none;
          }
          
          .header-icon::before {
            animation: none;
          }
          
          .videos-page :global(.card:hover),
          .videos-page :global(tbody tr:hover),
          .videos-page :global(.card-body input:focus),
          .videos-page :global(.card-body select:focus),
          .videos-page :global(.text-blue-600:hover),
          .videos-page :global(.text-red-600:hover) {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Videos; 