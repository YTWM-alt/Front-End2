import React from 'react';
import SearchBox from '../search/SearchBox';
import { APP_CONFIG } from '../../utils/constants';

/**
 * 主页面Hero区域组件
 * 包含主标题、描述和搜索框
 */
const HeroSection = ({ onSearch, searchTerm }) => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>
          <span>知识点</span> 皆成课
        </h1>
        <p className="hero-description">
          {APP_CONFIG.description}
        </p>
        
        {/* 搜索框组件 */}
        <SearchBox 
          onSearch={onSearch}
          initialValue={searchTerm}
        />
      </div>
    </section>
  );
};

export default HeroSection; 