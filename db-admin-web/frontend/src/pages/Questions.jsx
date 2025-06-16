import React, { useState, useEffect } from 'react';
import { questionAPI } from '../utils/api';
import Pagination from '../components/Pagination';
import Loading from '../components/Loading';

const Questions = () => {
  // 状态管理
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [perPage] = useState(20);
  
  // 编辑相关状态
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // 状态选项
  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待回答' },
    { value: 'answered', label: '已回答' },
    { value: 'closed', label: '已关闭' },
    { value: 'requestion', label: '重新提问' }
  ];

  // 年级选项
  const gradeOptions = [
    { value: '', label: '全部年级' },
    { value: 'primary', label: '小学' },
    { value: 'junior', label: '初中' },
    { value: 'senior', label: '高中' },
    { value: 'university', label: '大学' }
  ];

  // 学科选项
  const subjectOptions = [
    { value: '', label: '全部学科' },
    { value: '语文', label: '语文' },
    { value: '数学', label: '数学' },
    { value: '英语', label: '英语' },
    { value: '物理', label: '物理' },
    { value: '化学', label: '化学' },
    { value: '生物', label: '生物' },
    { value: '历史', label: '历史' },
    { value: '地理', label: '地理' },
    { value: '政治', label: '政治' },
    { value: '其他', label: '其他' }
  ];

  // 加载问题数据
  const loadQuestions = async (page = 1, search = '', status = '', grade = '', subject = '') => {
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
      if (grade) {
        params.grade_level = grade;
      }
      if (subject) {
        params.subject = subject;
      }
      
      const response = await questionAPI.getQuestions(params);
      
      if (response.success) {
        setQuestions(response.data.questions || []);
        setTotalPages(response.data.pages || 0);
        setTotal(response.data.total || 0);
        setCurrentPage(page);
      } else {
        setError(response.message || '加载问题数据失败');
      }
    } catch (err) {
      setError(err.message || '网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 添加问题
  const handleAddQuestion = () => {
    setEditingQuestion(null); // 设置为null表示是添加模式
    setEditFormData({
      title: '',
      content: '',
      subject: '',
      grade_level: '',
      status: 'pending'
    });
    setIsEditModalOpen(true);
  };

  // 编辑问题
  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setEditFormData({
      title: question.title,
      content: question.content,
      subject: question.subject || '',
      grade_level: question.grade_level || '',
      status: question.status
    });
    setIsEditModalOpen(true);
  };

  // 保存问题（创建或更新）
  const handleSaveQuestion = async () => {
    try {
      let response;
      if (editingQuestion) {
        // 更新问题
        response = await questionAPI.updateQuestion(editingQuestion.id, editFormData);
      } else {
        // 创建问题
        response = await questionAPI.createQuestion(editFormData);
      }
      
      if (response.success) {
        alert(editingQuestion ? '问题信息更新成功' : '问题创建成功');
        setIsEditModalOpen(false);
        setEditingQuestion(null);
        setEditFormData({});
        // 重新加载当前页数据
        loadQuestions(currentPage, searchTerm, statusFilter, gradeFilter, subjectFilter);
      } else {
        alert(response.message || (editingQuestion ? '更新失败' : '创建失败'));
      }
    } catch (err) {
      alert(err.message || (editingQuestion ? '更新失败' : '创建失败'));
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingQuestion(null);
    setEditFormData({});
  };

  // 删除问题
  const handleDeleteQuestion = async (questionId, title) => {
    if (!confirm(`确定要删除问题 "${title}" 吗？此操作不可恢复。`)) {
      return;
    }
    
    try {
      const response = await questionAPI.deleteQuestion(questionId);
      if (response.success) {
        alert('问题删除成功');
        // 重新加载当前页数据
        loadQuestions(currentPage, searchTerm, statusFilter, gradeFilter, subjectFilter);
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
    loadQuestions(1, searchTerm, statusFilter, gradeFilter, subjectFilter);
  };

  // 重置筛选
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setGradeFilter('');
    setSubjectFilter('');
    setCurrentPage(1);
    loadQuestions(1, '', '', '', '');
  };

  // 页码变化
  const handlePageChange = (page) => {
    loadQuestions(page, searchTerm, statusFilter, gradeFilter, subjectFilter);
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 格式化状态
  const formatStatus = (status) => {
    const statusMap = {
      pending: { text: '待回答', class: 'bg-yellow-100 text-yellow-800' },
      answered: { text: '已回答', class: 'bg-green-100 text-green-800' },
      closed: { text: '已关闭', class: 'bg-gray-100 text-gray-800' },
      requestion: { text: '重新提问', class: 'bg-blue-100 text-blue-800' }
    };
    return statusMap[status] || { text: status, class: 'bg-gray-100 text-gray-800' };
  };

  // 截取内容
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadQuestions();
  }, []);

  return (
    <div className="questions-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.07,12.85c0.77-1.39,2.25-2.21,3.11-3.44c0.91-1.29,0.4-3.7-2.18-3.7c-1.69,0-2.52,1.28-2.87,2.34L6.54,6.96C7.25,4.83,9.18,3,11.99,3c2.35,0,3.96,1.07,4.78,2.41c0.7,1.15,1.11,3.3,0.03,4.9c-1.2,1.77-2.35,2.31-2.97,3.45c-0.25,0.46-0.35,0.76-0.35,2.24h-2.89C10.58,15.22,10.46,13.95,11.07,12.85z M14,20c0,1.1-0.9,2-2,2s-2-0.9-2-2c0-1.1,0.9-2,2-2S14,18.9,14,20z"/>
            </svg>
          </div>
          <div className="header-text">
            <h1 className="page-title gradient-text">问题管理</h1>
            <p className="page-subtitle">
              <svg className="inline-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              管理用户提问和AI回答内容
            </p>
          </div>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="card">
        <div className="card-body space-y-4">
          {/* 搜索框和添加按钮 */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索问题标题或内容..."
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
            <button
              onClick={handleAddQuestion}
              className="btn btn-success px-6 py-2"
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              添加问题
            </button>
          </div>
          
          {/* 筛选选项 */}
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
                loadQuestions(1, searchTerm, e.target.value, gradeFilter, subjectFilter);
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
              value={gradeFilter}
              onChange={(e) => {
                setGradeFilter(e.target.value);
                setCurrentPage(1);
                loadQuestions(1, searchTerm, statusFilter, e.target.value, subjectFilter);
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
              {gradeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <select
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                setCurrentPage(1);
                loadQuestions(1, searchTerm, statusFilter, gradeFilter, e.target.value);
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
              {subjectOptions.map(option => (
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

      {/* 问题列表 */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">问题列表</h2>
          <span className="text-sm text-secondary">共 {total} 个问题</span>
        </div>
        
        <div className="card-body p-0">
          {loading ? (
            <Loading message="正在加载问题数据..." />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">❌ {error}</p>
              <button
                onClick={() => loadQuestions(currentPage, searchTerm, statusFilter, gradeFilter, subjectFilter)}
                className="btn btn-warning"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                重新加载
              </button>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary">
                {searchTerm || statusFilter || gradeFilter || subjectFilter 
                  ? '没有找到匹配的问题' 
                  : '暂无问题数据'
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
                        问题信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        分类信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        统计
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
                    {questions.map((question) => {
                      const statusInfo = formatStatus(question.status);
                      return (
                        <tr key={question.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {question.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {truncateText(question.content)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {question.grade_level && gradeOptions.find(g => g.value === question.grade_level)?.label}
                            </div>
                            <div className="text-sm text-gray-500">
                              {question.subject || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.class}`}>
                              {statusInfo.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>浏览: {question.view_count}</div>
                            <div>回答: {question.answer_count}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(question.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditQuestion(question)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                                </svg>
                                编辑
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(question.id, question.title)}
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

      {/* 编辑问题模态框 */}
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
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  {editingQuestion ? '编辑问题信息' : '添加新问题'}
                </h3>
              </div>
              
              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">问题标题</label>
                  <input
                    type="text"
                    value={editFormData.title || ''}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    placeholder="请输入问题标题"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">问题内容</label>
                  <textarea
                    value={editFormData.content || ''}
                    onChange={(e) => setEditFormData({...editFormData, content: e.target.value})}
                    rows="3"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none text-xs"
                    placeholder="请输入问题内容"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">学科</label>
                  <select
                    value={editFormData.subject || ''}
                    onChange={(e) => setEditFormData({...editFormData, subject: e.target.value})}
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
                    {subjectOptions.filter(option => option.value !== '').map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">年级</label>
                  <select
                    value={editFormData.grade_level || ''}
                    onChange={(e) => setEditFormData({...editFormData, grade_level: e.target.value})}
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
                    {gradeOptions.filter(option => option.value !== '').map(option => (
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
                  onClick={handleSaveQuestion}
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

        .questions-page {
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
        .questions-page :global(.card) {
          margin-bottom: var(--spacing-6);
          border-radius: var(--border-radius-2xl);
          overflow: hidden;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all var(--transition-normal);
        }

        .questions-page :global(.card:hover) {
          transform: translateY(-4px);
          box-shadow: var(--shadow-2xl);
          border-color: rgba(14, 165, 233, 0.2);
        }

        .questions-page :global(.card-header) {
          background: linear-gradient(135deg, 
            rgba(240, 249, 255, 0.6) 0%, 
            rgba(255, 255, 255, 0.8) 100%
          );
          border-bottom: 1px solid rgba(14, 165, 233, 0.1);
          position: relative;
        }

        .questions-page :global(.card-header::after) {
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
        .questions-page :global(.card-body input),
        .questions-page :global(.card-body select) {
          border: 2px solid var(--border-primary);
          border-radius: var(--border-radius-xl);
          padding: var(--spacing-4) var(--spacing-5);
          font-size: var(--text-base);
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          transition: all var(--transition-normal);
        }

        .questions-page :global(.card-body input:focus),
        .questions-page :global(.card-body select:focus) {
          border-color: var(--primary-color);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1), var(--shadow-lg);
          transform: translateY(-2px);
        }

        /* 下拉选择框样式优化 */
        .questions-page select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-repeat: no-repeat;
          background-position: calc(100% - 0.5rem) center !important;
          background-size: 16px 16px !important;
          padding-right: 2.5rem !important;
          direction: ltr;
        }

        .questions-page select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .questions-page select::-ms-expand {
          display: none;
        }

        .questions-page select option {
          padding: 8px 12px;
          background: white;
          color: #374151;
        }

        .questions-page select option:hover,
        .questions-page select option:focus {
          background: #f3f4f6;
        }

        /* 表格增强样式 */
        .questions-page :global(table) {
          border-radius: var(--border-radius-xl);
          overflow: hidden;
        }

        .questions-page :global(thead) {
          background: linear-gradient(135deg, 
            rgba(240, 249, 255, 0.8) 0%, 
            rgba(248, 250, 252, 0.9) 100%
          );
        }

        .questions-page :global(thead th) {
          font-weight: 600;
          color: var(--text-primary);
          font-size: var(--text-sm);
          letter-spacing: 0.05em;
          border-bottom: 2px solid rgba(14, 165, 233, 0.1);
        }

        .questions-page :global(tbody tr) {
          transition: all var(--transition-normal);
          border-bottom: 1px solid rgba(14, 165, 233, 0.05);
        }

        .questions-page :global(tbody tr:hover) {
          background: linear-gradient(135deg, 
            rgba(240, 249, 255, 0.3) 0%, 
            rgba(255, 255, 255, 0.6) 100%
          );
          transform: scale(1.01);
          box-shadow: var(--shadow-md);
        }

        /* 状态徽章增强 */
        .questions-page :global(.bg-yellow-100) {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 1px solid #f59e0b;
          box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
        }

        .questions-page :global(.bg-green-100) {
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          border: 1px solid #10b981;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
        }

        .questions-page :global(.bg-gray-100) {
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
          border: 1px solid #6b7280;
          box-shadow: 0 2px 4px rgba(107, 114, 128, 0.2);
        }

        .questions-page :global(.bg-blue-100) {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
          border: 1px solid #3b82f6;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        }

        /* 按钮增强 */
        .questions-page :global(.text-red-600) {
          color: var(--error-color);
          font-weight: 600;
          padding: var(--spacing-2) var(--spacing-4);
          border-radius: var(--border-radius-lg);
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
        }

        .questions-page :global(.text-red-600:hover) {
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

        /* 响应式设计 */
        @media (max-width: 768px) {
          .questions-page {
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
          .questions-page {
            animation: none;
          }
          
          .header-icon::before {
            animation: none;
          }
          
          .questions-page :global(.card:hover),
          .questions-page :global(tbody tr:hover),
          .questions-page :global(.card-body input:focus),
          .questions-page :global(.card-body select:focus),
          .questions-page :global(.text-red-600:hover) {
            transform: none;
          }
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
      `}</style>
    </div>
  );
};

export default Questions;