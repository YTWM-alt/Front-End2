#!/usr/bin/env python3
"""
数据库Web管理工具
==============
提供Web界面来管理数据库
"""

from flask import Flask, render_template, jsonify, request, redirect, url_for, flash, Response, send_from_directory, send_file, abort
from datetime import datetime, timedelta
from rich.console import Console
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import json
import logging
import logging.handlers
import os
from io import StringIO
import csv
import shutil
import re
from PIL import Image, ImageDraw

from app.models.user import User
from app.models.video import Video
from app.models.question import Question
from app.models.feedback import Feedback
from app.config.database import DatabaseConfig, init_database

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # 用于flash消息
console = Console()

# 配置日志
log_dir = os.path.join(os.path.dirname(__file__), 'logs')
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# 配置日志格式
log_formatter = logging.Formatter(
    '%(asctime)s [%(levelname)s] %(module)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# 文件处理器 - 按天轮转
file_handler = logging.handlers.TimedRotatingFileHandler(
    os.path.join(log_dir, 'app.log'),
    when='midnight',
    interval=1,
    backupCount=30,
    encoding='utf-8'
)
file_handler.setFormatter(log_formatter)

# 控制台处理器
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)

# 配置根日志记录器
logger = logging.getLogger()
logger.setLevel(logging.INFO)
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# 静态文件目录配置
video_dir = os.path.join(os.path.dirname(__file__), 'database', 'video')
if not os.path.exists(video_dir):
    os.makedirs(video_dir)

# 配置静态文件目录
app.static_folder = 'static'
app.static_url_path = '/static'

# 确保所有必要的目录存在
for directory in [DATABASE_DIR, USER_DIR, QUESTION_DIR, FEEDBACK_DIR, VIDEO_DIR, LOG_DIR, 'static', 'static/images']:
    if not os.path.exists(directory):
        os.makedirs(directory)

# 复制默认头像
default_avatar = os.path.join(app.static_folder, 'images', 'default-avatar.png')
if not os.path.exists(default_avatar):
    # 如果默认头像不存在，创建一个简单的默认头像
    # 创建一个200x200的灰色头像
    img = Image.new('RGB', (200, 200), color='#cccccc')
    d = ImageDraw.Draw(img)
    
    # 画一个简单的人形图标
    d.ellipse([50, 30, 150, 130], fill='#ffffff')  # 头
    d.rectangle([75, 140, 125, 190], fill='#ffffff')  # 身体
    
    # 保存图片
    img.save(default_avatar)

