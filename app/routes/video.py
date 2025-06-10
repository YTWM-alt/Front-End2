from flask import Blueprint, current_app, request, jsonify, send_file
from pathlib import Path
import logging
import os
from datetime import datetime
from moviepy.editor import VideoFileClip
from werkzeug.utils import secure_filename
from app import db
from app.models.video import Video
from app.models.user import User

bp = Blueprint('video', __name__)
logger = logging.getLogger(__name__)

@bp.route('/', methods=['GET'])
def get_videos():
    """获取所有视频信息 - 使用数据库"""
    try:
        # 从数据库获取所有视频记录
        videos = db.session.query(Video).filter_by(is_deleted=False).all()
        
        video_list = []
        for video in videos:
            # 检查文件是否仍然存在
            full_path = current_app.config['BASE_DIR'] / video.file_path
            if not full_path.exists():
                logger.warning(f"视频文件不存在: {full_path}")
                continue
            
            video_info = {
                'id': video.id,
                'title': video.title,
                'filename': Path(video.file_path).name,
                'file_path': video.file_path,
                'file_size': video.file_size,
                'file_size_mb': round(video.file_size / (1024 * 1024), 2),
                'format': video.format,
                'duration': video.duration,
                'duration_formatted': f"{int(video.duration // 60)}:{int(video.duration % 60):02d}" if video.duration else "0:00",
                'status': video.status,
                'upload_time': video.created_at.strftime('%Y-%m-%d %H:%M:%S') if video.created_at else None,
                'user_id': video.user_id,
                'description': video.description
            }
            video_list.append(video_info)
        
        logger.info(f"成功获取 {len(video_list)} 个视频信息")
        return jsonify({
            'success': True,
            'videos': video_list,
            'count': len(video_list)
        })
        
    except Exception as e:
        logger.error(f"获取视频列表失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'获取视频列表失败: {str(e)}'
        }), 500

@bp.route('/<filename>', methods=['GET'])
def serve_video(filename):
    """提供视频文件服务 - 混合模式（数据库+文件系统）"""
    try:
        logger.info(f"请求视频文件: {filename}")
        
        # 从数据库获取视频记录
        video = db.session.query(Video).filter(
            Video.file_path.like(f'%{filename}')
        ).filter_by(is_deleted=False).first()
        
        if not video:
            logger.warning(f"数据库中未找到视频: {filename}")
            # 尝试直接从文件系统寻找
            video_dir = current_app.config['VIDEO_DIR']
            full_path = video_dir / filename
            
            if not full_path.exists():
                logger.error(f"视频文件不存在: {full_path}")
                return jsonify({'error': '视频文件不存在'}), 404
                
            logger.info(f"直接从文件系统提供视频: {full_path}")
            return send_file(
                full_path,
                as_attachment=False,
                mimetype=f'video/mp4'
            )
        
        # 构建完整文件路径
        full_path = current_app.config['BASE_DIR'] / video.file_path
        logger.info(f"从数据库记录找到视频路径: {full_path}, 存在状态: {full_path.exists()}")
        
        if not full_path.exists():
            # 尝试直接使用文件名
            video_dir = current_app.config['VIDEO_DIR']
            alt_path = video_dir / Path(video.file_path).name
            logger.info(f"尝试替代路径: {alt_path}, 存在状态: {alt_path.exists()}")
            
            if alt_path.exists():
                full_path = alt_path
            else:
                logger.error(f"视频文件不存在: {full_path}")
                return jsonify({'error': '视频文件不存在'}), 404
        
        logger.info(f"提供视频文件: {full_path}")
        return send_file(
            full_path,
            as_attachment=False,
            mimetype=f'video/{video.format}'
        )
        
    except Exception as e:
        logger.error(f"提供视频文件失败: {str(e)}")
        return jsonify({'error': f'提供视频文件失败: {str(e)}'}), 500

@bp.route('/<filename>', methods=['DELETE'])
def delete_video(filename):
    """删除视频 - 使用数据库软删除"""
    try:
        # 从数据库查找视频记录
        video = db.session.query(Video).filter(
            Video.file_path.like(f'%{filename}')
        ).filter_by(is_deleted=False).first()
        
        if not video:
            return jsonify({
                'success': False,
                'message': '视频不存在'
            }), 404
        
        # 软删除视频记录
        video.is_deleted = True
        video.deleted_at = datetime.utcnow()
        
        # 可选：删除实际文件
        full_path = current_app.config['BASE_DIR'] / video.file_path
        if full_path.exists():
            try:
                full_path.unlink()
                logger.info(f"已删除视频文件: {full_path}")
            except Exception as e:
                logger.warning(f"删除视频文件失败（仅软删除数据库记录）: {str(e)}")
        
        db.session.commit()
        
        logger.info(f"视频删除成功: {filename}")
        return jsonify({
            'success': True,
            'message': '视频删除成功'
        })
        
    except Exception as e:
        if db.session:
            db.session.rollback()
        logger.error(f"删除视频失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'删除视频失败: {str(e)}'
        }), 500

