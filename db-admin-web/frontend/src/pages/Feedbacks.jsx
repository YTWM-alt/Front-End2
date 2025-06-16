import React, { useState, useEffect } from 'react';
import { feedbackAPI } from '../utils/api';
import Pagination from '../components/Pagination';
import Loading from '../components/Loading';

const Feedbacks = () => {
  // 状态管理
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [perPage] = useState(20);
  
  // 编辑相关状态
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // 状态选项
  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'PENDING', label: '待处理' },
    { value: 'PROCESSING', label: '处理中' },
    { value: 'RESOLVED', label: '已解决' },
    { value: 'CLOSED', label: '已关闭' }
  ];

  // 类型选项
  const typeOptions = [
    { value: '', label: '全部类型' },
    { value: 'BUG', label: '错误报告' },
    { value: 'FEATURE', label: '功能建议' },
    { value: 'COMPLAINT', label: '投诉' },
    { value: 'PRAISE', label: '表扬' },
    { value: 'OTHER', label: '其他' }
  ];

  // 优先级选项
  const priorityOptions = [
    { value: '', label: '全部优先级' },
    { value: 'LOW', label: '低' },
    { value: 'MEDIUM', label: '中' },
    { value: 'HIGH', label: '高' },
    { value: 'URGENT', label: '紧急' }
  ];

  // 加载反馈数据
  const loadFeedbacks = async (page = 1, search = '', status = '', type = '', priority = '') => {
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
      if (type) {
        params.type = type;
      }
      if (priority) {
        params.priority = priority;
      }
      
      const response = await feedbackAPI.getFeedbacks(params);
      
      if (response.success) {
        setFeedbacks(response.data.feedbacks || []);
        setTotalPages(response.data.pages || 0);
        setTotal(response.data.total || 0);
        setCurrentPage(page);
      } else {
        setError(response.message || '加载反馈数据失败');
      }
    } catch (err) {
      setError(err.message || '网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 编辑反馈
  const handleEditFeedback = (feedback) => {
    setEditingFeedback(feedback);
    setEditFormData({
      title: feedback.title,
      content: feedback.content || '',
      status: feedback.status,
      type: feedback.type,
      priority: feedback.priority
    });
    setIsEditModalOpen(true);
  };

  // 保存反馈编辑
  const handleSaveFeedback = async () => {
    if (!editingFeedback) return;
    
    try {
      const response = await feedbackAPI.updateFeedback(editingFeedback.id, editFormData);
      if (response.success) {
        alert('反馈信息更新成功');
        setIsEditModalOpen(false);
        setEditingFeedback(null);
        setEditFormData({});
        // 重新加载当前页数据
        loadFeedbacks(currentPage, searchTerm, statusFilter, typeFilter, priorityFilter);
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
    setEditingFeedback(null);
    setEditFormData({});
  };

  // 删除反馈
  const handleDeleteFeedback = async (feedbackId, title) => {
    if (!confirm(`确定要删除反馈 "${title}" 吗？此操作不可恢复。`)) {
      return;
    }
    
    try {
      const response = await feedbackAPI.deleteFeedback(feedbackId);
      if (response.success) {
        alert('反馈删除成功');
        // 重新加载当前页数据
        loadFeedbacks(currentPage, searchTerm, statusFilter, typeFilter, priorityFilter);
      } else {
        alert(response.message || '删除失败');
      }
    } catch (err) {
      alert(err.message || '删除失败');
    }
  };

  // 搜索处理
  const handleSearch = () => {
    setCurrentPage(1);
    loadFeedbacks(1, searchTerm, statusFilter, typeFilter, priorityFilter);
  };

  // 重置筛选
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setPriorityFilter('');
    setCurrentPage(1);
    loadFeedbacks(1, '', '', '', '');
  };

  // 页码变化
  const handlePageChange = (page) => {
    loadFeedbacks(page, searchTerm, statusFilter, typeFilter, priorityFilter);
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 格式化状态
  const formatStatus = (status) => {
    const statusMap = {
      PENDING: { text: '待处理', class: 'bg-yellow-100 text-yellow-800' },
      PROCESSING: { text: '处理中', class: 'bg-blue-100 text-blue-800' },
      RESOLVED: { text: '已解决', class: 'bg-green-100 text-green-800' },
      CLOSED: { text: '已关闭', class: 'bg-gray-100 text-gray-800' }
    };
    return statusMap[status] || { text: status, class: 'bg-gray-100 text-gray-800' };
  };

  // 格式化类型
  const formatType = (type) => {
    const typeMap = {
      BUG: { text: '错误报告', class: 'bg-red-100 text-red-800' },
      FEATURE: { text: '功能建议', class: 'bg-blue-100 text-blue-800' },
      COMPLAINT: { text: '投诉', class: 'bg-orange-100 text-orange-800' },
      PRAISE: { text: '表扬', class: 'bg-green-100 text-green-800' },
      OTHER: { text: '其他', class: 'bg-gray-100 text-gray-800' }
    };
    return typeMap[type] || { text: type, class: 'bg-gray-100 text-gray-800' };
  };

  // 格式化优先级
  const formatPriority = (priority) => {
    const priorityMap = {
      LOW: { text: '低', class: 'bg-gray-100 text-gray-800' },
      MEDIUM: { text: '中', class: 'bg-yellow-100 text-yellow-800' },
      HIGH: { text: '高', class: 'bg-orange-100 text-orange-800' },
      URGENT: { text: '紧急', class: 'bg-red-100 text-red-800' }
    };
    return priorityMap[priority] || { text: priority, class: 'bg-gray-100 text-gray-800' };
  };

  // 截取内容
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadFeedbacks();
  }, []);

  return (
    <div className="feedbacks-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/>
            </svg>
          </div>
          <div className="header-text">
            <h1 className="page-title gradient-text">反馈管理</h1>
            <p className="page-subtitle">
              <svg className="inline-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              管理用户反馈、建议和意见收集
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
                placeholder="搜索反馈标题或内容..."
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
          <div className="flex items-center space-x-4 flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
                loadFeedbacks(1, searchTerm, e.target.value, typeFilter, priorityFilter);
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
            
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
                loadFeedbacks(1, searchTerm, statusFilter, e.target.value, priorityFilter);
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
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
                loadFeedbacks(1, searchTerm, statusFilter, typeFilter, e.target.value);
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
              {priorityOptions.map(option => (
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

      {/* 反馈列表 */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">反馈列表</h2>
          <span className="text-sm text-secondary">共 {total} 条反馈</span>
        </div>
        
        <div className="card-body p-0">
          {loading ? (
            <Loading message="正在加载反馈数据..." />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">❌ {error}</p>
              <button
                onClick={() => loadFeedbacks(currentPage, searchTerm, statusFilter, typeFilter, priorityFilter)}
                className="btn btn-warning"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                重新加载
              </button>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary">
                {searchTerm || statusFilter || typeFilter || priorityFilter 
                  ? '没有找到匹配的反馈' 
                  : '暂无反馈数据'
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
                        反馈信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        类型
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        优先级
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        处理信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        创建时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {feedbacks.map((feedback) => {
                      const statusInfo = formatStatus(feedback.status);
                      const typeInfo = formatType(feedback.type);
                      const priorityInfo = formatPriority(feedback.priority);
                      
                      return (
                        <tr key={feedback.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {feedback.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {truncateText(feedback.content)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeInfo.class}`}>
                              {typeInfo.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityInfo.class}`}>
                              {priorityInfo.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.class}`}>
                              {statusInfo.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {feedback.handler_id ? (
                              <div>
                                <div>处理人ID: {feedback.handler_id}</div>
                                <div>处理时间: {formatDate(feedback.handle_time)}</div>
                                {feedback.handle_note && (
                                  <div className="text-xs mt-1">
                                    备注: {truncateText(feedback.handle_note, 50)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">未处理</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(feedback.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditFeedback(feedback)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                                </svg>
                                编辑
                              </button>
                              <button
                                onClick={() => handleDeleteFeedback(feedback.id, feedback.title)}
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

      {/* 编辑反馈模态框 */}
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
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                  </div>
                  编辑反馈信息
                </h3>
              </div>
              
              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">反馈内容</label>
                  <textarea
                    value={editFormData.content || ''}
                    onChange={(e) => setEditFormData({...editFormData, content: e.target.value})}
                    rows="4"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none text-xs"
                    placeholder="请输入反馈内容"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">反馈类型</label>
                  <select
                    value={editFormData.type || ''}
                    onChange={(e) => setEditFormData({...editFormData, type: e.target.value})}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white text-xs"
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
                    {typeOptions.filter(option => option.value !== '').map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">优先级</label>
                  <select
                    value={editFormData.priority || ''}
                    onChange={(e) => setEditFormData({...editFormData, priority: e.target.value})}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white text-xs"
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
                    {priorityOptions.filter(option => option.value !== '').map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
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
                      paddingRight: '2.5rem'
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
                  onClick={handleSaveFeedback}
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

        .feedbacks-page {
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
        .feedbacks-page :global(.card) {
          margin-bottom: var(--spacing-6);
          border-radius: var(--border-radius-2xl);
          overflow: hidden;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all var(--transition-normal);
        }

        .feedbacks-page :global(.card:hover) {
          transform: translateY(-4px);
          box-shadow: var(--shadow-2xl);
          border-color: rgba(14, 165, 233, 0.2);
        }

        .feedbacks-page :global(.card-header) {
          background: linear-gradient(135deg, 
            rgba(240, 249, 255, 0.6) 0%, 
            rgba(255, 255, 255, 0.8) 100%
          );
          border-bottom: 1px solid rgba(14, 165, 233, 0.1);
          position: relative;
        }

        .feedbacks-page :global(.card-header::after) {
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

        /* 搜索栏和筛选器样式 */
        .feedbacks-page :global(.card-body input),
        .feedbacks-page :global(.card-body select) {
          border: 2px solid var(--border-primary);
          border-radius: var(--border-radius-xl);
          padding: var(--spacing-4) var(--spacing-5);
          font-size: var(--text-base);
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          transition: all var(--transition-normal);
        }

        .feedbacks-page :global(.card-body input:focus),
        .feedbacks-page :global(.card-body select:focus) {
          border-color: var(--primary-color);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1), var(--shadow-lg);
          transform: translateY(-2px);
        }

        /* 下拉选择框样式优化 */
        .feedbacks-page select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-repeat: no-repeat;
          background-position: calc(100% - 0.5rem) center !important;
          background-size: 16px 16px !important;
          padding-right: 2.5rem !important;
          direction: ltr;
        }

        .feedbacks-page select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .feedbacks-page select::-ms-expand {
          display: none;
        }

        .feedbacks-page select option {
          padding: 8px 12px;
          background: white;
          color: #374151;
        }

        .feedbacks-page select option:hover,
        .feedbacks-page select option:focus {
          background: #f3f4f6;
        }

        /* 表格增强样式 */
        .feedbacks-page :global(table) {
          border-radius: var(--border-radius-xl);
          overflow: hidden;
        }

        .feedbacks-page :global(thead) {
          background: linear-gradient(135deg, 
            rgba(240, 249, 255, 0.8) 0%, 
            rgba(248, 250, 252, 0.9) 100%
          );
        }

        .feedbacks-page :global(thead th) {
          font-weight: 600;
          color: var(--text-primary);
          font-size: var(--text-sm);
          letter-spacing: 0.05em;
          border-bottom: 2px solid rgba(14, 165, 233, 0.1);
        }

        .feedbacks-page :global(tbody tr) {
          transition: all var(--transition-normal);
          border-bottom: 1px solid rgba(14, 165, 233, 0.05);
        }

        .feedbacks-page :global(tbody tr:hover) {
          background: linear-gradient(135deg, 
            rgba(240, 249, 255, 0.3) 0%, 
            rgba(255, 255, 255, 0.6) 100%
          );
          transform: scale(1.01);
          box-shadow: var(--shadow-md);
        }

        /* 状态徽章增强 */
        .feedbacks-page :global(.bg-yellow-100) {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 1px solid #f59e0b;
          box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
        }

        .feedbacks-page :global(.bg-green-100) {
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          border: 1px solid #10b981;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
        }

        .feedbacks-page :global(.bg-gray-100) {
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
          border: 1px solid #6b7280;
          box-shadow: 0 2px 4px rgba(107, 114, 128, 0.2);
        }

        .feedbacks-page :global(.bg-red-100) {
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          border: 1px solid #ef4444;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
        }

        .feedbacks-page :global(.bg-blue-100) {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
          border: 1px solid #3b82f6;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        }

        .feedbacks-page :global(.bg-orange-100) {
          background: linear-gradient(135deg, #fed7aa, #fdba74);
          border: 1px solid #f97316;
          box-shadow: 0 2px 4px rgba(249, 115, 22, 0.2);
        }

        /* 按钮增强 */
        .feedbacks-page :global(.text-red-600) {
          color: var(--error-color);
          font-weight: 600;
          padding: var(--spacing-2) var(--spacing-4);
          border-radius: var(--border-radius-lg);
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
        }

        .feedbacks-page :global(.text-red-600:hover) {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error-dark);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
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
          .feedbacks-page {
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
          .feedbacks-page {
            animation: none;
          }
          
          .header-icon::before {
            animation: none;
          }
          
          .feedbacks-page :global(.card:hover),
          .feedbacks-page :global(tbody tr:hover),
          .feedbacks-page :global(.card-body input:focus),
          .feedbacks-page :global(.card-body select:focus),
          .feedbacks-page :global(.text-red-600:hover) {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Feedbacks; 