class DatabaseWebManager:
    """数据库Web管理器"""
    
    def __init__(self):
        """初始化Web管理器"""
        self.console = Console()
        self.db_session = None
        self.connect_db()

    def connect_db(self):
        """连接数据库"""
        try:
            _, SessionLocal = init_database()
            self.db_session = SessionLocal()
            return True
        except Exception as e:
            self.console.print(f"[red]数据库连接失败: {e}[/red]")
            return False

    def get_database_overview(self) -> Optional[Dict[str, Any]]:
        """获取数据库概览"""
        if not self.db_session:
            return None
        
        try:
            stats = {
                'users': self.db_session.query(User).filter_by(is_deleted=False).count(),
                'videos': self.db_session.query(Video).filter_by(is_deleted=False).count(),
                'questions': self.db_session.query(Question).filter_by(is_deleted=False).count(),
                'feedbacks': self.db_session.query(Feedback).filter_by(is_deleted=False).count(),
                'deleted_users': self.db_session.query(User).filter_by(is_deleted=True).count(),
                'deleted_videos': self.db_session.query(Video).filter_by(is_deleted=True).count(),
                'deleted_questions': self.db_session.query(Question).filter_by(is_deleted=True).count(),
                'deleted_feedbacks': self.db_session.query(Feedback).filter_by(is_deleted=True).count(),
            }
            
            # 获取最近7天的活动统计
            week_ago = datetime.utcnow() - timedelta(days=7)
            recent_stats = {
                'new_users': self.db_session.query(User).filter(
                    User.created_at >= week_ago, 
                    User.is_deleted == False
                ).count(),
                'new_videos': self.db_session.query(Video).filter(
                    Video.created_at >= week_ago,
                    Video.is_deleted == False
                ).count(),
                'new_questions': self.db_session.query(Question).filter(
                    Question.created_at >= week_ago,
                    Question.is_deleted == False
                ).count(),
                'new_feedbacks': self.db_session.query(Feedback).filter(
                    Feedback.created_at >= week_ago,
                    Feedback.is_deleted == False
                ).count(),
            }
            
            return {'stats': stats, 'recent': recent_stats}
        except Exception as e:
            self.console.print(f"[red]获取数据库概览失败: {e}[/red]")
            return None

    def get_users(self, limit: int = 50) -> list:
        """获取用户列表"""
        if not self.db_session:
            return []
            
        try:
            users = self.db_session.query(User).filter_by(is_deleted=False).limit(limit).all()
            return [{
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'created_at': user.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                'last_login': user.last_login.strftime("%Y-%m-%d %H:%M:%S") if user.last_login else "从未登录",
                'is_active': "活跃" if user.is_active else "禁用"
            } for user in users]
        except Exception as e:
            self.console.print(f"[red]获取用户列表失败: {e}[/red]")
            return []

    def get_videos(self, limit: int = 50) -> list:
        """获取视频列表"""
        if not self.db_session:
            return []
            
        try:
            videos = self.db_session.query(Video).filter_by(is_deleted=False).limit(limit).all()
            return [{
                'id': video.id,
                'title': video.title,
                'format': video.format,
                'size': f"{video.file_size / 1024 / 1024:.2f}MB",
                'duration': f"{video.duration:.2f}秒",
                'created_at': video.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                'status': video.status
            } for video in videos]
        except Exception as e:
            self.console.print(f"[red]获取视频列表失败: {e}[/red]")
            return []

    def get_questions(self, limit: int = 50) -> list:
        """获取问题列表"""
        if not self.db_session:
            return []
            
        try:
            questions = self.db_session.query(Question).filter_by(is_deleted=False).limit(limit).all()
            return [{
                'id': question.id,
                'title': question.title,
                'status': question.status,
                'priority': question.priority,
                'view_count': question.view_count,
                'created_at': question.created_at.strftime("%Y-%m-%d %H:%M:%S")
            } for question in questions]
        except Exception as e:
            self.console.print(f"[red]获取问题列表失败: {e}[/red]")
            return []

    def get_feedbacks(self, limit: int = 50) -> list:
        """获取反馈列表"""
        if not self.db_session:
            return []
            
        try:
            feedbacks = self.db_session.query(Feedback).filter_by(is_deleted=False).limit(limit).all()
            return [{
                'id': feedback.id,
                'title': feedback.title,
                'type': feedback.type,
                'priority': feedback.priority,
                'status': feedback.status,
                'created_at': feedback.created_at.strftime("%Y-%m-%d %H:%M:%S")
            } for feedback in feedbacks]
        except Exception as e:
            self.console.print(f"[red]获取反馈列表失败: {e}[/red]")
            return []

    def clean_deleted_data(self) -> bool:
        """清理已删除的数据"""
        if not self.db_session:
            return False
            
        try:
            # 执行清理
            self.db_session.query(User).filter_by(is_deleted=True).delete()
            self.db_session.query(Video).filter_by(is_deleted=True).delete()
            self.db_session.query(Question).filter_by(is_deleted=True).delete()
            self.db_session.query(Feedback).filter_by(is_deleted=True).delete()
            self.db_session.commit()
            return True
        except Exception as e:
            self.db_session.rollback()
            self.console.print(f"[red]清理数据失败: {e}[/red]")
            return False

# 创建数据库管理器实例
db_manager = DatabaseWebManager()

@app.route('/')
def index():
    """首页"""
    overview = db_manager.get_database_overview()
    return render_template('index.html', overview=overview)

