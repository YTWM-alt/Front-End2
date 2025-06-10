from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from app.config.database import DatabaseConfig

"""
此文件保留用于兼容性，但实际使用的是Flask-SQLAlchemy
所有数据库操作应直接使用 app.db 模块中的 db 对象
"""

# 创建数据库引擎 - 兼容旧代码
engine = None
Session = None

def init_db():
    """初始化数据库 - 兼容旧代码"""
    global engine, Session
    
    if engine is None:
        # 从Flask-SQLAlchemy获取
        from app import db
        engine = db.engine
        Session = db.session
        
    return engine, Session

def get_db():
    """获取数据库会话 - 兼容旧代码"""
    global Session
    
    if Session is None:
        from app import db
        Session = db.session
    
    # 返回生成器以保持与原始代码兼容
    db_session = Session
    try:
        yield db_session
    finally:
        # Flask-SQLAlchemy会自动处理会话关闭
        pass 