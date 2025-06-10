import React, { useState } from 'react';

/**
 * 注册表单组件
 */
const RegisterForm = ({ authHook, onSuccess, onError, onGoogleLogin, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const { isLoading } = authHook;

  /**
   * 处理输入变化
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 重置错误
    setErrors({});
    
    const result = await authHook.register(formData.name, formData.email, formData.password);
    
    if (result.success) {
      onSuccess(result.message);
    } else {
      if (result.field) {
        setErrors({ [result.field]: result.message });
      } else {
        onError(result.message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>创建账户</h2>
      <p>加入未决定学习社区</p>
      
      {/* Google注册按钮 */}
      <button type="button" className="google-login" onClick={onGoogleLogin}>
        <i className="fab fa-google"></i>
        使用Google注册
      </button>
      
      {/* 分割线 */}
      <div className="divider">
        <span>或</span>
      </div>
      
      {/* 姓名输入 */}
      <div className="input-group">
        <div className="input-icon">
          <i className="fas fa-user"></i>
        </div>
        <input
          type="text"
          name="name"
          className="auth-input"
          placeholder="全名"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
        {errors.name && (
          <div className="error-message" style={{ display: 'block' }}>
            {errors.name}
          </div>
        )}
      </div>
      
      {/* 邮箱输入 */}
      <div className="input-group">
        <div className="input-icon">
          <i className="fas fa-envelope"></i>
        </div>
        <input
          type="email"
          name="email"
          className="auth-input"
          placeholder="电子邮件地址"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
        {errors.email && (
          <div className="error-message" style={{ display: 'block' }}>
            {errors.email}
          </div>
        )}
      </div>
      
      {/* 密码输入 */}
      <div className="input-group">
        <div className="input-icon">
          <i className="fas fa-lock"></i>
        </div>
        <input
          type="password"
          name="password"
          className="auth-input"
          placeholder="创建密码 (至少6位)"
          value={formData.password}
          onChange={handleInputChange}
          minLength="6"
          required
        />
        {errors.password && (
          <div className="error-message" style={{ display: 'block' }}>
            {errors.password}
          </div>
        )}
      </div>
      
      {/* 提交按钮 */}
      <button type="submit" className="submit-btn" disabled={isLoading}>
        {isLoading ? '注册中...' : '创建账户'}
      </button>
      
      {/* 登录链接 */}
      <div className="auth-footer">
        已有账户？
        <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>
          登录
        </a>
      </div>
      
      {/* 安全提示 */}
      <div className="security">
        <i className="fas fa-shield-alt"></i>
        您的信息安全受到保护
      </div>
    </form>
  );
};

export default RegisterForm; 