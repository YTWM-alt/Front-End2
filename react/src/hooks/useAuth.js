import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, USER_STATUS, VALIDATION_RULES } from '../utils/constants';

/**
 * 用户认证管理Hook
 * 提供用户登录、注册、登出等功能
 */
export const useAuth = () => {
  // 用户状态管理
  const [user, setUser] = useState({
    isLoggedIn: false,
    name: '',
    email: '',
    avatar: null,
    status: USER_STATUS.LOGGED_OUT
  });

  // 初始化用户状态
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // 从本地存储读取用户信息
        const storedUser = localStorage.getItem(STORAGE_KEYS.user);
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.isLoggedIn) {
            setUser({
              isLoggedIn: true,
              name: userData.name || '',
              email: userData.email || '',
              avatar: userData.avatar || null,
              status: USER_STATUS.LOGGED_IN
            });
          }
        }
      } catch (error) {
        console.error('初始化用户状态失败:', error);
        // 清除可能损坏的数据
        localStorage.removeItem(STORAGE_KEYS.user);
      }
    };

    initializeAuth();
  }, []);

  /**
   * 验证用户输入
   * @param {string} type - 验证类型 (email, password, name)
   * @param {string} value - 需要验证的值
   * @returns {Object} 验证结果
   */
  const validateInput = useCallback((type, value) => {
    const rule = VALIDATION_RULES[type];
    if (!rule) return { isValid: true };

    // 检查是否为空
    if (!value || value.trim() === '') {
      return {
        isValid: false,
        message: rule.required
      };
    }

    // 检查最小长度
    if (rule.minLength && value.length < rule.minLength) {
      return {
        isValid: false,
        message: rule.minLengthMessage
      };
    }

    // 检查模式匹配（如邮箱格式）
    if (rule.pattern && !rule.pattern.test(value)) {
      return {
        isValid: false,
        message: rule.patternMessage
      };
    }

    return { isValid: true };
  }, []);

  /**
   * 用户登录
   * @param {string} email - 用户邮箱
   * @param {string} password - 用户密码
   * @returns {Object} 登录结果
   */
  const login = useCallback(async (email, password) => {
    // 设置加载状态
    setUser(prev => ({ ...prev, status: USER_STATUS.LOADING }));

    try {
      // 验证输入
      const emailValidation = validateInput('email', email);
      if (!emailValidation.isValid) {
        setUser(prev => ({ ...prev, status: USER_STATUS.LOGGED_OUT }));
        return {
          success: false,
          message: emailValidation.message,
          field: 'email'
        };
      }

      const passwordValidation = validateInput('password', password);
      if (!passwordValidation.isValid) {
        setUser(prev => ({ ...prev, status: USER_STATUS.LOGGED_OUT }));
        return {
          success: false,
          message: passwordValidation.message,
          field: 'password'
        };
      }

      // 调用真实的登录API
      console.log('🔄 正在调用登录API...');
      const response = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      });

      const result = await response.json();
      console.log('📡 登录API响应:', result);

      if (!response.ok || !result.message !== '登录成功') {
        setUser(prev => ({ ...prev, status: USER_STATUS.LOGGED_OUT }));
        return {
          success: false,
          message: result.message || result.error || '登录失败'
        };
      }

      // 保存token到localStorage
      if (result.access_token) {
        localStorage.setItem(STORAGE_KEYS.token, result.access_token);
      }

      // 处理头像URL，确保是完整路径
      let avatar = result.user?.avatar || user.avatar;
      if (avatar && avatar.startsWith('/')) {
        avatar = `http://localhost:3002${avatar}`;
      }

      // 更新用户状态
      const newUserData = {
        isLoggedIn: true,
        name: result.user?.username || '',
        email: result.user?.email || '',
        id: result.user?.id,
        avatar: avatar, // 优先使用服务器返回的头像
        status: USER_STATUS.LOGGED_IN,
      };

      setUser(newUserData);

      // 保存到本地存储
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(newUserData));

      console.log(`✅ 用户登录成功: ${result.user?.username}`);

      return {
        success: true,
        message: result.message || '登录成功！'
      };

    } catch (error) {
      console.error('❌ 登录失败:', error);
      setUser(prev => ({ ...prev, status: USER_STATUS.LOGGED_OUT }));
      return {
        success: false,
        message: '网络错误，请检查服务器连接'
      };
    }
  }, [validateInput, user.avatar]);

  /**
   * 用户注册
   * @param {string} name - 用户姓名
   * @param {string} email - 用户邮箱
   * @param {string} password - 用户密码
   * @returns {Object} 注册结果
   */
  const register = useCallback(async (name, email, password) => {
    // 设置加载状态
    setUser(prev => ({ ...prev, status: USER_STATUS.LOADING }));

    try {
      // 验证输入
      const nameValidation = validateInput('name', name);
      if (!nameValidation.isValid) {
        setUser(prev => ({ ...prev, status: USER_STATUS.LOGGED_OUT }));
        return {
          success: false,
          message: nameValidation.message,
          field: 'name'
        };
      }

      const emailValidation = validateInput('email', email);
      if (!emailValidation.isValid) {
        setUser(prev => ({ ...prev, status: USER_STATUS.LOGGED_OUT }));
        return {
          success: false,
          message: emailValidation.message,
          field: 'email'
        };
      }

      const passwordValidation = validateInput('password', password);
      if (!passwordValidation.isValid) {
        setUser(prev => ({ ...prev, status: USER_STATUS.LOGGED_OUT }));
        return {
          success: false,
          message: passwordValidation.message,
          field: 'password'
        };
      }

      // 调用真实的注册API
      console.log('🔄 正在调用注册API...');
      const response = await fetch('http://localhost:3002/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: name.trim(),
          email: email.trim(),
          password: password
        })
      });

      const result = await response.json();
      console.log('📡 注册API响应:', result);

      if (!response.ok || !result.success) {
        setUser(prev => ({ ...prev, status: USER_STATUS.LOGGED_OUT }));
        return {
          success: false,
          message: result.message || '注册失败'
        };
      }

      // 注册成功后自动登录
      const newUserData = {
        isLoggedIn: true,
        name: result.data.name,
        email: result.data.email,
        avatar: user.avatar,
        status: USER_STATUS.LOGGED_IN,
        registeredAt: result.data.registeredAt
      };

      setUser(newUserData);

      // 保存到本地存储
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(newUserData));

      console.log(`✅ 用户注册成功: ${result.data.name}`);

      return {
        success: true,
        message: result.message || '注册成功！'
      };

    } catch (error) {
      console.error('❌ 注册失败:', error);
      setUser(prev => ({ ...prev, status: USER_STATUS.LOGGED_OUT }));
      return {
        success: false,
        message: '网络错误，请检查服务器连接'
      };
    }
  }, [validateInput, user.avatar]);

  /**
   * 用户登出
   */
  const logout = useCallback(() => {
    // 清除用户状态
    setUser({
      isLoggedIn: false,
      name: '',
      email: '',
      avatar: null,
      status: USER_STATUS.LOGGED_OUT
    });

    // 清除本地存储
    localStorage.removeItem(STORAGE_KEYS.user);
  }, []);

  /**
   * Google登录（预留功能）
   */
  const loginWithGoogle = useCallback(async () => {
    // TODO: 集成Google OAuth
    console.log('Google登录功能待开发');
    return {
      success: false,
      message: '此功能暂不可用'
    };
  }, []);

  /**
   * 忘记密码（预留功能）
   */
  const forgotPassword = useCallback(async (email) => {
    // TODO: 实现忘记密码功能
    console.log('忘记密码功能待开发');
    return {
      success: false,
      message: '此功能暂不可用'
    };
  }, []);

  /**
   * 获取用户头像字母
   */
  const getUserAvatar = useCallback(() => {
    return user.name ? user.name.charAt(0).toUpperCase() : 'U';
  }, [user.name]);

  /**
   * 更新用户头像
   * @param {string} avatarUrl - 新的头像URL
   */
  const updateUserAvatar = useCallback((avatarUrl) => {
    try {
      // 更新用户状态
      const updatedUser = {
        ...user,
        avatar: avatarUrl
      };
      
      setUser(updatedUser);
      
      // 保存到本地存储
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
      
      console.log('头像更新成功:', avatarUrl);
    } catch (error) {
      console.error('头像更新失败:', error);
    }
  }, [user]);

  // 返回Hook提供的方法和状态
  return {
    // 用户状态
    user,
    isLoggedIn: user.isLoggedIn,
    isLoading: user.status === USER_STATUS.LOADING,
    
    // 用户操作方法
    login,
    register,
    logout,
    loginWithGoogle,
    forgotPassword,
    
    // 工具方法
    validateInput,
    getUserAvatar,
    updateUserAvatar
  };
}; 