#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
视频导入工具
功能：将外部视频文件导入到系统并创建数据库记录
使用方法：python import_videos.py <视频所在目录>
"""

import os
import sys
import shutil
import time
from pathlib import Path
from datetime import datetime
from moviepy.editor import VideoFileClip
from flask import Flask
from app import create_app
from app.app_config import get_config
from app.models.video import Video
from app.models.user import User
from app import db
import argparse
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def parse_args():
    """解析命令行参数"""
    parser = argparse.ArgumentParser(description='导入外部视频到系统')
    parser.add_argument('source_dir', help='视频文件所在目录')
    parser.add_argument('--user_id', type=int, default=1, help='指定用户ID（默认为1）')
    parser.add_argument('--title_prefix', default='', help='视频标题前缀')
    parser.add_argument('--description', default='导入的测试视频', help='视频描述')
    return parser.parse_args()

def get_video_metadata(video_path):
    """获取视频元数据"""
    try:
        file_size = Path(video_path).stat().st_size
        with VideoFileClip(str(video_path)) as clip:
            duration = clip.duration
            
        return {
            'duration': duration,
            'file_size': file_size,
            'format': Path(video_path).suffix[1:].lower()
        }
    except Exception as e:
        logger.error(f"提取视频元数据失败: {str(e)}")
        return {
            'duration': 0,
            'file_size': Path(video_path).stat().st_size,
            'format': Path(video_path).suffix[1:].lower()
        }

def import_video(source_path, target_dir, user_id, title_prefix='', description=''):
    """导入单个视频文件"""
    try:
        # 源文件路径
        source_file = Path(source_path)
        if not source_file.exists():
            logger.error(f"源文件不存在: {source_path}")
            return False
            
        # 目标文件名和路径
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        target_filename = f"{timestamp}_{source_file.name}"
        target_path = target_dir / target_filename
        
        # 复制文件
        logger.info(f"正在复制文件: {source_path} -> {target_path}")
        shutil.copy2(source_path, target_path)
        
        # 获取视频元数据
        metadata = get_video_metadata(target_path)
        
        # 创建视频记录
        title = f"{title_prefix}{source_file.stem}" if title_prefix else source_file.stem
        video = Video(
            title=title,
            file_path=str(target_path.relative_to(config.BASE_DIR)),
            file_size=metadata['file_size'],
            format=metadata['format'],
            user_id=user_id,
            duration=metadata['duration'],
            status="ready",
            description=description
        )
        
        db.session.add(video)
        db.session.commit()
        
        logger.info(f"成功导入视频: {title}, 时长: {metadata['duration']:.2f}秒, 大小: {metadata['file_size']/1024/1024:.2f}MB")
        return True
    
    except Exception as e:
        logger.error(f"导入视频失败: {str(e)}")
        db.session.rollback()
        # 如果文件已复制但数据库操作失败，删除已复制的文件
        if target_path.exists():
            target_path.unlink()
        return False

def main():
    """主函数"""
    args = parse_args()
    
    # 创建Flask应用
    global config
    config = get_config()
    app = create_app(config)
    
    # 激活应用上下文
    with app.app_context():
        # 检查指定用户是否存在
        user = db.session.query(User).filter_by(id=args.user_id).first()
        if not user:
            logger.error(f"用户ID {args.user_id} 不存在")
            return
            
        source_dir = Path(args.source_dir)
        if not source_dir.exists() or not source_dir.is_dir():
            logger.error(f"源目录不存在或不是一个目录: {args.source_dir}")
            return
            
        # 确保目标目录存在
        target_dir = config.VIDEO_DIR
        target_dir.mkdir(parents=True, exist_ok=True)
        
        # 获取支持的视频格式
        supported_formats = config.ALLOWED_EXTENSIONS.get('video', ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'])
        supported_formats = [fmt.lstrip('.').lower() for fmt in supported_formats]
        
        # 遍历源目录下的所有视频文件
        video_files = []
        for ext in supported_formats:
            video_files.extend(source_dir.glob(f"*.{ext}"))
            
        if not video_files:
            logger.warning(f"在 {args.source_dir} 中未找到支持的视频文件")
            return
            
        logger.info(f"找到 {len(video_files)} 个视频文件")
        
        # 导入每个视频文件
        success_count = 0
        for video_file in video_files:
            if import_video(
                video_file, 
                target_dir, 
                args.user_id, 
                title_prefix=args.title_prefix, 
                description=args.description
            ):
                success_count += 1
                
        logger.info(f"导入完成: 成功 {success_count}/{len(video_files)}")

if __name__ == "__main__":
    main() 