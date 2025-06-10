import React, { useState, useCallback } from 'react';
import { saveToRequestion } from '../../utils/api';

/**
 * 聊天输入组件
 * 提供用户输入消息的界面
 */
const ChatInput = ({ 
  currentInput, 
  isSending, 
  isAITyping, 
  onInputChange, 
  onKeyPress, 
  onSendMessage,
  authHook 
}) => {
  const [lastSavedValue, setLastSavedValue] = useState('');
  
  /**
   * 自动保存内容到database/requestion文件夹
   * @param {string} content - 用户输入的内容
   */
  const autoSaveContent = useCallback(async (content) => {
    if (!content || content.trim() === '' || content.trim() === lastSavedValue) {
      return;
    }

    try {
      const result = await saveToRequestion(content.trim());
      
      if (result.success) {
        setLastSavedValue(content.trim());
        console.log('✅ 内容已自动保存到database/requestion:', result.fileName);
      } else {
        console.error('❌ 自动保存失败:', result.message);
      }
    } catch (error) {
      console.error('❌ 自动保存异常:', error);
    }
  }, [lastSavedValue]);

  /**
   * 处理发送按钮点击
   */
  const handleSendClick = async () => {
    if (currentInput.trim() && !isSending && !isAITyping) {
      // 确保在发送前保存内容
      await autoSaveContent(currentInput.trim());
      onSendMessage();
    }
  };

  /**
   * 处理输入变化 - 实时保存用户输入的内容
   */
  const handleInputChange = (e) => {
    const value = e.target.value;
    onInputChange(value);
    
    // 实时保存（防抖处理）
    if (value.trim()) {
      // 清除之前的定时器
      if (window.chatSaveTimer) {
        clearTimeout(window.chatSaveTimer);
      }
      
      // 设置新的定时器，1秒后保存
      window.chatSaveTimer = setTimeout(() => {
        autoSaveContent(value.trim());
      }, 1000);
    }
  };

  /**
   * 处理输入框失去焦点 - 自动保存
   */
  const handleInputBlur = () => {
    if (currentInput.trim()) {
      autoSaveContent(currentInput.trim());
    }
  };

  /**
   * 检查是否可以发送
   */
  const canSend = currentInput.trim() && !isSending && !isAITyping;

  return (
    <div className="chat-input-container">
      <textarea
        className="chat-input"
        value={currentInput}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyPress={onKeyPress}
        placeholder="输入您的问题，例如：三角形的内角和为什么是180度？"
        disabled={isSending || isAITyping}
      />
      
      <button
        className="send-btn"
        onClick={handleSendClick}
        disabled={!canSend}
        title={isSending ? '发送中...' : isAITyping ? 'AI回复中...' : '发送消息'}
      >
        {isSending || isAITyping ? (
          <i className="fas fa-spinner fa-spin"></i>
        ) : (
          <i className="fas fa-paper-plane"></i>
        )}
      </button>
    </div>
  );
};

export default ChatInput; 