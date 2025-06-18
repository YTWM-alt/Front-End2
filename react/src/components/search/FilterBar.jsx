import React, { useState, useRef } from 'react';

/**
 * 筛选栏组件
 * 提供年级和学科筛选功能
 */
const FilterBar = ({ onFilterChange }) => {
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [hoveredGrade, setHoveredGrade] = useState('');
  const hideTimeoutRef = useRef(null);

  // 年级选项配置
  const gradeOptions = [
    {
      key: 'primary',
      label: '小学',
      subjects: ['语文', '数学', '英语']
    },
    {
      key: 'junior',
      label: '初中',
      subjects: ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理']
    },
    {
      key: 'senior',
      label: '高中',
      subjects: ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理']
    },
    {
      key: 'university',
      label: '大学',
      subjects: ['哲学', '经济学', '法学', '教育学', '文学', '历史学', '理学', '工学', '农学', '医学', '管理学', '艺术学']
    }
  ];

  /**
   * 处理年级选择
   */
  const handleGradeSelect = (gradeKey, gradeLabel) => {
    setSelectedGrade(gradeKey);
    setSelectedSubject(''); // 重置学科选择
    
    // 通知父组件筛选条件变化
    onFilterChange({
      grade: gradeKey,
      gradeLabel: gradeLabel,
      subject: '',
      subjectLabel: ''
    });
  };

  /**
   * 处理学科选择
   */
  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    
    // 通知父组件筛选条件变化
    const gradeOption = gradeOptions.find(g => g.key === selectedGrade);
    onFilterChange({
      grade: selectedGrade,
      gradeLabel: gradeOption ? gradeOption.label : '',
      subject: subject,
      subjectLabel: subject
    });
  };

  /**
   * 处理鼠标进入年级按钮
   */
  const handleGradeMouseEnter = (gradeKey) => {
    // 清除隐藏定时器
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setHoveredGrade(gradeKey);
  };

  /**
   * 处理鼠标离开年级区域
   */
  const handleGradeMouseLeave = () => {
    // 设置延时隐藏，给用户时间移动到二级菜单
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredGrade('');
    }, 150); // 150ms延时
  };

  /**
   * 处理鼠标进入二级菜单
   */
  const handleDropdownMouseEnter = () => {
    // 清除隐藏定时器
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  /**
   * 处理鼠标离开二级菜单
   */
  const handleDropdownMouseLeave = () => {
    setHoveredGrade('');
  };

  /**
   * 清除筛选条件
   */
  const clearFilters = () => {
    setSelectedGrade('');
    setSelectedSubject('');
    setHoveredGrade('');
    
    onFilterChange({
      grade: '',
      gradeLabel: '',
      subject: '',
      subjectLabel: ''
    });
  };

  return (
    <div className="filter-bar">
      <div className="filter-section">
        <span className="filter-label">筛选：</span>
        
        <div className="filter-options">
          {gradeOptions.map((grade) => (
            <div 
              key={grade.key}
              className="filter-item"
              onMouseEnter={() => handleGradeMouseEnter(grade.key)}
              onMouseLeave={handleGradeMouseLeave}
            >
              <button
                className={`grade-btn ${selectedGrade === grade.key ? 'active' : ''}`}
                onClick={() => handleGradeSelect(grade.key, grade.label)}
              >
                {grade.label}
              </button>
              
              {/* 二级筛选菜单 */}
              {hoveredGrade === grade.key && (
                <div 
                  className="subject-dropdown"
                  onMouseEnter={handleDropdownMouseEnter}
                  onMouseLeave={handleDropdownMouseLeave}
                >
                  <div className="subject-grid">
                    {grade.subjects.map((subject) => (
                      <button
                        key={subject}
                        className={`subject-btn ${selectedSubject === subject ? 'active' : ''}`}
                        onClick={() => handleSubjectSelect(subject)}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* 清除筛选按钮 */}
          {(selectedGrade || selectedSubject) && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              <i className="fas fa-times"></i>
              清除筛选
            </button>
          )}
        </div>
      </div>
      
      {/* 当前筛选状态显示 */}
      {(selectedGrade || selectedSubject) && (
        <div className="current-filters">
          <span className="filter-info">
            当前筛选：
            {selectedGrade && (
              <span className="filter-tag">
                {gradeOptions.find(g => g.key === selectedGrade)?.label}
              </span>
            )}
            {selectedSubject && (
              <span className="filter-tag">
                {selectedSubject}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
};

export default FilterBar; 