@bp.route('/process-ai-video', methods=['POST'])
def process_ai_video():
    """处理AI产品视频 - 使用数据库"""
    try:
        ai_product_dir = current_app.config['AI_PRODUCT_DIR']
        if not ai_product_dir.exists():
            return jsonify({
                'success': False,
                'message': 'AI产品目录不存在'
            }), 404
        
        # 获取AI_product文件夹中的所有视频文件
        video_extensions = current_app.config['ALLOWED_EXTENSIONS']['video']
        video_files = []
        for ext in video_extensions:
            clean_ext = ext.lstrip('.')
            video_files.extend(ai_product_dir.glob(f'*.{clean_ext}'))
        
        processed_count = 0
        for video_file in video_files:
            try:
                # 检查是否已存在于数据库
                existing_video = db.session.query(Video).filter_by(
                    file_path=str(video_file.relative_to(current_app.config['BASE_DIR']))
                ).first()
                
                if existing_video:
                    continue
                
                # 获取视频信息
                with VideoFileClip(str(video_file)) as clip:
                    duration = clip.duration
                
                # 获取默认用户
                default_user = db.session.query(User).first()
                if not default_user:
                    logger.error("未找到用户，无法处理AI视频")
                    continue
                
                # 创建视频记录
                video = Video(
                    title=f"AI产品-{video_file.stem}",
                    file_path=str(video_file.relative_to(current_app.config['BASE_DIR'])),
                    file_size=video_file.stat().st_size,
                    format=video_file.suffix[1:].lower(),
                    user_id=default_user.id,
                    duration=duration,
                    status="processed",
                    description="AI生成的视频产品"
                )
                
                db.session.add(video)
                db.session.commit()
                processed_count += 1
                
            except Exception as e:
                logger.error(f"处理AI视频文件失败: {str(e)}")
                continue
        
        return jsonify({
            'success': True,
            'message': f'成功处理 {processed_count} 个AI视频文件',
            'processed_count': processed_count
        })
        
    except Exception as e:
        logger.error(f"处理AI视频失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'处理AI视频失败: {str(e)}'
        }), 500

@bp.route('/upload', methods=['POST'])
def upload_video():
    """上传视频 - 使用数据库"""
    try:
        # 检查请求中是否有文件
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'message': '没有上传文件'
            }), 400
            
        file = request.files['file']
        
        # 检查文件名是否为空
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': '没有选择文件'
            }), 400
            
        # 检查文件扩展名
        filename = secure_filename(file.filename)
        _, file_extension = os.path.splitext(filename)
        if file_extension.lower() not in current_app.config['ALLOWED_EXTENSIONS']['video']:
            return jsonify({
                'success': False,
                'message': f'不支持的文件类型: {file_extension}'
            }), 400
            
        # 生成带时间戳的文件名，防止重复
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        new_filename = f"{timestamp}{file_extension}"
        
        # 保存文件
        upload_folder = current_app.config['VIDEO_DIR']
        file_path = upload_folder / new_filename
        file.save(str(file_path))
        
        # 获取视频信息
        file_size = file_path.stat().st_size
        duration = None
        
        try:
            with VideoFileClip(str(file_path)) as clip:
                duration = clip.duration
        except Exception as e:
            logger.warning(f"获取视频时长失败: {str(e)}")
            
        # 获取用户ID，如果没有提供则使用默认用户
        user_id = request.form.get('user_id')
        if not user_id:
            default_user = db.session.query(User).first()
            if default_user:
                user_id = default_user.id
            else:
                logger.warning("未找到默认用户，将使用None作为user_id")
                
        # 创建视频记录
        video = Video(
            title=request.form.get('title', filename),
            file_path=str(file_path.relative_to(current_app.config['BASE_DIR'])),
            file_size=file_size,
            format=file_extension[1:].lower(),
            user_id=user_id,
            duration=duration,
            status="uploaded",
            description=request.form.get('description', '')
        )
        
        db.session.add(video)
        db.session.commit()
        
        logger.info(f"视频上传成功: {new_filename}")
        return jsonify({
            'success': True,
            'message': '视频上传成功',
            'video': {
                'id': video.id,
                'title': video.title,
                'filename': new_filename,
                'file_size': file_size,
                'file_size_mb': round(file_size / (1024 * 1024), 2),
                'format': file_extension[1:].lower(),
                'duration': duration,
                'upload_time': video.created_at.strftime('%Y-%m-%d %H:%M:%S') if video.created_at else None
            }
        })
        
    except Exception as e:
        if 'db' in locals() and db.session:
            db.session.rollback()
        logger.error(f"上传视频失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'上传视频失败: {str(e)}'
        }), 500 