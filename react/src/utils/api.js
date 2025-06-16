// API配置
const API_BASE_URL = 'http://localhost:3003/api';

/**
 * 发送HTTP请求的通用函数
 * @param {string} url - 请求URL
 * @param {Object} options - 请求选项
 * @returns {Promise} 请求结果
 */
const fetchAPI = async (url, options = {}) => {
  try {
    // 获取认证token
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // 如果有token，添加到认证头
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers,
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP错误: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
};

/**
 * 保存用户问题到数据库，支持筛选信息
 * @param {string} question - 用户提问内容
 * @param {Object} filters - 筛选信息（可选）
 * @returns {Promise<Object>} 保存结果
 */
export const saveQuestionToFile = async (question, filters = null) => {
  try {
    const requestBody = { question };
    
    // 如果有筛选信息，添加到请求体
    if (filters) {
      requestBody.filters = filters;
    }
    
    const result = await fetchAPI('/questions/save-question', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    return {
      success: true,
      message: result.message,
      fileName: result.fileName || result.filename, // 兼容两种格式
      timestamp: result.timestamp,
      questionId: result.question_id,
      filters: result.filters
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '保存问题失败',
      error: error
    };
  }
};

/**
 * 获取所有保存的问题列表
 * @param {Object} filters - 筛选条件（可选）
 * @returns {Promise<Object>} 问题列表
 */
export const getQuestionList = async (filters = {}) => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    
    if (filters.status) {
      queryParams.append('status', filters.status);
    }
    if (filters.grade_level) {
      queryParams.append('grade_level', filters.grade_level);
    }
    if (filters.subject) {
      queryParams.append('subject', filters.subject);
    }
    if (filters.page) {
      queryParams.append('page', filters.page);
    }
    if (filters.per_page) {
      queryParams.append('per_page', filters.per_page);
    }
    
    const url = `/questions/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const result = await fetchAPI(url);
    
    return {
      success: true,
      questions: result.questions || [],
      filterStats: result.filter_stats || {},
      pagination: result.pagination || {},
      total: result.pagination?.total || 0
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '获取问题列表失败',
      questions: [],
      filterStats: {},
      pagination: {},
      total: 0
    };
  }
};

/**
 * 检查后端服务健康状态
 * @returns {Promise<Object>} 健康检查结果
 */
export const checkServerHealth = async () => {
  try {
    const result = await fetchAPI('/health');
    return {
      success: true,
      status: result.status,
      message: result.message,
      timestamp: result.timestamp
    };
  } catch (error) {
    return {
      success: false,
      message: '无法连接到后端服务',
      error: error.message
    };
  }
};

/**
 * 处理AI生成的视频 - 从AI_product文件夹转移到video文件夹
 * @returns {Promise<Object>} 处理结果
 */
export const processAIVideo = async () => {
  try {
    const result = await fetchAPI('/videos/process-ai-video', {
      method: 'POST',
    });

    return {
      success: true,
      message: result.message,
      originalFileName: result.originalFileName,
      newFileName: result.newFileName,
      videoUrl: result.videoUrl,
      timestamp: result.timestamp
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '处理AI视频失败',
      error: error
    };
  }
};

/**
 * 获取待处理的AI回答
 * @param {string} since - 获取指定时间之后的回答（可选）
 * @returns {Promise<Object>} AI回答列表
 */
export const getPendingAnswers = async (since = null) => {
  try {
    const url = since ? `/ai/pending-answers?since=${encodeURIComponent(since)}` : '/ai/pending-answers';
    const result = await fetchAPI(url);

    return {
      success: true,
      answers: result.answers || [],
      total: result.total || 0,
      timestamp: result.timestamp
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '获取AI回答失败',
      answers: [],
      total: 0,
      error: error
    };
  }
};

/**
 * 删除视频文件
 * @param {string} filename - 要删除的视频文件名
 * @returns {Promise<Object>} 删除结果
 */
export const deleteVideo = async (filename) => {
  try {
    const result = await fetchAPI(`/videos/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });

    return {
      success: true,
      message: result.message,
      filename: result.filename,
      timestamp: result.timestamp
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '删除视频失败',
      error: error
    };
  }
};

