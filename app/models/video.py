from sqlalchemy import Column, String, Text, Integer, ForeignKey, Float, JSON, DateTime
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from datetime import datetime

class Video(BaseModel):
    """视频模型"""
    __tablename__ = 'videos'
    
    # 视频基本信息
    title = Column(String(200), nullable=False, comment='视频标题')
    description = Column(Text, nullable=True, comment='视频描述')
    file_path = Column(String(500), nullable=False, comment='视频文件路径')
    file_size = Column(Integer, nullable=False, comment='文件大小(字节)')
    duration = Column(Float, nullable=True, comment='视频时长(秒)')
    format = Column(String(20), nullable=False, comment='视频格式')
    
    # 视频元数据
    video_metadata = Column(JSON, nullable=True, comment='视频元数据')
    thumbnail_path = Column(String(500), nullable=True, comment='缩略图路径')
    
    # 上传信息
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, comment='上传用户ID')
    upload_ip = Column(String(50), nullable=True, comment='上传IP')
    upload_time = Column(DateTime, default=datetime.now, nullable=False, comment='上传时间')
    
    # 视频状态
    status = Column(String(20), default='processing', nullable=False, comment='视频状态：processing-处理中, ready-就绪, error-错误')
    error_message = Column(Text, nullable=True, comment='错误信息')
    
    # 视频统计
    view_count = Column(Integer, default=0, nullable=False, comment='播放次数')
    like_count = Column(Integer, default=0, nullable=False, comment='点赞数')
    comment_count = Column(Integer, default=0, nullable=False, comment='评论数')
    
    # 关联关系
    user = relationship('User', back_populates='videos')
    
    def __init__(self, title, file_path, file_size, format, user_id, **kwargs):
        """初始化视频"""
        super().__init__(**kwargs)
        self.title = title
        self.file_path = file_path
        self.file_size = file_size
        self.format = format
        self.user_id = user_id
    
    def set_ready(self):
        """设置视频为就绪状态"""
        self.status = 'ready'
        self.error_message = None
    
    def set_error(self, error_message):
        """设置视频为错误状态"""
        self.status = 'error'
        self.error_message = error_message
    
    def increment_view_count(self):
        """增加播放次数"""
        self.view_count += 1
    
    def increment_like_count(self):
        """增加点赞数"""
        self.like_count += 1
    
    def increment_comment_count(self):
        """增加评论数"""
        self.comment_count += 1
    
    def to_dict(self):
        """转换为字典，包含用户信息"""
        data = super().to_dict()
        if self.user:
            data['user'] = self.user.to_dict()
        return data 