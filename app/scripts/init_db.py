import os
import sys
import logging
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from sqlalchemy import create_engine, text
from app.config.database import DatabaseConfig
from app.models.base import Base
from app.models.user import User
from app.models.question import Question
from app.models.answer import Answer
from app.models.feedback import Feedback
from app.models.video import Video

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_database():
    """创建数据库"""
    try:
        # 创建不带数据库名的连接URL
        url = f"mysql+pymysql://{DatabaseConfig.MYSQL_USER}:{DatabaseConfig.MYSQL_PASSWORD}@{DatabaseConfig.MYSQL_HOST}:{DatabaseConfig.MYSQL_PORT}"
        engine = create_engine(url)
        
        # 创建数据库
        with engine.connect() as conn:
            # 检查数据库是否存在
            result = conn.execute(text(f"SHOW DATABASES LIKE '{DatabaseConfig.MYSQL_DATABASE}'"))
            if not result.fetchone():
                # 创建数据库
                conn.execute(text(f"CREATE DATABASE {DatabaseConfig.MYSQL_DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
                logger.info(f"数据库 {DatabaseConfig.MYSQL_DATABASE} 创建成功")
            else:
                logger.info(f"数据库 {DatabaseConfig.MYSQL_DATABASE} 已存在")
        
        engine.dispose()
        return True
        
    except Exception as e:
        logger.error(f"创建数据库失败: {str(e)}")
        return False

def init_database():
    """初始化数据库表"""
    try:
        # 创建数据库引擎
        engine = create_engine(
            DatabaseConfig.SQLALCHEMY_DATABASE_URL,
            **DatabaseConfig.SQLALCHEMY_ENGINE_OPTIONS
        )
        
        # 创建所有表
        Base.metadata.create_all(engine)
        logger.info("数据库表创建成功")
        
        engine.dispose()
        return True
        
    except Exception as e:
        logger.error(f"初始化数据库表失败: {str(e)}")
        return False

def main():
    """主函数"""
    try:
        # 创建数据库
        if not create_database():
            return
        
        # 初始化数据库表
        if not init_database():
            return
        
        logger.info("数据库初始化完成")
        
    except Exception as e:
        logger.error(f"数据库初始化失败: {str(e)}")
        raise

if __name__ == '__main__':
    main() 