/**
 * 🔌 React前端API服务工具
 * 统一管理所有API调用，确保端口和端点的一致性
 * 
 * 版本: 2.0.0
 * 创建时间: 2025-01-28
 */

// =============================================================================
// 配置常量
// =============================================================================

const API_BASE_URL = 'http://localhost:3002'; // 统一使用3002端口

const API_ENDPOINTS = {
  // 健康检查
  HEALTH: '/api/health',
  
  // 问题管理
  SAVE_QUESTION: '/api/save-question',
  GET_QUESTIONS: '/api/questions',
  
  // 视频管理
  GET_VIDEOS: '/api/videos',
  DELETE_VIDEO: '/api/videos',
  PROCESS_AI_VIDEO: '/api/process-ai-video',
  
  // 头像管理
  UPLOAD_AVATAR: '/api/upload-avatar',
  GET_AVATARS: '/api/avatars',
  
  // 反馈管理
  SUBMIT_FEEDBACK: '/api/feedback',
  GET_FEEDBACK: '/api/feedback',
  
  // AI服务
  GET_PENDING_ANSWERS: '/api/pending-answers'
};

const STATIC_ENDPOINTS = {
  VIDEOS: '/videos',
  AVATARS: '/avatars'
};

// =============================================================================
// API工具类
// =============================================================================

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.defaultTimeout = 10000; // 10秒
  }

  /**
   * 构建完整的API URL
   */
  buildUrl(endpoint, params = {}) {
    let url = this.baseUrl + endpoint;
    
    // 替换URL中的参数
    Object.keys(params).forEach(key => {
      url = url.replace(`:${key}`, encodeURIComponent(params[key]));
    });
    
    return url;
  }

  /**
   * 通用HTTP请求方法
   */
  async request(endpoint, options = {}) {
    const url = this.buildUrl(endpoint, options.params || {});
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // 如果是FormData，移除Content-Type让浏览器自动设置
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.defaultTimeout);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API请求失败: ${endpoint}`, error);
      throw error;
    }
  }

  // =============================================================================
  // 健康检查API
  // =============================================================================

  /**
   * 检查服务器健康状态
   */
  async healthCheck() {
    try {
      return await this.request(API_ENDPOINTS.HEALTH);
    } catch (error) {
      console.error('健康检查失败:', error);
      throw error;
    }
  }

  // =============================================================================
  // 问题管理API
  // =============================================================================

  /**
   * 保存用户问题
   */
  async saveQuestion(question) {
    return await this.request(API_ENDPOINTS.SAVE_QUESTION, {
      method: 'POST',
      body: JSON.stringify({ question })
    });
  }

  /**
   * 获取问题列表
   */
  async getQuestions(limit = 50) {
    const url = `${API_ENDPOINTS.GET_QUESTIONS}?limit=${limit}`;
    return await this.request(url);
  }

  // =============================================================================
  // 视频管理API
  // =============================================================================

  /**
   * 获取视频列表（带强制刷新）
   */
  async getVideos(forceRefresh = false) {
    const timestamp = forceRefresh ? `?_t=${Date.now()}` : '';
    const url = API_ENDPOINTS.GET_VIDEOS + timestamp;
    return await this.request(url);
  }

  /**
   * 删除视频文件
   */
  async deleteVideo(filename) {
    return await this.request(API_ENDPOINTS.DELETE_VIDEO, {
      method: 'DELETE',
      params: { filename }
    });
  }

  /**
   * 处理AI生成的视频
   */
  async processAIVideo() {
    return await this.request(API_ENDPOINTS.PROCESS_AI_VIDEO, {
      method: 'POST',
      timeout: 120000 // 2分钟超时
    });
  }

  /**
   * 获取视频文件URL
   */
  getVideoUrl(filename) {
    return `${this.baseUrl}${STATIC_ENDPOINTS.VIDEOS}/${encodeURIComponent(filename)}`;
  }

  // =============================================================================
  // 头像管理API
  // =============================================================================

  /**
   * 上传用户头像
   */
  async uploadAvatar(file, userId) {
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('userId', userId);

    return await this.request(API_ENDPOINTS.UPLOAD_AVATAR, {
      method: 'POST',
      body: formData,
      timeout: 60000 // 1分钟超时
    });
  }

  /**
   * 获取用户头像列表
   */
  async getUserAvatars(userId = null) {
    const endpoint = userId ? 
      `${API_ENDPOINTS.GET_AVATARS}/${encodeURIComponent(userId)}` : 
      API_ENDPOINTS.GET_AVATARS;
    return await this.request(endpoint);
  }

  /**
   * 获取头像文件URL
   */
  getAvatarUrl(filename) {
    return `${this.baseUrl}${STATIC_ENDPOINTS.AVATARS}/${encodeURIComponent(filename)}`;
  }

  // =============================================================================
  // 反馈管理API
  // =============================================================================

  /**
   * 提交用户反馈
   */
  async submitFeedback(feedbackData) {
    return await this.request(API_ENDPOINTS.SUBMIT_FEEDBACK, {
      method: 'POST',
      body: JSON.stringify(feedbackData)
    });
  }

  /**
   * 获取反馈列表（管理员功能）
   */
  async getFeedback(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `${API_ENDPOINTS.GET_FEEDBACK}?${queryParams}` : API_ENDPOINTS.GET_FEEDBACK;
    return await this.request(url);
  }

  // =============================================================================
  // AI服务API
  // =============================================================================

  /**
   * 获取待处理的AI回答
   */
  async getPendingAnswers(since = null) {
    const queryParams = since ? `?since=${encodeURIComponent(since)}` : '';
    const url = API_ENDPOINTS.GET_PENDING_ANSWERS + queryParams;
    return await this.request(url);
  }

  // =============================================================================
  // 批量操作
  // =============================================================================

  /**
   * 批量检查服务状态
   */
  async checkAllServices() {
    const results = {
      health: null,
      videos: null,
      questions: null,
      timestamp: new Date().toISOString()
    };

    try {
      // 并行检查所有服务
      const [healthResult, videosResult, questionsResult] = await Promise.allSettled([
        this.healthCheck(),
        this.getVideos(),
        this.getQuestions(1) // 只获取1个问题用于测试
      ]);

      results.health = healthResult.status === 'fulfilled' ? 
        { status: 'ok', data: healthResult.value } : 
        { status: 'error', error: healthResult.reason.message };

      results.videos = videosResult.status === 'fulfilled' ? 
        { status: 'ok', count: videosResult.value.videos?.length || 0 } : 
        { status: 'error', error: videosResult.reason.message };

      results.questions = questionsResult.status === 'fulfilled' ? 
        { status: 'ok', count: questionsResult.value.questions?.length || 0 } : 
        { status: 'error', error: questionsResult.reason.message };

    } catch (error) {
      console.error('批量检查服务状态失败:', error);
    }

    return results;
  }
}

// =============================================================================
// 错误处理工具
// =============================================================================

export const ApiError = {
  /**
   * 判断是否为网络错误
   */
  isNetworkError(error) {
    return error.name === 'TypeError' || error.message.includes('Failed to fetch');
  },

  /**
   * 判断是否为超时错误
   */
  isTimeoutError(error) {
    return error.name === 'AbortError' || error.message.includes('timeout');
  },

  /**
   * 获取用户友好的错误消息
   */
  getUserMessage(error) {
    if (this.isNetworkError(error)) {
      return '网络连接失败，请检查网络设置';
    }
    if (this.isTimeoutError(error)) {
      return '请求超时，请稍后重试';
    }
    if (error.message.includes('HTTP 404')) {
      return '请求的资源不存在';
    }
    if (error.message.includes('HTTP 500')) {
      return '服务器内部错误，请稍后重试';
    }
    return error.message || '未知错误';
  }
};

// =============================================================================
// 导出API服务实例
// =============================================================================

const apiService = new ApiService();

export default apiService;
export { ApiService, API_BASE_URL, API_ENDPOINTS, STATIC_ENDPOINTS };

// =============================================================================
// 用法示例和说明
// =============================================================================

/*
// 基本用法示例：

import apiService from '../utils/apiService';

// 1. 健康检查
const healthStatus = await apiService.healthCheck();

// 2. 获取视频列表
const videos = await apiService.getVideos(true); // true表示强制刷新

// 3. 上传头像
const avatarResult = await apiService.uploadAvatar(file, 'user123');

// 4. 保存问题
const saveResult = await apiService.saveQuestion('什么是React？');

// 5. 错误处理
try {
  const result = await apiService.getVideos();
} catch (error) {
  const userMessage = ApiError.getUserMessage(error);
  console.error('用户友好消息:', userMessage);
}

// 6. 批量检查服务状态
const serviceStatus = await apiService.checkAllServices();
console.log('所有服务状态:', serviceStatus);

*/ 