@app.route('/users')
def users():
    # 获取所有用户信息
    users_list = []
    if os.path.exists(USER_DIR):
        for file in os.listdir(USER_DIR):
            if file.endswith('.txt'):
                try:
                    with open(os.path.join(USER_DIR, file), 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # 解析用户信息
                    user_info = {}
                    current_section = None
                    description = []
                    
                    for line in content.split('\n'):
                        line = line.strip()
                        if not line or line.startswith('==') or line.startswith('--'):
                            continue
                            
                        if ':' in line:
                            key, value = line.split(':', 1)
                            key = key.strip()
                            value = value.strip()
                            user_info[key] = value
                            
                    # 提取邮箱（从文件名或内容）
                    email = user_info.get('邮箱地址') or file.replace('.txt', '')
                    
                    # 构建用户数据
                    user_data = {
                        'id': user_info.get('用户ID') or str(len(users_list) + 1),
                        'name': user_info.get('用户姓名', '未设置'),
                        'email': email,
                        'registered_at': user_info.get('注册时间', '未知'),
                        'last_login_at': user_info.get('最后登录', '从未登录'),
                        'status': user_info.get('账户状态', 'active')
                    }
                    
                    # 添加到用户列表
                    users_list.append(user_data)
                    
                except Exception as e:
                    app.logger.error(f"读取用户文件 {file} 失败: {str(e)}")
                    continue
                    
    # 按ID排序
    users_list.sort(key=lambda x: int(x['id']) if x['id'].isdigit() else float('inf'))
    
    return render_template('users.html', users=users_list)

@app.route('/videos')
def videos():
    """视频管理页面"""
    videos_list = db_manager.get_videos()
    return render_template('videos.html', videos=videos_list)

@app.route('/questions')
def questions():
    """问题管理页面"""
    questions_list = db_manager.get_questions()
    return render_template('questions.html', questions=questions_list)

@app.route('/feedback')
def feedback():
    """反馈管理页面"""
    feedbacks_list = db_manager.get_feedbacks()
    return render_template('feedback.html', feedbacks=feedbacks_list)

@app.route('/api/clean', methods=['POST'])
def clean_data():
    """清理数据API"""
    if db_manager.clean_deleted_data():
        return jsonify({'success': True, 'message': '数据清理成功'})
    return jsonify({'success': False, 'message': '数据清理失败'})

@app.route('/api/export/<table>')
def export_data(table):
    """导出数据API"""
    data = None
    if table == 'users':
        data = db_manager.get_users(limit=1000)
    elif table == 'videos':
        data = db_manager.get_videos(limit=1000)
    elif table == 'questions':
        data = db_manager.get_questions(limit=1000)
    elif table == 'feedback':
        data = db_manager.get_feedbacks(limit=1000)
    else:
        return jsonify({'success': False, 'message': '无效的表名'})
    
    if data is not None:
        return jsonify({
            'success': True,
            'data': data,
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
    return jsonify({'success': False, 'message': '获取数据失败'})

@app.route('/api/videos/<int:video_id>/delete', methods=['POST'])
def delete_video(video_id):
    """删除视频"""
    if not db_manager.db_session:
        return jsonify({'success': False, 'message': '数据库连接失败'})
        
    try:
        video = db_manager.db_session.query(Video).filter_by(id=video_id, is_deleted=False).first()
        if not video:
            return jsonify({'success': False, 'message': '视频不存在'})
            
        # 软删除视频
        video.is_deleted = True
        video.deleted_at = datetime.now()
        db_manager.db_session.commit()
        
        return jsonify({'success': True, 'message': '视频删除成功'})
    except Exception as e:
        db_manager.db_session.rollback()
        return jsonify({'success': False, 'message': f'删除失败：{str(e)}'})

@app.route('/api/videos/<int:video_id>/update', methods=['POST'])
def update_video(video_id):
    """更新视频信息"""
    if not db_manager.db_session:
        return jsonify({'success': False, 'message': '数据库连接失败'})
        
    try:
        video = db_manager.db_session.query(Video).filter_by(id=video_id, is_deleted=False).first()
        if not video:
            return jsonify({'success': False, 'message': '视频不存在'})
            
        data = request.json
        if 'title' in data:
            video.title = data['title']
        if 'description' in data:
            video.description = data['description']
        if 'status' in data:
            video.status = data['status']
            
        video.updated_at = datetime.now()
        db_manager.db_session.commit()
        
        return jsonify({'success': True, 'message': '视频信息更新成功'})
    except Exception as e:
        db_manager.db_session.rollback()
        return jsonify({'success': False, 'message': f'更新失败：{str(e)}'})

@app.route('/api/videos/<int:video_id>/play')
def play_video(video_id):
    """获取视频播放信息"""
    try:
        video = db_manager.db_session.query(Video).filter_by(id=video_id, is_deleted=False).first()
        if not video:
            return jsonify({
                'success': False,
                'message': '视频不存在'
            })
            
        # 增加播放次数
        video.view_count += 1
        db_manager.db_session.commit()
        
        # 只返回文件名，不包含完整路径
        file_name = os.path.basename(video.file_path)
        
        return jsonify({
            'success': True,
            'video': {
                'id': video.id,
                'title': video.title,
                'file_path': file_name,
                'format': video.format,
                'duration': video.duration,
                'view_count': video.view_count
            }
        })
    except Exception as e:
        logger.error(f"获取视频信息失败: {str(e)}", exc_info=True)
        db_manager.db_session.rollback()
        return jsonify({
            'success': False,
            'message': f'获取视频信息失败：{str(e)}'
        })

@app.route('/logs')
def view_logs():
    """查看日志页面"""
    try:
        # 获取筛选参数
        level = request.args.get('level', 'all')
        date = request.args.get('date')
        keyword = request.args.get('keyword', '').strip()
        
        # 读取日志文件
        logs = read_logs(level, date, keyword)
        
        return render_template('logs.html', logs=logs)
    except Exception as e:
        logger.error(f"查看日志页面失败: {str(e)}", exc_info=True)
        return render_template('error.html', message='加载日志页面失败')

@app.route('/api/logs/filter')
def filter_logs():
    """筛选日志API"""
    try:
        level = request.args.get('level', 'all')
        date = request.args.get('date')
        keyword = request.args.get('keyword', '').strip()
        
        logs = read_logs(level, date, keyword)
        
        return jsonify({
            'success': True,
            'logs': logs
        })
    except Exception as e:
        logger.error(f"筛选日志失败: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': '筛选日志失败'
        })

@app.route('/api/logs/<log_id>')
def get_log_detail(log_id):
    """获取日志详情API"""
    try:
        # 从日志文件中查找指定ID的日志
        log = find_log_by_id(log_id)
        
        if not log:
            return jsonify({
                'success': False,
                'message': '日志不存在'
            })
        
        return jsonify({
            'success': True,
            'log': log
        })
    except Exception as e:
        logger.error(f"获取日志详情失败: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': '获取日志详情失败'
        })

@app.route('/api/logs/clear', methods=['POST'])
def clear_logs():
    """清空日志API"""
    try:
        # 备份当前日志文件
        backup_dir = os.path.join(log_dir, 'backup')
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)
        
        backup_file = os.path.join(
            backup_dir,
            f'app.log.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
        )
        
        log_file = os.path.join(log_dir, 'app.log')
        if os.path.exists(log_file):
            os.rename(log_file, backup_file)
        
        # 创建新的日志文件
        open(log_file, 'a').close()
        
        logger.info("日志已清空")
        
        return jsonify({
            'success': True,
            'message': '日志已清空'
        })
    except Exception as e:
        logger.error(f"清空日志失败: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': '清空日志失败'
        })

