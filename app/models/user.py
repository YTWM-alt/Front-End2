from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from datetime import datetime

class User(BaseModel):
    """用户模型"""
    __tablename__ = 'users'
    
    # 用户基本信息
    username = Column(String(50), nullable=False, unique=True, comment='用户名')
    email = Column(String(100), nullable=False, unique=True, comment='邮箱')
    password_hash = Column(String(128), nullable=False, comment='密码哈希')
    avatar_url = Column(String(200), nullable=True, comment='头像URL')
    
    # 用户状态信息
    is_active = Column(Boolean, default=True, nullable=False, comment='是否激活')
    last_login = Column(DateTime, nullable=True, comment='最后登录时间')
    login_count = Column(Integer, default=0, nullable=False, comment='登录次数')
    
    # 用户详细信息
    nickname = Column(String(50), nullable=True, comment='昵称')
    bio = Column(Text, nullable=True, comment='个人简介')
    phone = Column(String(20), nullable=True, comment='手机号')
    
    # 关联关系
    questions = relationship('Question', back_populates='user', lazy='dynamic')
    answers = relationship('Answer', back_populates='user', lazy='dynamic')  
    feedbacks = relationship('Feedback', foreign_keys='Feedback.user_id', back_populates='user', lazy='dynamic')
    videos = relationship('Video', back_populates='user', lazy='dynamic')
    
    def __init__(self, username, email, password_hash, **kwargs):
        """初始化用户"""
        super().__init__(**kwargs)
        self.username = username
        self.email = email
        self.password_hash = password_hash
    
    def update_login(self):
        """更新登录信息"""
        self.last_login = datetime.now()
        self.login_count += 1
    
    def to_dict(self):
        """转换为字典，排除敏感信息"""
        data = super().to_dict()
        data.pop('password_hash', None)
        return data 