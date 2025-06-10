import React from 'react';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import { MESSAGE_TYPES } from '../../utils/constants';

/**
 * AI助手聊天组件
 * 整合聊天历史和输入功能
 */
const AIAssistant = ({ chatHook, authHook, videoTitle }) => {
  const { 
    messages, 
    currentInput, 
    isSending, 
    isAITyping, 
    chatHistoryRef,
    sendMessage,
    handleInputChange,
    handleKeyPress,
    formatTimestamp
  } = chatHook;

  return (
    <>
      {/* AI助手头部 */}
      <div className="chat-header">
        <i className="fas fa-robot"></i>
        <h3>AI学习助手</h3>
      </div>
      
      {/* 聊天历史区域 */}
      <ChatHistory
        messages={messages}
        chatHistoryRef={chatHistoryRef}
        formatTimestamp={formatTimestamp}
        isAITyping={isAITyping}
      />
      
      {/* 聊天输入区域 */}
      <ChatInput
        currentInput={currentInput}
        isSending={isSending}
        isAITyping={isAITyping}
        onInputChange={handleInputChange}
        onKeyPress={handleKeyPress}
        onSendMessage={() => sendMessage(currentInput)}
        authHook={authHook}
      />
    </>
  );
};

export default AIAssistant; 