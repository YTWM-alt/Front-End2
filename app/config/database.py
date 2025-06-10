import os
from pathlib import Path

class DatabaseConfig:
    """数据库配置类"""
    
    # 基础目录
    BASE_DIR = Path(__file__).parent.parent.parent
    
    # MySQL配置
    MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3306))
    MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '123456')
    MYSQL_DATABASE = os.environ.get('MYSQL_DATABASE', 'ai_platform')
    
    # SQLAlchemy配置
    SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"
    
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,  # 连接池大小
        'max_overflow': 20,  # 超过pool_size后最多可以创建的连接数
        'pool_timeout': 30,  # 连接池获取连接的超时时间
        'pool_recycle': 1800,  # 连接在连接池中重用的时间限制
        'echo': False,  # 是否打印SQL语句
        'echo_pool': False,  # 是否打印连接池信息
    }
    
    # 文件上传目录配置
    UPLOAD_DIR = BASE_DIR / 'database'
    
    # 确保上传目录存在
    @classmethod
    def ensure_upload_dirs(cls):
        """确保所有上传目录存在"""
        dirs = [
            cls.UPLOAD_DIR,
            cls.UPLOAD_DIR / 'video',
            cls.UPLOAD_DIR / 'touxiang',
            cls.UPLOAD_DIR / 'AI_product'
        ]
        for directory in dirs:
            directory.mkdir(parents=True, exist_ok=True)

# 下面的代码保留但不再使用，因为我们统一使用Flask-SQLAlchemy
# 旧代码留在这里作为参考，确保向后兼容性
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

# 全局数据库引擎和会话 - 这些将通过Flask-SQLAlchemy替代
engine = None
SessionLocal = None

def init_database():
    """初始化数据库连接 - 现在通过Flask-SQLAlchemy完成"""
    # 此函数仅作兼容性保留
    from app import db
    return db.engine, db.session

def get_db_session():
    """获取数据库会话 - 现在通过Flask-SQLAlchemy完成"""
    # 兼容旧代码
    from app import db
    return db.session

def close_db_session(db_session):
    """关闭数据库会话 - 现在Flask-SQLAlchemy会自动处理"""
    # 此函数无需操作，保留是为了兼容性
    pass 