import os
import sys
import json
from datetime import datetime
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from werkzeug.security import generate_password_hash
import logging

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from app.config.database import DatabaseConfig
from app.models.base import Base
from app.models.user import User
from app.models.question import Question
from app.models.answer import Answer
from app.models.feedback import Feedback, FeedbackType, FeedbackStatus, FeedbackPriority
from app.models.video import Video

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def init_db():
    """初始化数据库"""
    # 创建数据库引擎
    engine = create_engine(
        DatabaseConfig.SQLALCHEMY_DATABASE_URL,
        **DatabaseConfig.SQLALCHEMY_ENGINE_OPTIONS
    )
    
    # 创建所有表
    Base.metadata.create_all(engine)
    
    # 创建会话工厂
    Session = sessionmaker(bind=engine)
    return Session()

def parse_user_file(file_path):
    """解析用户文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 提取用户信息
        user_info = {}
        for line in content.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip()
                if key == '用户姓名':
                    user_info['username'] = value
                elif key == '邮箱地址':
                    user_info['email'] = value
                elif key == '密码':
                    user_info['password'] = value
                elif key == '注册时间':
                    user_info['created_at'] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                elif key == '最后登录':
                    if value != '尚未登录':
                        user_info['last_login'] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                elif key == '账户状态':
                    user_info['is_active'] = value == 'active'
                elif key == '用户ID':
                    user_info['user_id'] = value
                elif key == '头像地址':
                    user_info['avatar_url'] = value
        
        return user_info
    except Exception as e:
        logger.error(f"解析用户文件失败 {file_path}: {str(e)}")
        return None

def migrate_users(session, user_dir):
    """迁移用户数据"""
    logger.info("开始迁移用户数据...")
    
    # 遍历用户目录
    for file_path in user_dir.glob('*.txt'):
        user_info = parse_user_file(file_path)
        if not user_info:
            continue
        
        try:
            # 检查用户是否已存在
            existing_user = session.query(User).filter_by(email=user_info['email']).first()
            if existing_user:
                logger.info(f"用户已存在: {user_info['email']}")
                continue
            
            # 创建新用户
            user = User(
                username=user_info['username'],
                email=user_info['email'],
                password_hash=generate_password_hash(user_info['password']),
                avatar_url=user_info.get('avatar_url'),
                is_active=user_info.get('is_active', True),
                last_login=user_info.get('last_login'),
                created_at=user_info.get('created_at', datetime.now())
            )
            
            session.add(user)
            logger.info(f"添加用户: {user_info['email']}")
            
        except Exception as e:
            logger.error(f"迁移用户失败 {user_info['email']}: {str(e)}")
            session.rollback()
            continue
    
    session.commit()
    logger.info("用户数据迁移完成")

def parse_question_file(file_path):
    """解析问题文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 提取问题内容
        question_content = None
        for line in content.split('\n'):
            if line.startswith('输入内容:'):
                question_content = line.replace('输入内容:', '').strip()
                break
        
        if not question_content:
            return None
        
        # 获取文件信息
        stats = file_path.stat()
        
        return {
            'content': question_content,
            'created_at': datetime.fromtimestamp(stats.st_ctime),
            'updated_at': datetime.fromtimestamp(stats.st_mtime)
        }
    except Exception as e:
        logger.error(f"解析问题文件失败 {file_path}: {str(e)}")
        return None

def migrate_questions(session, question_dir):
    """迁移问题数据"""
    logger.info("开始迁移问题数据...")
    
    # 获取默认用户（用于关联旧数据）
    default_user = session.query(User).first()
    if not default_user:
        logger.error("未找到默认用户，无法迁移问题数据")
        return
    
    # 遍历问题目录
    for file_path in question_dir.glob('*.txt'):
        question_info = parse_question_file(file_path)
        if not question_info:
            continue
        
        try:
            # 创建新问题
            question = Question(
                title=f"问题 {file_path.stem}",  # 使用文件名作为标题
                content=question_info['content'],
                user_id=default_user.id,
                created_at=question_info['created_at'],
                updated_at=question_info['updated_at']
            )
            
            session.add(question)
            logger.info(f"添加问题: {file_path.name}")
            
        except Exception as e:
            logger.error(f"迁移问题失败 {file_path.name}: {str(e)}")
            session.rollback()
            continue
    
    session.commit()
    logger.info("问题数据迁移完成")

