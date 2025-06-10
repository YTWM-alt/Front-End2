import { useState, useCallback, useRef, useEffect } from 'react';
import { MESSAGE_TYPES, STORAGE_KEYS } from '../utils/constants';
import { getPendingAnswers } from '../utils/api';

/**
 * 聊天功能管理Hook
 * 提供AI助手对话功能
 */
export const useChat = () => {
  // 聊天消息列表
  const [messages, setMessages] = useState([]);
  // 当前输入内容
  const [currentInput, setCurrentInput] = useState('');
  // 是否正在发送消息
  const [isSending, setIsSending] = useState(false);
  // AI是否正在回复
  const [isAITyping, setIsAITyping] = useState(false);
  
  // 聊天历史引用，用于滚动到底部
  const chatHistoryRef = useRef(null);
  
  // 轮询相关状态
  const [lastCheckTime, setLastCheckTime] = useState(new Date().toISOString());
  const pollingIntervalRef = useRef(null);

  // 初始化聊天，添加AI的欢迎消息
  useEffect(() => {
    const initializeChat = () => {
      // 尝试从本地存储恢复聊天历史
      try {
        const storedHistory = localStorage.getItem(STORAGE_KEYS.chatHistory);
        if (storedHistory) {
          const parsedHistory = JSON.parse(storedHistory);
          setMessages(parsedHistory);
        } else {
          // 如果没有历史记录，添加默认欢迎消息
          const welcomeMessage = {
            id: generateMessageId(),
            type: MESSAGE_TYPES.AI,
            content: '您好！我是AI学习助手，您有任何关于本视频或数学的问题都可以随时提问。',
            timestamp: new Date().toISOString(),
            isWelcome: true
          };
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        console.error('初始化聊天历史失败:', error);
        // 如果恢复失败，使用默认欢迎消息
        const welcomeMessage = {
          id: generateMessageId(),
          type: MESSAGE_TYPES.AI,
          content: '您好！我是AI学习助手，您有任何关于本视频或数学的问题都可以随时提问。',
          timestamp: new Date().toISOString(),
          isWelcome: true
        };
        setMessages([welcomeMessage]);
      }
    };

    initializeChat();
    
    // 启动轮询获取AI回答
    startAnswerPolling();
    
    // 清理函数
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // 当消息更新时，自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 保存聊天历史到本地存储
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEYS.chatHistory, JSON.stringify(messages));
      } catch (error) {
        console.error('保存聊天历史失败:', error);
      }
    }
  }, [messages]);

  /**
   * 生成唯一的消息ID
   * @returns {string} 消息ID
   */
  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * 启动轮询获取AI回答
   */
  const startAnswerPolling = useCallback(() => {
    console.log('🔄 启动AI回答轮询...');
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const result = await getPendingAnswers(lastCheckTime);
        
        if (result.success && result.answers.length > 0) {
          console.log(`📨 收到 ${result.answers.length} 个新的AI回答`);
          
          // 逐个添加AI回答消息
          result.answers.forEach(answer => {
            const aiMessage = {
              id: generateMessageId(),
              type: MESSAGE_TYPES.AI,
              content: answer.content,
              timestamp: answer.timestamp,
              filename: answer.filename,
              isFromFile: true // 标记这是来自文件的消息
            };
            
            setMessages(prev => [...prev, aiMessage]);
            console.log(`💬 添加AI回答: ${answer.filename} - ${answer.content.substring(0, 50)}...`);
          });
          
          // 更新最后检查时间
          setLastCheckTime(result.timestamp);
        }
        
      } catch (error) {
        console.error('❌ 轮询AI回答失败:', error);
      }
    }, 2000); // 每2秒检查一次
    
  }, [lastCheckTime]);

  /**
   * 停止轮询
   */
  const stopAnswerPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log('⏹️ 停止AI回答轮询');
    }
  }, []);

  /**
   * 滚动聊天记录到底部
   */
  const scrollToBottom = useCallback(() => {
    if (chatHistoryRef.current) {
      setTimeout(() => {
        chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
      }, 100);
    }
  }, []);

  /**
   * 添加新消息到聊天记录
   * @param {string} content - 消息内容
   * @param {string} type - 消息类型
   * @param {Object} options - 可选参数
   */
  const addMessage = useCallback((content, type, options = {}) => {
    const newMessage = {
      id: generateMessageId(),
      type,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      ...options
    };

    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);



  /**
   * 发送用户消息
   * @param {string} content - 消息内容
   */
  const sendMessage = useCallback(async (content) => {
    if (!content || content.trim() === '' || isSending || isAITyping) {
      return;
    }

    setIsSending(true);

    try {
      // 添加用户消息
      addMessage(content, MESSAGE_TYPES.USER);
      
      // 清空输入框
      setCurrentInput('');
      
      console.log('📤 用户消息已发送，等待AI回答:', content);
      
      // 不再生成固定的AI回复，等待answer文件夹中的真实回答
      // AI回答将通过轮询机制自动获取并显示
      
    } catch (error) {
      console.error('发送消息失败:', error);
      
      // 添加错误提示消息
      addMessage(
        '抱歉，发送消息时出现了问题，请稍后重试。', 
        MESSAGE_TYPES.AI,
        { isError: true }
      );
    } finally {
      setIsSending(false);
    }
  }, [isSending, isAITyping, addMessage]);

  /**
   * 处理输入变化
   * @param {string} value - 输入值
   */
  const handleInputChange = useCallback((value) => {
    setCurrentInput(value);
  }, []);

  /**
   * 处理回车发送
   * @param {KeyboardEvent} event - 键盘事件
   */
  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage(currentInput);
    }
  }, [currentInput, sendMessage]);

  /**
   * 清空聊天历史
   */
  const clearChatHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEYS.chatHistory);
    
    // 重新添加欢迎消息
    const welcomeMessage = {
      id: generateMessageId(),
      type: MESSAGE_TYPES.AI,
      content: '聊天记录已清空。您好！我是AI学习助手，有什么可以帮助您的吗？',
      timestamp: new Date().toISOString(),
      isWelcome: true
    };
    setMessages([welcomeMessage]);
  }, []);

  /**
   * 重发消息（用于失败的消息）
   * @param {string} messageId - 消息ID
   */
  const resendMessage = useCallback((messageId) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message && message.type === MESSAGE_TYPES.USER) {
      sendMessage(message.content);
    }
  }, [messages, sendMessage]);

  /**
   * 格式化时间戳
   * @param {string} timestamp - ISO时间戳
   * @returns {string} 格式化的时间
   */
  const formatTimestamp = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // 如果是今天，只显示时间
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // 否则显示日期和时间
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);

  // 返回Hook提供的方法和状态
  return {
    // 聊天状态
    messages,
    currentInput,
    isSending,
    isAITyping,
    chatHistoryRef,
    
    // 聊天操作方法
    sendMessage,
    handleInputChange,
    handleKeyPress,
    clearChatHistory,
    resendMessage,
    
    // AI回答轮询方法
    startAnswerPolling,
    stopAnswerPolling,
    
    // 工具方法
    formatTimestamp,
    scrollToBottom
  };
}; 