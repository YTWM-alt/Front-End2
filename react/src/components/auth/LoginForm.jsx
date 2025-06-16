import React, { useState } from 'react';

/**
 * 登录表单组件
 */
const LoginForm = ({ authHook, onSuccess, onError, onGoogleLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
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
    
    const result = await authHook.login(formData.email, formData.password);
    
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
      <h2>欢迎回来</h2>
      <p>继续在智映教匠平台上探索学习</p>
      
      {/* Google登录按钮 */}
      <button type="button" className="google-login" onClick={onGoogleLogin}>
        <i className="fab fa-google"></i>
        使用Google登录
      </button>
      
      {/* 分割线 */}
      <div className="divider">
        <span>或</span>
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
          placeholder="密码"
          value={formData.password}
          onChange={handleInputChange}
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
        {isLoading ? '登录中...' : '登录'}
      </button>
      
      {/* 忘记密码链接 */}
      <div className="auth-footer">
        <a href="#" onClick={(e) => { e.preventDefault(); console.log('忘记密码'); }}>
          忘记密码？
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

export default LoginForm; 