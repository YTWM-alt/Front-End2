from datetime import datetime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, DateTime, String, Boolean

Base = declarative_base()

class BaseModel(Base):
    """所有模型的基类"""
    __abstract__ = True
    
    # 基础字段
    id = Column(Integer, primary_key=True, autoincrement=True, comment='主键ID')
    created_at = Column(DateTime, default=datetime.now, nullable=False, comment='创建时间')
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False, comment='更新时间')
    is_deleted = Column(Boolean, default=False, nullable=False, comment='是否删除')
    deleted_at = Column(DateTime, nullable=True, comment='删除时间')
    
    def to_dict(self):
        """将模型转换为字典"""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
            if column.name != 'is_deleted' and column.name != 'deleted_at'
        }
    
    def soft_delete(self):
        """软删除"""
        self.is_deleted = True
        self.deleted_at = datetime.now()
    
    def restore(self):
        """恢复删除"""
        self.is_deleted = False
        self.deleted_at = None 