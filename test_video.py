#!/usr/bin/env python3
"""
测试视频生成脚本
生成一个测试视频文件并添加到数据库
"""

import os
import numpy as np
from pathlib import Path
from moviepy.editor import ColorClip
from app import create_app, db
from app.models.video import Video
from app.models.user import User

def create_test_video(output_path, duration=5, size=(640, 480), fps=24):
    """创建一个测试视频文件"""
    # 创建一个彩色视频片段
    color_clip = ColorClip(size=size, color=(0, 0, 255), duration=duration)
    
    # 添加黑框
    color_clip = color_clip.margin(10, color=(0, 0, 0))
    
    # 写入到文件
    color_clip.write_videofile(output_path, fps=fps, codec='libx264')
    
    return Path(output_path)

def main():
    """主函数"""
    print("正在创建测试视频...")
    
    # 创建应用实例
    app = create_app()
    
    with app.app_context():
        # 获取或创建测试用户
        user = db.session.query(User).first()
        if not user:
            user = User(
                username="testuser",
                email="test@example.com",
                password_hash="test_hash",
                is_active=True
            )
            db.session.add(user)
            db.session.commit()
            print(f"创建测试用户: {user.username}")
        
        # 创建测试视频目录
        video_dir = app.config['VIDEO_DIR']
        video_dir.mkdir(parents=True, exist_ok=True)
        
        # 生成测试视频文件
        for i in range(1, 4):  # 创建3个测试视频
            video_name = f"test_video_{i}.mp4"
            video_path = video_dir / video_name
            
            if not video_path.exists():
                # 创建测试视频文件
                print(f"正在生成测试视频 {i}...")
                create_test_video(str(video_path), duration=3+i, size=(640, 480), fps=24)
                
                # 添加到数据库
                relative_path = str(video_path.relative_to(app.config['BASE_DIR']))
                video = Video(
                    title=f"测试视频 {i}",
                    file_path=relative_path,
                    file_size=video_path.stat().st_size,
                    format="mp4",
                    user_id=user.id,
                    duration=3+i,
                    description=f"这是一个测试视频 #{i}",
                    status="ready"
                )
                db.session.add(video)
                db.session.commit()
                print(f"成功添加测试视频 {i} 到数据库")
            else:
                print(f"测试视频 {i} 已存在")
        
        print("测试视频创建完成")

if __name__ == "__main__":
    main() 