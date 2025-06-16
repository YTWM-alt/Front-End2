import React, { useState, useEffect, useCallback } from 'react';
import { SEARCH_PLACEHOLDERS } from '../../utils/constants';
import { saveQuestionToFile } from '../../utils/api';
import FilterBar from './FilterBar';

/**
 * 搜索框组件
 * 提供文本输入、语音搜索和AI生成按钮
 */
const SearchBox = ({ onSearch, initialValue = '', onQuestionSaved }) => {
  const [searchValue, setSearchValue] = useState(initialValue);
  const [placeholder, setPlaceholder] = useState(SEARCH_PLACEHOLDERS[0]);
  const [lastSavedValue, setLastSavedValue] = useState('');
  const [filterConditions, setFilterConditions] = useState({
    grade: '',
    gradeLabel: '',
    subject: '',
    subjectLabel: ''
  });

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
   * 自动保存问题到数据库，包含筛选信息
   * @param {string} question - 用户输入的问题
   * @param {Object} customFilters - 自定义筛选信息（可选）
   */
  const autoSaveQuestion = useCallback(async (question, customFilters = null) => {
    if (!question || question.trim() === '' || question.trim() === lastSavedValue) {
      return;
    }

    try {
      // 使用传入的筛选信息或当前的筛选条件
      const filtersToSave = customFilters || filterConditions;
      
      // 只有在有筛选条件时才传递筛选信息
      const hasFilters = filtersToSave && (filtersToSave.grade || filtersToSave.subject);
      
      const result = await saveQuestionToFile(
        question.trim(), 
        hasFilters ? filtersToSave : null
      );
      
      if (result.success) {
        setLastSavedValue(question.trim());
        
        // 构建日志信息
        let logMessage = `✅ 内容已保存到数据库: ${result.fileName}`;
        if (result.filters && (result.filters.grade_label || result.filters.subject_label)) {
          const filterInfo = [
            result.filters.grade_label,
            result.filters.subject_label
          ].filter(Boolean).join('-');
          logMessage += ` (筛选: ${filterInfo})`;
        }
        
        console.log(logMessage);
        
        // 触发父组件回调（如果有）
        if (onQuestionSaved) {
          onQuestionSaved(result);
        }
      } else {
        console.error('❌ 自动保存失败:', result.message);
      }
    } catch (error) {
      console.error('❌ 自动保存异常:', error);
    }
  }, [lastSavedValue, filterConditions, onQuestionSaved]);

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
   * 处理筛选条件变化
   */
  const handleFilterChange = (filters) => {
    setFilterConditions(filters);
  };

  /**
   * 处理搜索提交
   */
  const handleSearch = async () => {
    if (searchValue.trim()) {
      const question = searchValue.trim();
      
      // 构建完整的搜索查询（包含筛选条件）
      const searchQuery = {
        question: question,
        filters: filterConditions
      };
      
      // 触发搜索
      onSearch(searchQuery);
      
      // 确保保存，并传递当前的筛选条件
      await autoSaveQuestion(question, filterConditions);
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
      
      {/* 筛选栏 */}
      <FilterBar onFilterChange={handleFilterChange} />
    </div>
  );
};

export default SearchBox; 