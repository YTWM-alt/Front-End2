import React from 'react';
import { MESSAGE_TYPES } from '../../utils/constants';

/**
 * 聊天历史组件
 * 显示聊天消息列表
 */
const ChatHistory = ({ messages, chatHistoryRef, formatTimestamp, isAITyping }) => {
  
  /**
   * 渲染单条消息
   */
  const renderMessage = (message) => {
    const isUser = message.type === MESSAGE_TYPES.USER;
    
    return (
      <div
        key={message.id}
        className={`chat-message ${isUser ? 'user-message' : 'ai-message'}`}
      >
        <div className="message-header">
          {isUser ? '你' : 'AI助手'}
        </div>
        <div>
          {message.content}
          {message.isTyping && (
            <span className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </span>
          )}
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: 'var(--gray)', 
          marginTop: '5px',
          opacity: 0.7
        }}>
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    );
  };

  return (
    <div className="chat-history" ref={chatHistoryRef}>
      {messages.map(renderMessage)}
      
      {/* AI正在输入提示 */}
      {isAITyping && (
        <div className="chat-message ai-message">
          <div className="message-header">AI助手</div>
          <div>
            <span className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </span>
            正在思考中...
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistory; 