def migrate_feedbacks(session, feedback_dir):
    """迁移反馈数据"""
    logger.info("开始迁移反馈数据...")
    
    # 获取默认用户
    default_user = session.query(User).first()
    if not default_user:
        logger.error("未找到默认用户，无法迁移反馈数据")
        return
    
    # 遍历反馈目录
    for file_path in feedback_dir.glob('feedback_*.txt'):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 提取反馈信息
            feedback_info = {}
            for line in content.split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip()
                    value = value.strip()
                    if key == '反馈类型':
                        feedback_info['type'] = value
                    elif key == '反馈标题':
                        feedback_info['title'] = value
                    elif key == '反馈内容':
                        feedback_info['content'] = value
                    elif key == '优先级':
                        feedback_info['priority'] = int(value)
                    elif key == '状态':
                        feedback_info['status'] = int(value)
            
            if not all(k in feedback_info for k in ['type', 'title', 'content']):
                continue
            
            # 创建新反馈
            feedback = Feedback(
                title=feedback_info['title'],
                content=feedback_info['content'],
                user_id=default_user.id,
                type=FeedbackType.OTHER,  # 默认类型
                priority=FeedbackPriority.MEDIUM,  # 默认优先级
                status=FeedbackStatus.PENDING,  # 默认状态
                created_at=datetime.fromtimestamp(file_path.stat().st_ctime)
            )
            
            session.add(feedback)
            logger.info(f"添加反馈: {file_path.name}")
            
        except Exception as e:
            logger.error(f"迁移反馈失败 {file_path.name}: {str(e)}")
            session.rollback()
            continue
    
    session.commit()
    logger.info("反馈数据迁移完成")

def migrate_videos(session, video_dir):
    """迁移视频数据"""
    logger.info("开始迁移视频数据...")
    
    # 获取默认用户
    default_user = session.query(User).first()
    if not default_user:
        logger.error("未找到默认用户，无法迁移视频数据")
        return
    
    # 遍历视频目录
    for file_path in video_dir.glob('*.*'):
        if file_path.suffix.lower() not in {'.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'}:
            continue
        
        try:
            # 获取文件信息
            stats = file_path.stat()
            
            # 创建新视频记录
            video = Video(
                title=file_path.stem,
                file_path=str(file_path.relative_to(DatabaseConfig.BASE_DIR)),
                file_size=stats.st_size,
                format=file_path.suffix[1:].lower(),
                user_id=default_user.id,
                status='ready',
                created_at=datetime.fromtimestamp(stats.st_ctime),
                updated_at=datetime.fromtimestamp(stats.st_mtime)
            )
            
            session.add(video)
            logger.info(f"添加视频: {file_path.name}")
            
        except Exception as e:
            logger.error(f"迁移视频失败 {file_path.name}: {str(e)}")
            session.rollback()
            continue
    
    session.commit()
    logger.info("视频数据迁移完成")

def main():
    """主函数"""
    try:
        # 初始化数据库会话
        session = init_db()
        
        # 获取数据目录
        base_dir = DatabaseConfig.BASE_DIR
        user_dir = base_dir / 'database' / 'user'
        question_dir = base_dir / 'database' / 'question'
        feedback_dir = base_dir / 'database' / 'feedback'
        video_dir = base_dir / 'database' / 'video'
        
        # 执行数据迁移
        migrate_users(session, user_dir)
        migrate_questions(session, question_dir)
        migrate_feedbacks(session, feedback_dir)
        migrate_videos(session, video_dir)
        
        logger.info("数据迁移完成")
        
    except Exception as e:
        logger.error(f"数据迁移失败: {str(e)}")
        raise
    finally:
        session.close()

if __name__ == '__main__':
    main() 