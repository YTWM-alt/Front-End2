import React, { useState, useEffect } from 'react';
import { userAPI } from '../utils/api';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination';

const Users = () => {
  // 状态管理
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');


  // 编辑模态框状态
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // 筛选选项
  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'active', label: '活跃' },
    { value: 'inactive', label: '非活跃' },
    { value: 'banned', label: '已禁用' }
  ];



  // 加载用户数据
  const loadUsers = async (page = 1, search = '', status = '') => {
    try {
      setLoading(true);
      setError(null);
      const response = await userAPI.getUsers({ 
        page, 
        per_page: perPage, 
        search, 
        status
      });
      
      if (response.success) {
        setUsers(response.data.users);
        setCurrentPage(response.data.current_page);
        setTotalPages(response.data.total_pages);
        setTotal(response.data.total);
      } else {
        throw new Error(response.message || '加载用户数据失败');
      }
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // 编辑用户
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      status: user.status,
      real_name: user.real_name || '',
      phone: user.phone || ''
    });
    setIsEditModalOpen(true);
  };

  // 保存用户更新
  const handleSaveUser = async () => {
    try {
      const response = await userAPI.updateUser(editingUser.id, editFormData);
      if (response.success) {
        alert('用户信息更新成功');
        setIsEditModalOpen(false);
        setEditingUser(null);
        setEditFormData({});
        // 重新加载当前页数据
        loadUsers(currentPage, searchTerm, statusFilter);
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
    setEditingUser(null);
    setEditFormData({});
  };

  // 删除用户
  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`确定要删除用户 "${username}" 吗？此操作不可恢复。`)) {
      return;
    }
    
    try {
      const response = await userAPI.deleteUser(userId);
      if (response.success) {
        alert('用户删除成功');
        // 重新加载当前页数据
        loadUsers(currentPage, searchTerm, statusFilter);
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
    loadUsers(1, searchTerm, statusFilter);
  };

  // 重置筛选
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCurrentPage(1);
    loadUsers(1, '', '');
  };

  // 页码变化
  const handlePageChange = (page) => {
    loadUsers(page, searchTerm, statusFilter);
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 格式化状态
  const formatStatus = (status) => {
    const statusMap = {
      active: { text: '活跃', class: 'bg-green-100 text-green-800' },
      inactive: { text: '非活跃', class: 'bg-yellow-100 text-yellow-800' },
      banned: { text: '已禁用', class: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { text: status, class: 'bg-gray-100 text-gray-800' };
  };



  // 组件挂载时加载数据
  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="users-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div className="header-text">
            <h1 className="page-title gradient-text">用户管理</h1>
            <p className="page-subtitle">
              <svg className="inline-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
              管理平台用户账户和权限信息
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
                placeholder="搜索用户名、邮箱或真实姓名..."
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
                loadUsers(1, searchTerm, e.target.value);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
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

      {/* 用户列表 */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">用户列表</h2>
          <span className="text-sm text-secondary">共 {total} 个用户</span>
        </div>
        
        <div className="card-body p-0">
          {loading ? (
            <Loading message="正在加载用户数据..." />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">❌ {error}</p>
              <button
                onClick={() => loadUsers(currentPage, searchTerm, statusFilter)}
                className="btn btn-warning"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                重新加载
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary">
                {searchTerm || statusFilter || roleFilter 
                  ? '没有找到匹配的用户' 
                  : '暂无用户数据'
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
                        用户信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        联系方式
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        注册时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => {
                      const statusInfo = formatStatus(user.status);
                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                                  {user.username.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.username}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.real_name || '未设置真实姓名'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.email}</div>
                            <div className="text-sm text-gray-500">{user.phone || '未设置电话'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.class}`}>
                              {statusInfo.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                                </svg>
                                编辑
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.username)}
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

      {/* 编辑用户模态框 */}
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
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  </div>
                  编辑用户信息
                </h3>
              </div>
              
              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">用户名</label>
                  <input
                    type="text"
                    value={editFormData.username || ''}
                    onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    placeholder="请输入用户名"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">邮箱</label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    placeholder="请输入邮箱"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">真实姓名</label>
                  <input
                    type="text"
                    value={editFormData.real_name || ''}
                    onChange={(e) => setEditFormData({...editFormData, real_name: e.target.value})}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    placeholder="请输入真实姓名"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">电话</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
                    placeholder="请输入电话号码"
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
                    <option value="">请选择状态</option>
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
                  onClick={handleSaveUser}
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
        .users-page {
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
        .users-page :global(.card) {
          margin-bottom: var(--spacing-6);
          border-radius: var(--border-radius-2xl);
          overflow: hidden;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all var(--transition-normal);
        }

        .users-page :global(.card:hover) {
          transform: translateY(-4px);
          box-shadow: var(--shadow-2xl);
          border-color: rgba(14, 165, 233, 0.2);
        }

        .users-page :global(.card-header) {
          background: linear-gradient(135deg, 
            rgba(240, 249, 255, 0.6) 0%, 
            rgba(255, 255, 255, 0.8) 100%
          );
          border-bottom: 1px solid rgba(14, 165, 233, 0.1);
          position: relative;
        }

        .users-page :global(.card-header::after) {
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

        /* 按钮样式增强 */
        .users-page :global(.btn) {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-2);
          font-weight: 600;
          border-radius: var(--border-radius-lg);
          transition: all var(--transition-normal);
          border: none;
          cursor: pointer;
          font-size: var(--text-sm);
        }

        .users-page :global(.btn-primary) {
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          color: var(--text-inverse);
          box-shadow: var(--shadow-md);
        }

        .users-page :global(.btn-primary:hover) {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .users-page :global(.btn-secondary) {
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        .users-page :global(.btn-secondary:hover) {
          background: var(--bg-primary);
          border-color: var(--primary-color);
          color: var(--primary-color);
        }

        .users-page :global(.btn-warning) {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
        }

        /* 表格样式增强 */
        .users-page :global(table) {
          background: rgba(255, 255, 255, 0.8);
        }

        .users-page :global(tbody tr:hover) {
          background: rgba(14, 165, 233, 0.05);
          transform: translateX(4px);
        }

        /* 输入框样式增强 */
        .users-page :global(.card-body input),
        .users-page :global(.card-body select) {
          transition: all var(--transition-normal);
        }

        .users-page :global(.card-body input:focus),
        .users-page :global(.card-body select:focus) {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        /* 删除按钮特殊样式 */
        .users-page :global(.text-red-600) {
          transition: all var(--transition-normal);
        }

        .users-page :global(.text-red-600:hover) {
          color: #dc2626;
          transform: scale(1.05);
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
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          50% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
          100% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
          .users-page {
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
          .users-page {
            animation: none;
          }
          
          .header-icon::before {
            animation: none;
          }
          
          .users-page :global(.card:hover),
          .users-page :global(tbody tr:hover),
          .users-page :global(.card-body input:focus),
          .users-page :global(.card-body select:focus),
          .users-page :global(.text-red-600:hover) {
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

        /* 下拉选择框样式优化 */
        .users-page select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-repeat: no-repeat;
          background-position: calc(100% - 0.5rem) center !important;
          background-size: 16px 16px !important;
          padding-right: 2.5rem !important;
          direction: ltr;
        }

        .users-page select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .users-page select::-ms-expand {
          display: none;
        }

        .users-page select option {
          padding: 8px 12px;
          background: white;
          color: #374151;
        }

        .users-page select option:hover,
        .users-page select option:focus {
          background: #f3f4f6;
        }
      `}</style>
    </div>
  );
};

export default Users; 