@app.route('/api/logs/export')
def export_logs():
    """导出日志API"""
    try:
        level = request.args.get('level', 'all')
        date = request.args.get('date')
        keyword = request.args.get('keyword', '').strip()
        
        logs = read_logs(level, date, keyword)
        
        # 生成CSV文件
        output = StringIO()
        writer = csv.writer(output)
        
        # 写入表头
        writer.writerow(['时间', '级别', '模块', '消息', '堆栈跟踪'])
        
        # 写入数据
        for log in logs:
            writer.writerow([
                log['timestamp'],
                log['level'],
                log['module'],
                log['message'],
                log.get('stack_trace', '')
            ])
        
        # 设置响应头
        headers = {
            'Content-Type': 'text/csv',
            'Content-Disposition': f'attachment; filename=logs_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        }
        
        return Response(
            output.getvalue(),
            headers=headers
        )
    except Exception as e:
        logger.error(f"导出日志失败: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': '导出日志失败'
        })

@app.route('/videos/<path:filename>')
def serve_video(filename):
    """提供视频文件访问"""
    try:
        return send_from_directory(video_dir, filename)
    except Exception as e:
        logger.error(f"访问视频文件失败: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': '视频文件不存在或无法访问'
        }), 404

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        
        # 验证必填字段
        if not name or not email or not password:
            return jsonify({
                'success': False,
                'message': '姓名、邮箱和密码都是必填项'
            }), 400
        
        # 验证邮箱格式
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return jsonify({
                'success': False,
                'message': '邮箱格式不正确'
            }), 400
        
        # 检查用户是否已存在
        user_file = os.path.join(USER_DIR, f"{email}.txt")
        if os.path.exists(user_file):
            return jsonify({
                'success': False,
                'message': '该邮箱已被注册'
            }), 409
        
        # 生成用户ID
        user_id = email.replace('@', '_').replace('.', '_')
        
        # 准备用户信息
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        user_info = f"""用户注册信息
====================

用户ID: {user_id}
用户姓名: {name}
邮箱地址: {email}
密码: {password}
注册时间: {now}
最后登录: 从未登录
账户状态: active

-------------------
此文件由数据库管理工具自动生成
生成时间: {now}
"""
        
        # 确保用户目录存在
        os.makedirs(USER_DIR, exist_ok=True)
        
        # 保存用户信息
        with open(user_file, 'w', encoding='utf-8') as f:
            f.write(user_info)
        
        app.logger.info(f"新用户注册成功: {name} ({email})")
        
        return jsonify({
            'success': True,
            'message': '注册成功',
            'data': {
                'id': user_id,
                'name': name,
                'email': email,
                'registered_at': now
            }
        }), 201
        
    except Exception as e:
        app.logger.error(f"用户注册失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': '注册失败，请稍后重试'
        }), 500

