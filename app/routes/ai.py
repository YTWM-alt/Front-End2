from flask import Blueprint, jsonify, request, current_app, send_file
import os
import time
import threading
from datetime import datetime, timedelta
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import logging

# 创建蓝图
bp = Blueprint('ai', __name__)

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 确保answer目录存在
answer_dir = Path('database/answer')
answer_dir.mkdir(parents=True, exist_ok=True)

# 全局变量声明
pending_answers = []  # AI回答消息队列
last_processed_time = datetime.now()  # 最后处理时间
observer = None  # 观察者实例

class AnswerFileHandler(FileSystemEventHandler):
    """监听answer文件夹的文件变化"""
    
    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith('.txt'):
            try:
                # 读取新创建的回答文件
                with open(event.src_path, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                
                # 生成唯一ID
                answer_id = f"answer_{int(time.time())}_{os.path.basename(event.src_path)}"
                
                # 添加到待处理队列
                global pending_answers
                pending_answers.append({
                    'id': answer_id,
                    'content': content,
                    'filename': os.path.basename(event.src_path),
                    'timestamp': datetime.now().isoformat(),
                    'processed': False
                })
                
                logger.info(f"检测到新的AI回答: {answer_id}")
                logger.debug(f"回答内容: {content[:100]}...")
                
            except Exception as e:
                logger.error(f"处理新回答文件失败: {str(e)}")

def cleanup_old_data():
    """清理旧数据的线程函数"""
    while True:
        try:
            global pending_answers, last_processed_time
            # 清理一小时前的数据
            one_hour_ago = datetime.now() - timedelta(hours=1)
            pending_answers = [
                answer for answer in pending_answers 
                if datetime.fromisoformat(answer['timestamp']) > one_hour_ago
            ]
            time.sleep(300)  # 每5分钟清理一次
        except Exception as e:
            logger.error(f"清理旧数据失败: {str(e)}")
            time.sleep(60)  # 发生错误时等待1分钟后重试

def start_answer_folder_watcher():
    """启动answer文件夹监听器"""
    try:
        logger.info("开始监听answer文件夹...")
        
        # 创建观察者
        global observer
        observer = Observer()
        observer.schedule(AnswerFileHandler(), str(answer_dir), recursive=False)
        observer.start()
        
        # 启动清理线程
        cleanup_thread = threading.Thread(target=cleanup_old_data, daemon=True)
        cleanup_thread.start()
        
        logger.info(f"正在监听目录: {answer_dir}")
        return observer
        
    except Exception as e:
        logger.error(f"启动answer文件夹监听失败: {str(e)}")
        return None

@bp.before_app_request
def initialize_ai_service():
    """在每个请求之前检查并初始化AI服务"""
    global observer
    if observer is None:
        observer = start_answer_folder_watcher()
        if observer:
            logger.info("AI服务初始化成功")
        else:
            logger.error("AI服务初始化失败")

@bp.route('/pending-answers', methods=['GET'])
def get_pending_answers():
    """获取待处理的AI回答"""
    try:
        since = request.args.get('since')
        global pending_answers, last_processed_time
        
        # 兼容多种ISO时间格式
        if since:
            try:
                # 尝试直接解析
                since_time = datetime.fromisoformat(since)
            except ValueError:
                try:
                    # 处理带Z的UTC时间格式
                    if since.endswith('Z'):
                        since = since[:-1] + '+00:00'
                    since_time = datetime.fromisoformat(since)
                except ValueError:
                    # 如果还是失败，使用最后处理时间
                    logger.warning(f"无法解析时间格式: {since}，使用最后处理时间")
                    since_time = last_processed_time
        else:
            since_time = last_processed_time
        
        # 获取指定时间之后的未处理回答
        new_answers = [
            answer for answer in pending_answers 
            if not answer['processed'] and 
            datetime.fromisoformat(answer['timestamp']) > since_time
        ]
        
        # 标记为已处理
        for answer in new_answers:
            answer['processed'] = True
        
        # 更新最后处理时间
        if new_answers:
            last_processed_time = datetime.now()
        
        return jsonify({
            'success': True,
            'answers': new_answers,
            'total': len(new_answers),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"获取待处理回答失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': '获取AI回答失败',
            'error': str(e)
        }), 500

@bp.route('/', methods=['GET'])
def ai_status():
    """获取AI服务状态"""
    try:
        global pending_answers, last_processed_time
        
        return jsonify({
            'success': True,
            'status': 'ready',
            'pending_count': len([a for a in pending_answers if not a['processed']]),
            'latest_answer_time': max(
                [datetime.fromisoformat(a['timestamp']) for a in pending_answers],
                default=datetime.now()
            ).isoformat(),
            'total_answers': len(pending_answers),
            'last_processed': last_processed_time.isoformat()
        })
        
    except Exception as e:
        logger.error(f"获取AI状态失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': '获取AI状态失败',
            'error': str(e)
        }), 500

@bp.route('/videos/<filename>')
def serve_ai_video(filename):
    """提供AI生成的视频文件"""
    try:
        # 从AI_product目录提供视频
        video_dir = current_app.config['AI_PRODUCT_DIR']
        file_path = video_dir / filename
        logger.info(f"请求AI视频文件: {file_path}, 存在状态: {file_path.exists()}")
        
        if file_path.exists():
            # 猜测视频MIME类型
            mime_type = 'video/mp4'  # 默认为MP4
            if filename.lower().endswith('.mp4'):
                mime_type = 'video/mp4'
            elif filename.lower().endswith('.webm'):
                mime_type = 'video/webm'
            elif filename.lower().endswith('.ogg') or filename.lower().endswith('.ogv'):
                mime_type = 'video/ogg'
            elif filename.lower().endswith('.mov'):
                mime_type = 'video/quicktime'
            
            logger.info(f"提供AI视频文件: {file_path}, MIME类型: {mime_type}")
            return send_file(file_path, mimetype=mime_type)
        else:
            logger.error(f"AI视频文件不存在: {file_path}")
            return jsonify({'error': 'AI视频文件不存在'}), 404
            
    except Exception as e:
        logger.error(f"提供AI视频文件失败: {str(e)}")
        return jsonify({'error': str(e)}), 500 