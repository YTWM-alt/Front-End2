from sqlalchemy import Column, String, Integer, Text, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum
from datetime import datetime

class FeedbackType(enum.Enum):
    """反馈类型枚举"""
    BUG = 'bug'  # 问题反馈
    FEATURE = 'feature'  # 功能建议
    COMPLAINT = 'complaint'  # 投诉
    PRAISE = 'praise'  # 表扬
    OTHER = 'other'  # 其他

class FeedbackStatus(enum.Enum):
    """反馈状态枚举"""
    PENDING = 'pending'  # 待处理
    PROCESSING = 'processing'  # 处理中
    RESOLVED = 'resolved'  # 已解决
    CLOSED = 'closed'  # 已关闭

class FeedbackPriority(enum.Enum):
    """反馈优先级枚举"""
    LOW = 'low'  # 低
    MEDIUM = 'medium'  # 中
    HIGH = 'high'  # 高
    URGENT = 'urgent'  # 紧急

class Feedback(BaseModel):
    """反馈模型"""
    __tablename__ = 'feedbacks'
    
    # 反馈基本信息
    title = Column(String(200), nullable=False, comment='反馈标题')
    content = Column(Text, nullable=False, comment='反馈内容')
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, comment='反馈用户ID')
    
    # 反馈类型和状态
    type = Column(Enum(FeedbackType), nullable=False, default=FeedbackType.OTHER, comment='反馈类型')
    status = Column(Enum(FeedbackStatus), nullable=False, default=FeedbackStatus.PENDING, comment='反馈状态')
    priority = Column(Enum(FeedbackPriority), nullable=False, default=FeedbackPriority.MEDIUM, comment='反馈优先级')
    
    # 处理信息
    handler_id = Column(Integer, ForeignKey('users.id'), nullable=True, comment='处理人ID')
    handle_note = Column(Text, nullable=True, comment='处理备注')
    handle_time = Column(DateTime, nullable=True, comment='处理时间')
    
    # 关联关系
    user = relationship('User', foreign_keys=[user_id], back_populates='feedbacks')
    handler = relationship('User', foreign_keys=[handler_id])
    
    def __init__(self, title, content, user_id, type=FeedbackType.OTHER, priority=FeedbackPriority.MEDIUM, **kwargs):
        """初始化反馈"""
        super().__init__(**kwargs)
        self.title = title
        self.content = content
        self.user_id = user_id
        self.type = type
        self.priority = priority
    
    def assign_handler(self, handler_id, handle_note=None):
        """分配处理人"""
        self.handler_id = handler_id
        self.handle_note = handle_note
        self.status = FeedbackStatus.PROCESSING
    
    def resolve(self, handle_note=None):
        """解决反馈"""
        self.status = FeedbackStatus.RESOLVED
        self.handle_note = handle_note
        self.handle_time = datetime.now()
    
    def close(self, handle_note=None):
        """关闭反馈"""
        self.status = FeedbackStatus.CLOSED
        self.handle_note = handle_note
        self.handle_time = datetime.now()
    
    def to_dict(self):
        """转换为字典，包含用户信息"""
        data = super().to_dict()
        if self.user:
            data['user'] = self.user.to_dict()
        if self.handler:
            data['handler'] = self.handler.to_dict()
        return data

    def __repr__(self):
        return f"<Feedback {self.id}>"
    
    @property
    def type_display(self):
        """获取反馈类型显示名称"""
        type_map = {
            'bug': '错误报告',
            'suggestion': '功能建议',
            'question': '使用问题',
            'other': '其他反馈'
        }
        return type_map.get(self.type, self.type)
    
    @property
    def priority_display(self):
        """获取优先级显示名称"""
        priority_map = {
            1: '低',
            2: '中',
            3: '高'
        }
        return priority_map.get(self.priority, '未知')
    
    @property
    def status_display(self):
        """获取状态显示名称"""
        status_map = {
            0: '已关闭',
            1: '待处理',
            2: '处理中',
            3: '已解决'
        }
        return status_map.get(self.status, '未知') 