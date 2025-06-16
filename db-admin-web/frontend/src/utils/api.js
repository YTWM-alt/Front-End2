// API配置和请求工具函数
const API_BASE_URL = 'http://localhost:8081/api';

/**
 * 发送API请求的基础函数
 * @param {string} endpoint - API端点
 * @param {object} options - 请求选项
 * @returns {Promise} 响应数据
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const config = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }
    
    return data;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
};

// 用户管理API
export const userAPI = {
  // 获取用户列表
  getUsers: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/users?${searchParams}`);
  },
  
  // 创建用户
  createUser: (userData) => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  
  // 更新用户信息
  updateUser: (userId, userData) => {
    return apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },
  
  // 删除用户
  deleteUser: (userId) => {
    return apiRequest(`/users/${userId}`, { method: 'DELETE' });
  }
};

// 问题管理API
export const questionAPI = {
  // 获取问题列表
  getQuestions: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/questions?${searchParams}`);
  },
  
  // 创建问题
  createQuestion: (questionData) => {
    return apiRequest('/questions', {
      method: 'POST',
      body: JSON.stringify(questionData)
    });
  },
  
  // 更新问题信息
  updateQuestion: (questionId, questionData) => {
    return apiRequest(`/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(questionData)
    });
  },
  
  // 删除问题
  deleteQuestion: (questionId) => {
    return apiRequest(`/questions/${questionId}`, { method: 'DELETE' });
  }
};

// 视频管理API
export const videoAPI = {
  // 获取视频列表
  getVideos: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/videos?${searchParams}`);
  },
  
  // 创建视频（文件上传）
  createVideo: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiRequest('/videos', {
      method: 'POST',
      headers: {}, // 让浏览器自动设置Content-Type为multipart/form-data
      body: formData
    });
  },
  
  // 更新视频信息
  updateVideo: (videoId, videoData) => {
    return apiRequest(`/videos/${videoId}`, {
      method: 'PUT',
      body: JSON.stringify(videoData)
    });
  },
  
  // 删除视频
  deleteVideo: (videoId) => {
    return apiRequest(`/videos/${videoId}`, { method: 'DELETE' });
  },
  
  // 获取视频流
  getVideoStream: (videoId) => {
    return `${API_BASE_URL}/static/video/${videoId}`;
  }
};

// 反馈管理API
export const feedbackAPI = {
  // 获取反馈列表
  getFeedbacks: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/feedbacks?${searchParams}`);
  },
  
  // 创建反馈
  createFeedback: (feedbackData) => {
    return apiRequest('/feedbacks', {
      method: 'POST',
      body: JSON.stringify(feedbackData)
    });
  },
  
  // 更新反馈信息
  updateFeedback: (feedbackId, feedbackData) => {
    return apiRequest(`/feedbacks/${feedbackId}`, {
      method: 'PUT',
      body: JSON.stringify(feedbackData)
    });
  },
  
  // 删除反馈
  deleteFeedback: (feedbackId) => {
    return apiRequest(`/feedbacks/${feedbackId}`, { method: 'DELETE' });
  }
};

// 仪表板API
export const dashboardAPI = {
  // 获取统计数据
  getStats: () => {
    return apiRequest('/dashboard/stats');
  }
}; 