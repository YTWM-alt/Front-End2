from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from datetime import datetime

class Question(BaseModel):
    """问题模型"""
    __tablename__ = 'questions'
    
    # 问题基本信息
    title = Column(String(200), nullable=False, comment='问题标题')
    content = Column(Text, nullable=False, comment='问题内容')
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, comment='提问用户ID')
    
    # 问题状态
    status = Column(String(20), default='pending', nullable=False, comment='问题状态：pending-待回答, answered-已回答, closed-已关闭')
    priority = Column(Integer, default=0, nullable=False, comment='优先级：0-普通, 1-重要, 2-紧急')
    
    # 问题统计
    view_count = Column(Integer, default=0, nullable=False, comment='浏览次数')
    answer_count = Column(Integer, default=0, nullable=False, comment='回答数量')
    
    # 分类和筛选信息
    category = Column(String(100), nullable=True, comment='问题分类')
    grade_level = Column(String(50), nullable=True, comment='年级筛选: primary/junior/senior/university')
    subject = Column(String(50), nullable=True, comment='学科筛选: 语文/数学/英语等')
    filter_tags = Column(JSON, nullable=True, comment='完整的筛选信息JSON')
    
    # 关联关系
    user = relationship('User', back_populates='questions')
    answers = relationship('Answer', back_populates='question', lazy='dynamic')
    
    def __init__(self, title, content, user_id, **kwargs):
        """初始化问题"""
        super().__init__(**kwargs)
        self.title = title
        self.content = content
        self.user_id = user_id
        
        # 处理筛选信息
        self.category = kwargs.get('category')
        self.grade_level = kwargs.get('grade_level')
        self.subject = kwargs.get('subject')
        self.filter_tags = kwargs.get('filter_tags')
    
    def increment_view_count(self):
        """增加浏览次数"""
        self.view_count += 1
    
    def increment_answer_count(self):
        """增加回答数量"""
        self.answer_count += 1
    
    def close(self):
        """关闭问题"""
        self.status = 'closed'
    
    def reopen(self):
        """重新打开问题"""
        self.status = 'pending'
    
    def mark_as_answered(self):
        """标记为已回答"""
        self.status = 'answered'
    
    def update_filter_info(self, grade_level=None, subject=None, filter_tags=None):
        """更新筛选信息"""
        if grade_level is not None:
            self.grade_level = grade_level
        if subject is not None:
            self.subject = subject
        if filter_tags is not None:
            self.filter_tags = filter_tags
    
    def to_dict(self):
        """转换为字典，包含用户信息"""
        data = super().to_dict()
        if self.user:
            data['user'] = self.user.to_dict()
        
        # 包含筛选信息
        data.update({
            'category': self.category,
            'grade_level': self.grade_level,
            'subject': self.subject,
            'filter_tags': self.filter_tags
        })
        return data 