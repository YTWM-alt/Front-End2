import React, { useState, useEffect, useCallback } from 'react';
import { SEARCH_PLACEHOLDERS } from '../../utils/constants';
import { saveQuestionToFile } from '../../utils/api';

/**
 * 搜索框组件
 * 提供文本输入、语音搜索和AI生成按钮
 */
const SearchBox = ({ onSearch, initialValue = '', onQuestionSaved }) => {
  const [searchValue, setSearchValue] = useState(initialValue);
  const [placeholder, setPlaceholder] = useState(SEARCH_PLACEHOLDERS[0]);
  const [lastSavedValue, setLastSavedValue] = useState('');

  // 动态更换占位符文本
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder(current => {
        const currentIndex = SEARCH_PLACEHOLDERS.indexOf(current);
        const nextIndex = (currentIndex + 1) % SEARCH_PLACEHOLDERS.length;
        return SEARCH_PLACEHOLDERS[nextIndex];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // 同步外部传入的初始值
  useEffect(() => {
    setSearchValue(initialValue);
  }, [initialValue]);

  /**
   * 自动保存问题到question文件夹
   * @param {string} question - 用户输入的问题
   */
  const autoSaveQuestion = useCallback(async (question) => {
    if (!question || question.trim() === '' || question.trim() === lastSavedValue) {
      return;
    }

    try {
      const result = await saveQuestionToFile(question.trim());
      
      if (result.success) {
        setLastSavedValue(question.trim());
        console.log('✅ 内容已自动保存到question文件夹:', result.fileName);
      } else {
        console.error('❌ 自动保存失败:', result.message);
      }
    } catch (error) {
      console.error('❌ 自动保存异常:', error);
    }
  }, [lastSavedValue]);

  /**
   * 处理输入变化 - 实时保存用户输入的内容
   */
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // 实时保存（防抖处理）
    if (value.trim()) {
      // 清除之前的定时器
      if (window.saveTimer) {
        clearTimeout(window.saveTimer);
      }
      
      // 设置新的定时器，1秒后保存
      window.saveTimer = setTimeout(() => {
        autoSaveQuestion(value.trim());
      }, 1000);
    }
  };

  /**
   * 处理输入框失去焦点 - 自动保存
   */
  const handleInputBlur = () => {
    if (searchValue.trim()) {
      autoSaveQuestion(searchValue.trim());
    }
  };

  /**
   * 处理搜索提交
   */
  const handleSearch = async () => {
    if (searchValue.trim()) {
      const question = searchValue.trim();
      
      // 触发搜索
      onSearch(question);
      
      // 确保保存
      await autoSaveQuestion(question);
    }
  };

  /**
   * 处理回车键搜索
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  /**
   * 处理语音搜索点击
   */
  const handleVoiceSearch = () => {
    // TODO: 实现语音识别功能
    console.log('语音搜索功能待开发');
  };

  return (
    <div className="search-container">
      <div className="search-box">
        <input
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
        />
        
        {/* 语音搜索按钮 */}
        <button 
          className="voice-search"
          onClick={handleVoiceSearch}
          title="语音搜索"
        >
          <i className="fas fa-microphone"></i>
        </button>
        
        {/* AI生成按钮 */}
        <button 
          className="search-btn"
          onClick={handleSearch}
        >
          AI生成视频
        </button>
      </div>
    </div>
  );
};

export default SearchBox; 