/**
 * 提交用户反馈
 * @param {Object} feedbackData - 反馈数据
 * @returns {Promise<Object>} 提交结果
 */
export const submitFeedback = async (feedbackData) => {
  try {
    const result = await fetchAPI('/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feedbackData)
    });

    return {
      success: true,
      message: result.message || '反馈提交成功',
      feedbackId: result.feedbackId,
      timestamp: result.timestamp
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '提交反馈失败',
      error: error
    };
  }
};

/**
 * 获取反馈列表（管理员功能）
 * @param {Object} filters - 筛选条件
 * @returns {Promise<Object>} 反馈列表
 */
export const getFeedbackList = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.priority) queryParams.append('priority', filters.priority);
    if (filters.limit) queryParams.append('limit', filters.limit);

    const url = queryParams.toString() ? `/feedback?${queryParams.toString()}` : '/feedback';
    const result = await fetchAPI(url);

    return {
      success: true,
      feedbacks: result.feedbacks || [],
      total: result.total || 0,
      filters: result.filters || {}
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '获取反馈列表失败',
      feedbacks: [],
      total: 0,
      error: error
    };
  }
};

/**
 * 保存用户输入内容到database/requestion文件夹
 * @param {string} content - 用户输入内容
 * @returns {Promise<Object>} 保存结果
 */
export const saveToRequestion = async (content) => {
  try {
    const result = await fetchAPI('/save-to-requestion', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });

    return {
      success: true,
      message: result.message,
      fileName: result.fileName,
      timestamp: result.timestamp
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '保存到requestion失败',
      error: error
    };
  }
};

/**
 * 获取视频列表
 * @returns {Promise<Object>} 视频列表数据
 */
export const getVideos = async () => {
  try {
    const result = await fetchAPI('/videos/');
    
    console.log('📊 获取视频列表响应:', result);
    
    if (result.success && result.videos) {
      // 处理视频数据
      const processedVideos = result.videos.map(video => ({
        id: video.id.toString(),
        filename: video.filename || (video.file_path ? video.file_path.split('/').pop() : '未知'),
        title: video.title || '未命名视频',
        size: video.file_size,
        sizeFormatted: video.file_size_mb ? `${video.file_size_mb} MB` : '未知',
        duration: video.duration || 0,
        durationFormatted: video.duration_formatted || '0:00',
        createdTime: video.upload_time ? new Date(video.upload_time) : new Date(),
        modifiedTime: video.upload_time ? new Date(video.upload_time) : new Date(),
        url: `/videos/${video.filename || (video.file_path ? video.file_path.split('/').pop() : 'unknown')}`,
        extension: video.format ? `.${video.format}` : '.mp4',
        // 分类信息
        sizeCategory: getSizeCategory(video.file_size),
        durationCategory: getDurationCategory(video.duration || 0)
      }));
      
      return {
        success: true,
        videos: processedVideos,
        count: processedVideos.length
      };
    }
    
    throw new Error(result.message || '获取视频列表失败');
  } catch (error) {
    console.error('❌ 获取视频列表失败:', error);
    return {
      success: false,
      message: error.message || '获取视频列表失败',
      videos: [],
      count: 0
    };
  }
};

/**
 * 根据文件大小获取分类
 */
function getSizeCategory(fileSize) {
  const sizeMB = fileSize / (1024 * 1024);
  
  if (sizeMB < 50) return 'small';
  if (sizeMB < 200) return 'medium';
  if (sizeMB < 500) return 'large';
  return 'extra-large';
}

/**
 * 根据时长获取分类
 */
function getDurationCategory(duration) {
  if (duration < 300) return 'short'; // 5分钟以内
  if (duration < 1800) return 'medium'; // 5-30分钟
  if (duration < 3600) return 'long'; // 30-60分钟
  return 'extra-long'; // 60分钟以上
}
 