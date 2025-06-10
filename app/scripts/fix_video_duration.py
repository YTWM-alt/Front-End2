#!/usr/bin/env python3
import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from moviepy.editor import VideoFileClip
from app.config.database import get_db_session, close_db_session
from app.models.video import Video
from app.app_config import Config
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def fix_video_durations():
    """修复视频时长信息"""
    db_session = None
    try:
        db_session = get_db_session()
        
        # 获取所有视频记录
        videos = db_session.query(Video).filter_by(is_deleted=False).all()
        
        logger.info(f"找到 {len(videos)} 个视频记录需要更新时长")
        
        updated_count = 0
        for video in videos:
            try:
                # 构建完整文件路径
                full_path = Config.BASE_DIR / video.file_path
                
                if not full_path.exists():
                    logger.warning(f"视频文件不存在: {full_path}")
                    continue
                
                # 获取视频时长
                with VideoFileClip(str(full_path)) as clip:
                    duration = clip.duration
                
                # 更新数据库记录
                video.duration = duration
                updated_count += 1
                
                logger.info(f"更新视频时长: {video.title} -> {duration:.2f}秒")
                
            except Exception as e:
                logger.error(f"更新视频时长失败 {video.title}: {str(e)}")
                continue
        
        # 提交所有更改
        db_session.commit()
        
        logger.info(f"视频时长修复完成: 更新 {updated_count} 个视频")
        
    except Exception as e:
        if db_session:
            db_session.rollback()
        logger.error(f"修复视频时长失败: {str(e)}")
        raise
    finally:
        close_db_session(db_session)

if __name__ == '__main__':
    fix_video_durations() 