import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import FloatingElements from '../components/common/FloatingElements';
import Notification from '../components/common/Notification';
import { submitFeedback } from '../utils/api';

/**
 * 问题反馈页面组件
 * 提供用户反馈问题和建议的表单界面
 */
const Feedback = ({ authHook, onNavigate, onLoginClick, onLogout, showNotification }) => {
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    type: 'bug', // bug, suggestion, question, other
    title: '',
    description: '',
    email: '',
    priority: 'medium', // low, medium, high
    category: 'general' // general, ui, performance, feature, account
  });
  const [submitting, setSubmitting] = useState(false);

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
   * 显示本地通知
   */
  const showLocalNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
    
    // 如果有全局通知函数，也调用它
    if (showNotification) {
      showNotification(message, type);
    }
  };

  /**
   * 处理登录点击
   */
  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    }
  };

  /**
   * 返回主页
   */
  const handleGoHome = () => {
    if (onNavigate) {
      onNavigate('home');
    }
  };

  /**
   * 处理表单输入变化
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * 表单验证
   */
  const validateForm = () => {
    if (!formData.title.trim()) {
      showLocalNotification('请输入问题标题', 'error');
      return false;
    }

    if (!formData.description.trim()) {
      showLocalNotification('请详细描述问题', 'error');
      return false;
    }

    if (formData.email && !isValidEmail(formData.email)) {
      showLocalNotification('请输入有效的邮箱地址', 'error');
      return false;
    }

    return true;
  };

  /**
   * 邮箱验证
   */
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * 提交反馈
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    
    try {
      // 构建反馈数据
      const feedbackData = {
        ...formData,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // 调用API提交反馈
      const result = await submitFeedback(feedbackData);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      showLocalNotification('反馈提交成功！我们会尽快处理您的问题', 'success');
      console.log('📝 反馈已提交:', feedbackData);
      
      // 重置表单
      setFormData({
        type: 'bug',
        title: '',
        description: '',
        email: '',
        priority: 'medium',
        category: 'general'
      });
      
    } catch (error) {
      showLocalNotification('提交失败，请稍后重试', 'error');
      console.error('❌ 反馈提交失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 重置表单
   */
  const handleReset = () => {
    setFormData({
      type: 'bug',
      title: '',
      description: '',
      email: '',
      priority: 'medium',
      category: 'general'
    });
    showLocalNotification('表单已重置', 'info');
  };

  return (
    <div className="Feedback">
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
          currentPage="feedback"
        />

        {/* 主要内容区域 */}
        <main style={{ minHeight: '70vh', paddingTop: '20px' }}>
          {/* 页面标题 */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '40px' 
          }}>
            <h1 style={{ 
              fontSize: '2.8rem', 
              color: 'var(--dark)', 
              marginBottom: '18px',
              fontWeight: '800',
              lineHeight: '1.2'
            }}>
              <i className="fas fa-comment-dots" style={{ color: 'var(--primary)', marginRight: '12px' }}></i>
              <span style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                问题反馈
              </span>
            </h1>
            <p style={{ 
              color: 'var(--gray)', 
              fontSize: '1.1rem',
              maxWidth: '580px',
              margin: '0 auto 20px'
            }}>
              您的反馈对我们很重要，帮助我们提供更好的服务体验
            </p>
            
            {/* 返回主界面按钮 */}
            <button
              onClick={handleGoHome}
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid var(--light-border)',
                color: 'var(--gray)',
                padding: '8px 20px',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--primary)';
                e.target.style.color = 'white';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.9)';
                e.target.style.color = 'var(--gray)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <i className="fas fa-arrow-left"></i>
              返回主界面
            </button>
          </div>

          {/* 反馈表单 */}
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}>
            {/* 表单头部 */}
            <div style={{
              padding: '25px 30px',
              background: 'rgba(255,255,255,0.95)',
              borderBottom: '1px solid var(--light-border)'
            }}>
              <h2 style={{
                fontSize: '22px',
                color: 'var(--dark)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <i className="fas fa-edit" style={{ color: 'var(--primary)' }}></i>
                提交反馈
              </h2>
              <p style={{
                color: 'var(--gray)',
                fontSize: '14px',
                margin: '8px 0 0',
                lineHeight: '1.5'
              }}>
                请详细描述您遇到的问题或建议，我们会认真对待每一份反馈
              </p>
            </div>

            {/* 表单内容 */}
            <form onSubmit={handleSubmit} style={{ padding: '30px' }}>
              {/* 反馈类型和优先级 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '25px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: 'var(--dark)',
                    marginBottom: '8px'
                  }}>
                    <i className="fas fa-tag" style={{ color: 'var(--primary)', marginRight: '6px' }}></i>
                    反馈类型
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid var(--light-border)',
                      borderRadius: '12px',
                      fontSize: '15px',
                      background: 'white',
                      color: 'var(--dark)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <option value="bug">🐛 错误报告</option>
                    <option value="suggestion">💡 功能建议</option>
                    <option value="question">❓ 使用问题</option>
                    <option value="other">📝 其他反馈</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: 'var(--dark)',
                    marginBottom: '8px'
                  }}>
                    <i className="fas fa-exclamation-triangle" style={{ color: 'var(--warning)', marginRight: '6px' }}></i>
                    优先级
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid var(--light-border)',
                      borderRadius: '12px',
                      fontSize: '15px',
                      background: 'white',
                      color: 'var(--dark)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <option value="low">🟢 低优先级</option>
                    <option value="medium">🟡 中等优先级</option>
                    <option value="high">🔴 高优先级</option>
                  </select>
                </div>
              </div>

              {/* 问题分类 */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--dark)',
                  marginBottom: '8px'
                }}>
                  <i className="fas fa-folder" style={{ color: 'var(--secondary)', marginRight: '6px' }}></i>
                  问题分类
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid var(--light-border)',
                    borderRadius: '12px',
                    fontSize: '15px',
                    background: 'white',
                    color: 'var(--dark)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <option value="general">📋 一般问题</option>
                  <option value="ui">🎨 界面设计</option>
                  <option value="performance">⚡ 性能优化</option>
                  <option value="feature">🔧 功能相关</option>
                  <option value="account">👤 账户问题</option>
                </select>
              </div>

              {/* 问题标题 */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--dark)',
                  marginBottom: '8px'
                }}>
                  <i className="fas fa-heading" style={{ color: 'var(--primary)', marginRight: '6px' }}></i>
                  问题标题 <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="请简洁描述您遇到的问题..."
                  maxLength="100"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid var(--light-border)',
                    borderRadius: '12px',
                    fontSize: '15px',
                    background: 'white',
                    color: 'var(--dark)',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
                <div style={{
                  fontSize: '12px',
                  color: 'var(--gray)',
                  marginTop: '5px',
                  textAlign: 'right'
                }}>
                  {formData.title.length}/100
                </div>
              </div>

              {/* 详细描述 */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--dark)',
                  marginBottom: '8px'
                }}>
                  <i className="fas fa-align-left" style={{ color: 'var(--secondary)', marginRight: '6px' }}></i>
                  详细描述 <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="请详细描述问题的具体情况、重现步骤、期望结果等..."
                  rows={6}
                  maxLength="1000"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid var(--light-border)',
                    borderRadius: '12px',
                    fontSize: '15px',
                    background: 'white',
                    color: 'var(--dark)',
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit',
                    lineHeight: '1.5'
                  }}
                />
                <div style={{
                  fontSize: '12px',
                  color: 'var(--gray)',
                  marginTop: '5px',
                  textAlign: 'right'
                }}>
                  {formData.description.length}/1000
                </div>
              </div>

              {/* 联系邮箱 */}
              <div style={{ marginBottom: '30px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--dark)',
                  marginBottom: '8px'
                }}>
                  <i className="fas fa-envelope" style={{ color: 'var(--primary)', marginRight: '6px' }}></i>
                  联系邮箱 <span style={{ fontSize: '13px', color: 'var(--gray)' }}>(可选)</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid var(--light-border)',
                    borderRadius: '12px',
                    fontSize: '15px',
                    background: 'white',
                    color: 'var(--dark)',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
                <div style={{
                  fontSize: '12px',
                  color: 'var(--gray)',
                  marginTop: '5px'
                }}>
                  填写邮箱可以让我们及时回复您的反馈
                </div>
              </div>

              {/* 提交按钮 */}
              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={submitting}
                  style={{
                    background: 'var(--light)',
                    color: 'var(--gray)',
                    border: '2px solid var(--light-border)',
                    padding: '12px 25px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  <i className="fas fa-undo" style={{ marginRight: '6px' }}></i>
                  重置
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: submitting 
                      ? 'var(--gray)' 
                      : 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 30px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.4s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {submitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      提交中...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      提交反馈
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 帮助信息 */}
          <div style={{
            maxWidth: '800px',
            margin: '30px auto 0',
            padding: '20px',
            background: 'rgba(255,255,255,0.8)',
            borderRadius: '15px',
            border: '1px solid var(--light-border)',
            backdropFilter: 'blur(5px)'
          }}>
            <h3 style={{
              fontSize: '18px',
              color: 'var(--dark)',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-lightbulb" style={{ color: 'var(--warning)' }}></i>
              反馈小贴士
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '15px',
              fontSize: '14px',
              color: 'var(--gray)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <i className="fas fa-check-circle" style={{ color: 'var(--success)', marginTop: '2px' }}></i>
                <span>详细描述问题有助于我们快速定位并解决</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <i className="fas fa-check-circle" style={{ color: 'var(--success)', marginTop: '2px' }}></i>
                <span>提供重现步骤可以帮助我们复现问题</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <i className="fas fa-check-circle" style={{ color: 'var(--success)', marginTop: '2px' }}></i>
                <span>留下邮箱地址可以获得问题处理进度反馈</span>
              </div>
            </div>
          </div>
        </main>

        {/* 页脚 */}
        <Footer />
      </div>

      {/* 通知组件 */}
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

export default Feedback; 