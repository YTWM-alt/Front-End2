from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from datetime import datetime

class Answer(BaseModel):
    """答案模型"""
    __tablename__ = 'answers'
    
    # 基础信息
    content = Column(Text, nullable=False, comment='回答内容')
    type = Column(String(20), default='text', comment='回答类型：text, voice, image等')
    source = Column(String(50), nullable=True, comment='回答来源')
    
    # 关联信息
    question_id = Column(Integer, ForeignKey('questions.id'), nullable=True, comment='问题ID')
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, comment='回答用户ID')
    
    # 关联关系
    question = relationship('Question', back_populates='answers')
    user = relationship('User', back_populates='answers')
    
    # 状态信息
    is_correct = Column(Boolean, default=None, nullable=True, comment='是否正确')
    score = Column(Integer, default=0, comment='评分（0-100）')
    feedback = Column(Text, nullable=True, comment='反馈信息')
    
    def __init__(self, content, question_id=None, user_id=None, **kwargs):
        """初始化答案"""
        super().__init__(**kwargs)
        self.content = content
        self.question_id = question_id
        self.user_id = user_id
    
    def rate(self, score, feedback=None):
        """评价答案"""
        self.score = score
        self.is_correct = score >= 60  # 60分及以上视为正确
        self.feedback = feedback
    
    def accept(self):
        """采纳回答"""
        self.is_accepted = True
    
    def unaccept(self):
        """取消采纳"""
        self.is_accepted = False
    
    def increment_like(self):
        """增加点赞数"""
        self.like_count += 1
    
    def increment_dislike(self):
        """增加点踩数"""
        self.dislike_count += 1
    
    def to_dict(self):
        """转换为字典，包含用户信息"""
        data = super().to_dict()
        if self.user:
            data['user'] = self.user.to_dict()
        return data 