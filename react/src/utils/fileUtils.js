/**
 * 前端文件工具类
 * 提供下载和保存功能
 */

/**
 * 生成文件名：格式为 YYYY-MM-DD_HH-MM-SS.txt
 * @returns {string} 文件名
 */
const generateFileName = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}.txt`;
};

/**
 * 创建文件内容
 * @param {string} question - 用户提问
 * @returns {string} 文件内容
 */
const createFileContent = (question) => {
  const now = new Date();
  return `提问时间: ${now.toLocaleString('zh-CN')}
提问内容: ${question}

---
此文件由智映教匠AI平台自动生成
文件保存时间: ${now.toISOString()}
`;
};

/**
 * 下载文本文件到用户设备
 * @param {string} question - 用户提问内容
 * @returns {Object} 下载结果
 */
export const downloadQuestionFile = (question) => {
  try {
    if (!question || question.trim() === '') {
      return {
        success: false,
        message: '问题内容不能为空'
      };
    }

    const fileName = generateFileName();
    const content = createFileContent(question.trim());
    
    // 创建Blob对象
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 清理内存
    window.URL.revokeObjectURL(url);
    
    return {
      success: true,
      message: '问题已下载到本地',
      fileName: fileName
    };
    
  } catch (error) {
    console.error('下载文件失败:', error);
    return {
      success: false,
      message: '下载失败',
      error: error.message
    };
  }
};

/**
 * 保存问题到浏览器本地存储
 * @param {string} question - 用户提问内容
 * @returns {Object} 保存结果
 */
export const saveQuestionToLocalStorage = (question) => {
  try {
    if (!question || question.trim() === '') {
      return {
        success: false,
        message: '问题内容不能为空'
      };
    }

    const fileName = generateFileName();
    const questionData = {
      id: Date.now(),
      question: question.trim(),
      timestamp: new Date().toISOString(),
      fileName: fileName
    };

    // 获取现有问题列表
    const existingQuestions = JSON.parse(localStorage.getItem('saved_questions') || '[]');
    
    // 添加新问题
    existingQuestions.unshift(questionData);
    
    // 限制保存数量（最多保存100个）
    if (existingQuestions.length > 100) {
      existingQuestions.splice(100);
    }
    
    // 保存到本地存储
    localStorage.setItem('saved_questions', JSON.stringify(existingQuestions));
    
    return {
      success: true,
      message: '问题已保存到浏览器本地存储',
      fileName: fileName,
      id: questionData.id
    };
    
  } catch (error) {
    console.error('保存到本地存储失败:', error);
    return {
      success: false,
      message: '保存失败',
      error: error.message
    };
  }
};

/**
 * 获取本地存储的问题列表
 * @returns {Array} 问题列表
 */
export const getSavedQuestions = () => {
  try {
    const questions = JSON.parse(localStorage.getItem('saved_questions') || '[]');
    return questions;
  } catch (error) {
    console.error('获取本地问题列表失败:', error);
    return [];
  }
};

/**
 * 清空本地存储的问题
 * @returns {Object} 清空结果
 */
export const clearSavedQuestions = () => {
  try {
    localStorage.removeItem('saved_questions');
    return {
      success: true,
      message: '本地问题已清空'
    };
  } catch (error) {
    return {
      success: false,
      message: '清空失败',
      error: error.message
    };
  }
}; 