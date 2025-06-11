#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
视频导入脚本
将指定目录中的视频文件导入到数据库中
"""

import os
import sys
from pathlib import Path
import shutil
import logging
import argparse
from datetime import datetime
from moviepy.editor import VideoFileClip
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 尝试导入应用模型
try:
    # 先添加项目根目录到PYTHONPATH
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
    
    # 导入模型
    from app import create_app, db
    from app.models.video import Video
    from app.models.user import User
    
    logger.info("成功导入应用模型")
except ImportError as e:
    logger.error(f"导入应用模型失败: {str(e)}")
    sys.exit(1)

def get_video_info(video_path):
    """获取视频信息"""
    try:
        with VideoFileClip(str(video_path)) as clip:
            return {
                'duration': clip.duration,
                'size': video_path.stat().st_size,
                'format': video_path.suffix[1:].lower()
            }
    except Exception as e:
        logger.error(f"获取视频信息失败: {str(e)}")
        return {
            'duration': 0,
            'size': video_path.stat().st_size,
            'format': video_path.suffix[1:].lower()
        }

def import_videos(source_dir, target_dir, user_id=None, app=None):
    """导入视频文件到数据库"""
    # 确保目录存在
    source_path = Path(source_dir)
    if not source_path.exists():
        logger.error(f"源目录不存在: {source_path}")
        return False
    
    target_path = Path(target_dir)
    target_path.mkdir(parents=True, exist_ok=True)
    
    # 允许的视频格式
    allowed_extensions = {'.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'}
    
    # 获取视频文件列表
    video_files = []
    for ext in allowed_extensions:
        video_files.extend(source_path.glob(f'*{ext}'))
    
    if not video_files:
        logger.warning(f"源目录中没有找到视频文件: {source_path}")
        return False
    
    logger.info(f"找到 {len(video_files)} 个视频文件")
    
    # 创建Flask应用上下文
    with app.app_context():
        # 获取默认用户
        if not user_id:
            user = db.session.query(User).first()
            if not user:
                logger.error("数据库中没有用户记录，无法导入视频")
                return False
            user_id = user.id
        
        # 导入视频
        imported_count = 0
        for video_file in video_files:
            try:
                # 生成目标文件名
                target_file = target_path / video_file.name
                
                # 检查是否已存在
                existing_video = db.session.query(Video).filter_by(
                    file_path=str(target_file.relative_to(app.config['BASE_DIR']))
                ).first()
                
                if existing_video:
                    logger.info(f"视频已存在: {video_file.name}")
                    continue
                
                # 复制文件
                logger.info(f"复制视频文件: {video_file} -> {target_file}")
                shutil.copy2(video_file, target_file)
                
                # 获取视频信息
                video_info = get_video_info(target_file)
                
                # 创建视频记录
                relative_path = str(target_file.relative_to(app.config['BASE_DIR']))
                logger.info(f"相对路径: {relative_path}")
                
                video = Video(
                    title=video_file.stem,
                    file_path=relative_path,
                    file_size=video_info['size'],
                    format=video_info['format'],
                    user_id=user_id,
                    duration=video_info['duration'],
                    description=f"导入的视频: {video_file.name}",
                    status="ready"
                )
                
                db.session.add(video)
                db.session.commit()
                imported_count += 1
                logger.info(f"成功导入视频: {video_file.name}")
                
            except Exception as e:
                db.session.rollback()
                logger.error(f"导入视频失败: {video_file.name}, 错误: {str(e)}")
                continue
        
        logger.info(f"成功导入 {imported_count} 个视频")
        return imported_count > 0

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='视频导入工具')
    parser.add_argument('--source', help='源视频目录')
    parser.add_argument('--user-id', help='用户ID')
    args = parser.parse_args()
    
    # 获取源目录
    source_dir = args.source or input("请输入源视频目录: ")
    source_dir = Path(source_dir).expanduser().absolute()
    
    # 获取用户ID
    user_id = args.user_id or input("请输入用户ID (默认使用第一个用户): ") or None
    if user_id:
        user_id = int(user_id)
    
    # 创建应用实例
    app = create_app()
    
    # 导入视频
    target_dir = app.config['VIDEO_DIR']
    logger.info(f"源目录: {source_dir}")
    logger.info(f"目标目录: {target_dir}")
    
    if import_videos(source_dir, target_dir, user_id, app):
        logger.info("视频导入完成")
    else:
        logger.error("视频导入失败")

if __name__ == "__main__":
    main() 