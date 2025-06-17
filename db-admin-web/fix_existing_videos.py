#!/usr/bin/env python3
"""
修复现有视频的时长信息
"""

import os
import sys
import subprocess
import json
import logging
import pymysql
from datetime import datetime
from pathlib import Path

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_db_connection():
    """获取数据库连接"""
    try:
        config = {
            'host': 'localhost',
            'user': 'root',
            'password': '123456',
            'database': 'ai_platform',
            'charset': 'utf8mb4'
        }
        connection = pymysql.connect(**config)
        return connection
    except Exception as e:
        logger.error(f"数据库连接失败: {e}")
        return None

def get_video_duration(file_path):
    """使用ffmpeg获取视频时长"""
    try:
        cmd = [
            'ffprobe', 
            '-v', 'quiet', 
            '-print_format', 'json', 
            '-show_format', 
            str(file_path)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            info = json.loads(result.stdout)
            duration = float(info['format']['duration'])
            return duration
        else:
            logger.error(f"ffprobe执行失败: {result.stderr}")
            return None
            
    except subprocess.TimeoutExpired:
        logger.error("获取视频时长超时")
        return None
    except Exception as e:
        logger.error(f"获取视频时长失败: {e}")
        return None

def fix_video_durations():
    """修复视频时长信息"""
    connection = get_db_connection()
    if not connection:
        logger.error("无法连接数据库")
        return
    
    try:
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            # 查找所有没有时长信息或状态为processing的视频
            query = """
            SELECT id, title, file_path 
            FROM videos 
            WHERE is_deleted = 0 AND (duration IS NULL OR status = 'processing')
            """
            cursor.execute(query)
            videos = cursor.fetchall()
            
            logger.info(f"找到 {len(videos)} 个需要修复的视频")
            
            # 获取后端视频目录路径
            current_dir = Path(__file__).parent
            backend_dir = current_dir / 'backend'
            video_dir = backend_dir / 'static' / 'videos'
            
            updated_count = 0
            for video in videos:
                try:
                    # 从file_path中提取文件名
                    file_path = video['file_path']
                    if file_path.startswith('static/videos/'):
                        filename = file_path.replace('static/videos/', '')
                    else:
                        filename = os.path.basename(file_path)
                    
                    full_path = video_dir / filename
                    
                    if not full_path.exists():
                        logger.warning(f"视频文件不存在: {full_path}")
                        continue
                    
                    # 获取视频时长
                    duration = get_video_duration(full_path)
                    
                    if duration is not None:
                        # 更新数据库记录
                        update_query = """
                        UPDATE videos 
                        SET duration = %s, status = 'ready', updated_at = %s 
                        WHERE id = %s
                        """
                        cursor.execute(update_query, [duration, datetime.now(), video['id']])
                        updated_count += 1
                        logger.info(f"更新视频时长: {video['title']} -> {duration:.2f}秒")
                    else:
                        logger.warning(f"无法获取视频时长: {video['title']}")
                        
                except Exception as e:
                    logger.error(f"处理视频失败 {video['title']}: {e}")
                    continue
            
            # 提交所有更改
            connection.commit()
            logger.info(f"视频时长修复完成: 成功更新 {updated_count} 个视频")
            
    except Exception as e:
        logger.error(f"修复过程出错: {e}")
        connection.rollback()
    finally:
        connection.close()

if __name__ == '__main__':
    fix_video_durations() 