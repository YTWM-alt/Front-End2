#!/usr/bin/env python3
import os
import sys
from pathlib import Path
from datetime import datetime

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from moviepy.editor import VideoFileClip
from app.config.database import get_db_session, close_db_session
from app.models.video import Video
from app.models.user import User
from app.app_config import Config
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_video_info(filepath):
    """获取视频文件信息"""
    try:
        with VideoFileClip(str(filepath)) as clip:
            duration = clip.duration
            size = filepath.stat().st_size
            
            return {
                'duration': duration,
                'size': size
            }
    except Exception as e:
        logger.error(f"获取视频信息失败 {filepath}: {str(e)}")
        return None

def sync_videos_to_database():
    """同步视频文件到数据库"""
    db_session = None
    try:
        # 获取数据库会话
        db_session = get_db_session()
        
        # 获取默认用户（用于关联视频）
        default_user = db_session.query(User).first()
        if not default_user:
            logger.error("未找到用户，无法同步视频")
            return
        
        video_dir = Config.VIDEO_DIR
        if not video_dir.exists():
            logger.error(f"视频目录不存在: {video_dir}")
            return
        
        # 获取所有视频文件
        video_extensions = Config.ALLOWED_EXTENSIONS['video']
        video_files = []
        for ext in video_extensions:
            clean_ext = ext.lstrip('.')
            video_files.extend(video_dir.glob(f'*.{clean_ext}'))
        
        logger.info(f"找到 {len(video_files)} 个视频文件")
        
        synced_count = 0
        skipped_count = 0
        
        for video_file in video_files:
            try:
                # 检查视频是否已存在于数据库
                existing_video = db_session.query(Video).filter_by(
                    file_path=str(video_file.relative_to(Config.BASE_DIR))
                ).first()
                
                if existing_video:
                    logger.info(f"视频已存在，跳过: {video_file.name}")
                    skipped_count += 1
                    continue
                
                # 获取视频信息
                video_info = get_video_info(video_file)
                if not video_info:
                    logger.warning(f"无法获取视频信息，跳过: {video_file.name}")
                    continue
                
                # 创建视频记录
                video = Video(
                    title=video_file.stem,
                    file_path=str(video_file.relative_to(Config.BASE_DIR)),
                    file_size=video_info['size'],
                    format=video_file.suffix[1:].lower(),
                    user_id=default_user.id,
                    duration=video_info['duration'],
                    status='ready'
                )
                
                # 设置创建和修改时间
                stats = video_file.stat()
                video.created_at = datetime.fromtimestamp(stats.st_ctime)
                video.updated_at = datetime.fromtimestamp(stats.st_mtime)
                
                db_session.add(video)
                logger.info(f"同步视频: {video_file.name}")
                synced_count += 1
                
            except Exception as e:
                logger.error(f"同步视频失败 {video_file.name}: {str(e)}")
                db_session.rollback()
                continue
        
        # 提交所有更改
        db_session.commit()
        
        logger.info(f"视频同步完成: 同步 {synced_count} 个，跳过 {skipped_count} 个")
        
    except Exception as e:
        if db_session:
            db_session.rollback()
        logger.error(f"视频同步失败: {str(e)}")
        raise
    finally:
        close_db_session(db_session)

if __name__ == '__main__':
    sync_videos_to_database() 