def read_logs(level='all', date=None, keyword=None):
    """读取并解析日志文件"""
    logs = []
    log_file = os.path.join(log_dir, 'app.log')
    
    if not os.path.exists(log_file):
        return logs
    
    try:
        with open(log_file, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    # 解析日志行
                    log = parse_log_line(line)
                    if not log:
                        continue
                    
                    # 应用筛选条件
                    if level != 'all' and log['level'].lower() != level.lower():
                        continue
                    
                    if date and not log['timestamp'].startswith(date):
                        continue
                    
                    if keyword and keyword.lower() not in line.lower():
                        continue
                    
                    logs.append(log)
                except Exception as e:
                    logger.error(f"解析日志行失败: {str(e)}", exc_info=True)
                    continue
    except Exception as e:
        logger.error(f"读取日志文件失败: {str(e)}", exc_info=True)
    
    return logs

def parse_log_line(line):
    """解析单行日志"""
    try:
        # 示例日志格式：2024-03-14 10:30:45 [INFO] module_name: message
        parts = line.split(' ', 3)
        if len(parts) < 4:
            return None
        
        date, time, level, rest = parts
        level = level.strip('[]')
        
        # 解析模块和消息
        module_parts = rest.split(':', 1)
        if len(module_parts) < 2:
            module = 'unknown'
            message = rest
        else:
            module, message = module_parts
        
        return {
            'id': generate_log_id(date, time),
            'timestamp': f'{date} {time}',
            'level': level.lower(),
            'module': module.strip(),
            'message': message.strip()
        }
    except Exception:
        return None

def generate_log_id(date, time):
    """生成日志ID"""
    timestamp = f'{date}_{time}'.replace(':', '').replace('-', '')
    return f'log_{timestamp}_{os.urandom(4).hex()}'

def find_log_by_id(log_id):
    """根据ID查找日志"""
    logs = read_logs()
    return next((log for log in logs if log['id'] == log_id), None)

def main():
    """主函数"""
    print("=== 数据库Web管理工具 ===\n")
    print("🚀 启动Web服务器...")
    app.run(host='0.0.0.0', port=5001, debug=True)

if __name__ == "__main__":
    main() 