import React, { useState, useEffect, useRef } from 'react';
import './Profile.css';

/**
 * 个人中心页面组件
 * 参考demo.html的设计风格，提供用户信息管理、设置选项、学习记录等功能
 */
const Profile = ({ 
  authHook, 
  onNavigate, 
  onLoginClick, 
  onLogout, 
  showNotification 
}) => {
  // 从localStorage和authHook加载用户信息
  const loadUserInfoFromStorage = () => {
    try {
      // 优先从authHook获取用户信息
      if (authHook && authHook.user) {
        const authUser = authHook.user;
        console.log('🔐 从authHook加载用户信息:', authUser);
        
        // 尝试从localStorage获取扩展信息
        const savedUserInfo = localStorage.getItem('userInfo');
        let extendedInfo = {};
        if (savedUserInfo) {
          const parsedUserInfo = JSON.parse(savedUserInfo);
          extendedInfo = {
            joinDate: parsedUserInfo.joinDate || '2024-01-01',
            studyTime: parsedUserInfo.studyTime || 168,
            questionsAsked: parsedUserInfo.questionsAsked || 45,
            videosWatched: parsedUserInfo.videosWatched || 28
          };
        }
        
        return {
          name: authUser.name || '用户名',
          email: authUser.email || 'user@example.com',
          avatar: authUser.avatar || '', // 从authHook获取头像
          joinDate: extendedInfo.joinDate || '2024-01-01',
          studyTime: extendedInfo.studyTime || 168, // 生成视频数量
          questionsAsked: extendedInfo.questionsAsked || 45, // 提问数量
          videosWatched: extendedInfo.videosWatched || 28 // 观看视频数
        };
      }
      
      // 如果authHook不可用，从localStorage加载
      const savedUserInfo = localStorage.getItem('userInfo');
      if (savedUserInfo) {
        const parsedUserInfo = JSON.parse(savedUserInfo);
        console.log('📱 从localStorage加载用户信息:', parsedUserInfo);
        return {
          name: parsedUserInfo.name || '用户名',
          email: parsedUserInfo.email || 'user@example.com',
          avatar: parsedUserInfo.avatar || '', // 从存储中恢复头像URL
          joinDate: parsedUserInfo.joinDate || '2024-01-01',
          studyTime: parsedUserInfo.studyTime || 168, // 生成视频数量
          questionsAsked: parsedUserInfo.questionsAsked || 45, // 提问数量
          videosWatched: parsedUserInfo.videosWatched || 28 // 观看视频数
        };
      }
    } catch (error) {
      console.error('❌ 从localStorage加载用户信息失败:', error);
    }
    
    // 默认值
    return {
      name: '用户名',
      email: 'user@example.com',
      avatar: '', // 头像URL
      joinDate: '2024-01-01',
      studyTime: 168, // 生成视频数量
      questionsAsked: 45, // 提问数量
      videosWatched: 28 // 观看视频数
    };
  };

  // 保存用户信息到localStorage
  const saveUserInfoToStorage = (userInfo) => {
    try {
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      console.log('💾 用户信息已保存到localStorage:', userInfo);
    } catch (error) {
      console.error('❌ 保存用户信息到localStorage失败:', error);
    }
  };

  // 用户信息状态
  const [userInfo, setUserInfo] = useState(loadUserInfoFromStorage());

  // 设置选项状态
  const [settings, setSettings] = useState({
    notifications: true,
    autoplay: false,
    language: 'zh-CN',
    theme: 'light'
  });

  // 当前活跃的标签页
  const [activeTab, setActiveTab] = useState('overview');

  // 编辑功能已禁用

  // 学习记录数据
  const [learningHistory] = useState([
    // 暂时清空学习记录数据
  ]);

  // 头像上传相关状态
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // 处理ESC键返回
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape') {
        handleBackToHome();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  // 获取视频数量的函数
  const fetchVideoCount = async () => {
    try {
      console.log('🔄 开始获取视频数量...');
      const response = await fetch('http://localhost:3002/api/videos');
      console.log('📡 API响应状态:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 API返回数据:', data);
        
        const videos = data.videos || data; // 兼容不同的API返回格式
        const videoCount = Array.isArray(videos) ? videos.length : 0;
        
        console.log(`📊 计算得到的视频数量: ${videoCount}`);
        
        // 更新用户信息中的视频数量
        setUserInfo(prev => {
          const updated = {
            ...prev,
            studyTime: videoCount // 将studyTime字段用作视频数量
          };
          console.log('🔄 更新后的userInfo:', updated);
          saveUserInfoToStorage(updated); // 保存到localStorage
          return updated;
        });
        
        console.log(`✅ 动态获取视频数量成功: ${videoCount} 个视频`);
      } else {
        console.error('❌ API响应失败:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ 获取视频数量失败:', error);
      console.error('错误详情:', error.message);
      // 如果获取失败，保持默认值
    }
  };

  // 获取用户详细信息的函数
  const fetchUserDetails = async () => {
    try {
      const userEmail = userInfo.email || authHook?.user?.email;
      if (!userEmail) {
        console.log('ℹ️ 未获取到用户邮箱，跳过用户信息获取');
        return;
      }

      console.log('🔄 开始获取用户详细信息...', userEmail);
      const response = await fetch(`http://localhost:3002/api/user/${encodeURIComponent(userEmail)}`);
      console.log('📡 用户信息API响应状态:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 用户信息API返回数据:', data);
        
        if (data.success && data.data.user) {
          const serverUserInfo = data.data.user;
          
          // 格式化注册时间为本地时间显示
          let formattedJoinDate = '2024-01-01';
          if (serverUserInfo.registeredAt) {
            try {
              const registerDate = new Date(serverUserInfo.registeredAt);
              formattedJoinDate = registerDate.toLocaleDateString('zh-CN');
            } catch (error) {
              console.error('❌ 注册时间格式化失败:', error);
            }
          }
          
          console.log(`📅 格式化注册时间: ${serverUserInfo.registeredAt} -> ${formattedJoinDate}`);
          
          // 更新用户信息，包括真实的注册时间
          setUserInfo(prev => {
            const updated = {
              ...prev,
              name: serverUserInfo.name || prev.name,
              email: serverUserInfo.email || prev.email,
              joinDate: formattedJoinDate,
              // 保留其他字段
              studyTime: prev.studyTime,
              questionsAsked: prev.questionsAsked,
              videosWatched: prev.videosWatched
            };
            saveUserInfoToStorage(updated); // 保存到localStorage
            return updated;
          });
          
          console.log('✅ 用户详细信息加载成功，注册时间已更新');
        } else {
          console.log('📄 用户详细信息获取失败');
        }
      } else {
        console.error('❌ 用户信息API响应失败:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ 获取用户详细信息失败:', error);
      // 如果获取失败，保持默认显示
    }
  };

  // 获取用户头像的函数
  const fetchUserAvatar = async () => {
    try {
      const userEmail = userInfo.email || authHook?.user?.email;
      if (!userEmail) {
        console.log('ℹ️ 未获取到用户邮箱，跳过头像获取');
        return;
      }

      console.log('🔄 开始获取用户头像...', userEmail);
      const response = await fetch(`http://localhost:3002/api/avatars/${encodeURIComponent(userEmail)}`);
      console.log('📡 头像API响应状态:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 头像API返回数据:', data);
        
        if (data.success && data.data.hasAvatar && data.data.avatar) {
          let avatarUrl = data.data.avatar.avatarUrl;
          
          // 如果是相对路径，转换为完整URL
          if (avatarUrl.startsWith('/')) {
            avatarUrl = `http://localhost:3002${avatarUrl}`;
          }
          
          console.log('🖼️ 找到用户头像:', avatarUrl);
          
          // 更新用户信息中的头像
          setUserInfo(prev => {
            const updated = {
              ...prev,
              avatar: avatarUrl
            };
            saveUserInfoToStorage(updated); // 保存到localStorage
            return updated;
          });

          // 通知父组件更新头像
          if (authHook && authHook.updateUserAvatar) {
            authHook.updateUserAvatar(avatarUrl);
          }
          
          console.log('✅ 头像加载成功');
        } else {
          console.log('📄 用户暂无头像');
          
          // 清除可能存在的旧头像信息
          setUserInfo(prev => {
            const updated = {
              ...prev,
              avatar: ''
            };
            saveUserInfoToStorage(updated);
            return updated;
          });
        }
      } else {
        console.error('❌ 头像API响应失败:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ 获取用户头像失败:', error);
      // 如果获取失败，保持默认显示（用户名首字母）
    }
  };

  // 监听authHook用户信息变化
  useEffect(() => {
    if (authHook && authHook.user) {
      const authUser = authHook.user;
      console.log('🔄 authHook用户信息更新:', authUser);
      
      // 同步更新用户信息，但保留扩展信息
      setUserInfo(prev => {
        const updated = {
          ...prev,
          name: authUser.name || prev.name,
          email: authUser.email || prev.email,
          avatar: authUser.avatar || prev.avatar
        };
        saveUserInfoToStorage(updated);
        return updated;
      });
    }
  }, [authHook?.user?.avatar, authHook?.user?.name, authHook?.user?.email]);

  // 获取视频数量、用户头像和用户详细信息
  useEffect(() => {
    fetchVideoCount();
    
    // 每次组件挂载都从服务器获取最新头像，确保头像状态正确
    fetchUserAvatar();
    
    // 获取用户详细信息，包括真实的注册时间
    fetchUserDetails();
  }, []); // 仅在组件挂载时执行一次

  // 刷新统计数据
  const handleRefreshStats = () => {
    fetchVideoCount();
    
    // 同时刷新头像信息和用户详细信息
    fetchUserAvatar();
    fetchUserDetails();
    
    handleShowNotification('统计数据已刷新', 'success');
  };

  // 返回主页函数
  const handleBackToHome = () => {
    if (onNavigate) {
      onNavigate('home');
    } else {
      // 备用方案：如果没有onNavigate，使用history.back()
      window.history.back();
    }
  };

  // 编辑功能已禁用，用户信息为只读

  // 处理设置变更
  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    handleShowNotification('设置已保存', 'success');
  };

  // 显示通知（使用传入的函数或默认的控制台输出）
  const handleShowNotification = (message, type) => {
    if (showNotification) {
      showNotification(message, type);
    } else {
      // 备用方案：控制台输出
      console.log(`${type}: ${message}`);
    }
  };

  // 获取用户头像显示
  const getUserAvatar = () => {
    if (userInfo.avatar) {
      return userInfo.avatar;
    }
    return userInfo.name.charAt(0).toUpperCase();
  };

  /**
   * 处理头像文件选择
   */
  const handleAvatarSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        handleShowNotification('请选择图片文件', 'error');
        return;
      }
      
      // 验证文件大小 (限制为5MB)
      if (file.size > 5 * 1024 * 1024) {
        handleShowNotification('图片文件大小不能超过5MB', 'error');
        return;
      }

      setSelectedAvatar(file);
      
      // 创建预览URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * 触发文件选择
   */
  const handleChangeAvatar = () => {
    fileInputRef.current?.click();
  };

  /**
   * 保存头像 - 连接到后端API
   */
  const handleSaveAvatar = async () => {
    if (!selectedAvatar) {
      handleShowNotification('请先选择头像图片', 'error');
      return;
    }

    try {
      console.log('🚀 开始上传头像...');
      
      // 创建FormData用于上传
      const formData = new FormData();
      formData.append('avatar', selectedAvatar);
      formData.append('email', userInfo.email || authHook?.user?.email || 'anonymous'); // 使用邮箱作为用户标识
      formData.append('userId', userInfo.email || authHook?.user?.email || 'anonymous'); // 兼容性

      console.log('📦 准备上传的数据:', {
        fileName: selectedAvatar.name,
        fileSize: selectedAvatar.size,
        fileType: selectedAvatar.type,
        email: userInfo.email || authHook?.user?.email,
        userId: userInfo.email || authHook?.user?.email
      });

      // 调用后端API上传头像
      const response = await fetch('http://localhost:3002/api/upload-avatar', {
        method: 'POST',
        body: formData
      });

      console.log('📡 服务器响应状态:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 上传成功响应:', result);

        if (result.success) {
          // 构建完整的头像URL
          const fullAvatarUrl = `http://localhost:3002${result.data.avatarUrl}`;
          
          console.log('🖼️ 新头像URL:', fullAvatarUrl);
          
          // 更新用户信息中的头像
          setUserInfo(prev => {
            const updated = {
              ...prev,
              avatar: fullAvatarUrl
            };
            saveUserInfoToStorage(updated); // 保存到localStorage
            return updated;
          });

          // 通知父组件更新头像（用于主界面头部显示）
          if (authHook && authHook.updateUserAvatar) {
            authHook.updateUserAvatar(fullAvatarUrl);
          }

          // 清理状态
          setSelectedAvatar(null);
          setAvatarPreview(null);
          
          handleShowNotification('头像更新成功！已保存到touxiang文件夹', 'success');
        } else {
          throw new Error(result.message || '上传失败');
        }
      } else {
        // 尝试解析错误响应
        const responseText = await response.text();
        console.error('❌ 服务器错误响应:', responseText);
        
        let errorMessage = `服务器错误: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // 如果不是JSON，可能是HTML错误页面
          if (responseText.includes('<!DOCTYPE')) {
            errorMessage = '服务器返回了HTML页面，可能API地址不正确或服务器未启动';
          } else {
            errorMessage = `服务器响应异常: ${responseText.substring(0, 100)}`;
          }
        }
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error('❌ 头像上传失败:', error);
      handleShowNotification(`头像上传失败: ${error.message}`, 'error');
    }
  };

  /**
   * 取消头像选择
   */
  const handleCancelAvatar = () => {
    setSelectedAvatar(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * 强制刷新头像（从服务器重新获取）
   */
  const handleRefreshAvatar = async () => {
    console.log('🔄 强制刷新头像...');
    await fetchUserAvatar();
    handleShowNotification('头像已刷新', 'success');
  };

  /**
   * 删除本地头像缓存
   */
  const handleRemoveAvatar = () => {
    setUserInfo(prev => {
      const updated = {
        ...prev,
        avatar: ''
      };
      saveUserInfoToStorage(updated); // 保存到localStorage
      return updated;
    });
    handleShowNotification('头像已移除', 'success');
  };

  // 标签页内容渲染
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="profile-overview">
            {/* 页面头部和刷新按钮 */}
            <div className="overview-header">
              <h2>数据概览</h2>
              <button className="refresh-btn" onClick={handleRefreshStats}>
                <i className="fas fa-sync-alt"></i>
                刷新数据
              </button>
            </div>

            {/* 统计卡片 */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-video"></i>
                </div>
                <div className="stat-info">
                  <h3>{userInfo.studyTime || 0}</h3>
                  <p>生成视频数量</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-question-circle"></i>
                </div>
                <div className="stat-info">
                  <h3>{userInfo.questionsAsked}</h3>
                  <p>答疑次数</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-play-circle"></i>
                </div>
                <div className="stat-info">
                  <h3>{userInfo.videosWatched}</h3>
                  <p>发帖次数</p>
                </div>
              </div>
            </div>

            {/* 最近学习记录 */}
            <div className="recent-activity">
              <h3>最近学习记录</h3>
              <div className="activity-list">
                {learningHistory.slice(0, 3).map(item => (
                  <div key={item.id} className="activity-item">
                    <div className="activity-icon">
                      <i className={`fas ${item.type === 'video' ? 'fa-play' : 'fa-book'}`}></i>
                    </div>
                    <div className="activity-content">
                      <h4>{item.title}</h4>
                      <p>{item.date} · {item.duration}</p>
                    </div>
                    <div className="activity-progress">
                      <div className="progress-circle">
                        <span>{item.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="profile-settings">
            <div className="profile-form">
              <div className="form-group">
                <label>头像</label>
                <div className="avatar-section">
                  <div className="current-avatar">
                    {userInfo.avatar ? (
                      <img src={userInfo.avatar} alt="头像" />
                    ) : (
                      <div className="avatar-placeholder">
                        {getUserAvatar()}
                      </div>
                    )}
                  </div>
                  

                  <div className="avatar-controls">
                    <button className="change-avatar-btn" onClick={handleChangeAvatar}>
                      <i className="fas fa-camera"></i>
                      更换头像
                    </button>
                    
                    {userInfo.avatar && (
                      <>
                        <button className="refresh-avatar-btn" onClick={handleRefreshAvatar} title="从服务器重新获取头像">
                          <i className="fas fa-sync-alt"></i>
                          刷新头像
                        </button>
                        <button className="remove-avatar-btn" onClick={handleRemoveAvatar} title="移除当前头像">
                          <i className="fas fa-trash"></i>
                          移除头像
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* 隐藏的文件输入 */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    style={{ display: 'none' }}
                  />
                  
                  {/* 头像预览和操作区域 */}
                  {avatarPreview && (
                    <div className="avatar-preview-section">
                      <div className="preview-container">
                        <img src={avatarPreview} alt="头像预览" className="avatar-preview" />
                        <div className="preview-actions">
                          <button className="save-avatar-btn" onClick={handleSaveAvatar}>
                            <i className="fas fa-check"></i>
                            保存头像
                          </button>
                          <button className="cancel-avatar-btn" onClick={handleCancelAvatar}>
                            <i className="fas fa-times"></i>
                            取消
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>用户名</label>
                <div className="form-display">{userInfo.name}</div>
              </div>

              <div className="form-group">
                <label>邮箱地址</label>
                <div className="form-display">{userInfo.email}</div>
              </div>

              <div className="form-group">
                <label>注册时间</label>
                <div className="form-display">{userInfo.joinDate}</div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="app-settings">
            <div className="settings-section">
              <h3>通知设置</h3>
              <div className="setting-item">
                <div className="setting-info">
                  <h4>推送通知</h4>
                  <p>接收系统通知和学习提醒</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h3>播放设置</h3>
              <div className="setting-item">
                <div className="setting-info">
                  <h4>自动播放</h4>
                  <p>视频结束后自动播放下一个</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.autoplay}
                    onChange={(e) => handleSettingChange('autoplay', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h3>偏好设置</h3>
              <div className="setting-item">
                <div className="setting-info">
                  <h4>语言</h4>
                  <p>选择界面显示语言</p>
                </div>
                <select 
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className="setting-select"
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="en-US">English</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>主题</h4>
                  <p>选择界面主题风格</p>
                </div>
                <select 
                  value={settings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                  className="setting-select"
                >
                  <option value="light">浅色主题</option>
                  <option value="dark">深色主题</option>
                  <option value="auto">跟随系统</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="learning-history">
            <div className="history-list">
              {learningHistory.map(item => (
                <div key={item.id} className="history-item">
                  <div className="history-thumbnail">
                    <i className={`fas ${item.type === 'video' ? 'fa-play' : 'fa-book'}`}></i>
                  </div>
                  <div className="history-content">
                    <h4>{item.title}</h4>
                    <p className="history-meta">
                      <span>{item.date}</span>
                      <span>·</span>
                      <span>{item.duration}</span>
                    </p>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{item.progress}%</span>
                  </div>
                  <div className="history-actions">
                    <button className="continue-btn">
                      <i className="fas fa-play"></i>
                      继续学习
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="profile-page">
      {/* 页面头部 */}
      <div className="profile-header">
        <div className="header-content">
          <button className="back-btn" onClick={handleBackToHome}>
            <i className="fas fa-arrow-left"></i>
            返回
          </button>
          <h1>个人中心</h1>
        </div>
      </div>

      <div className="profile-container">
        {/* 侧边栏 */}
        <div className="profile-sidebar">
          {/* 用户信息卡片 */}
          <div className="user-card">
            <div className="user-avatar-large">
              {userInfo.avatar ? (
                <img src={userInfo.avatar} alt="头像" />
              ) : (
                <div className="avatar-placeholder-large">
                  {getUserAvatar()}
                </div>
              )}
            </div>
            <div className="user-info">
              <h2>{userInfo.name}</h2>
              <p>{userInfo.email}</p>
              <span className="join-date">加入于 {userInfo.joinDate}</span>
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className="profile-nav">
            <button 
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="fas fa-chart-line"></i>
              概览
            </button>
            <button 
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <i className="fas fa-user"></i>
              个人信息
            </button>
            <button 
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <i className="fas fa-cog"></i>
              设置
            </button>
            <button 
              className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <i className="fas fa-history"></i>
              学习记录
            </button>
          </nav>
        </div>

        {/* 主要内容区域 */}
        <div className="profile-main">
          <div className="content-wrapper">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* 快捷操作提示 - 已隐藏但保留ESC键功能 */}
      <div className="keyboard-hint" style={{ display: 'none' }}>
        <i className="fas fa-keyboard"></i>
        按 ESC 键返回主界面
      </div>
    </div>
  );
};

export default Profile; 