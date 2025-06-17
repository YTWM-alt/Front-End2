from flask import Blueprint, request, jsonify, current_app
import pymysql
import logging
import json
from datetime import datetime
import os
import uuid
import subprocess
import hashlib
from werkzeug.utils import secure_filename

admin_bp = Blueprint('admin', __name__)

def hash_password(password):
    """生成密码哈希值"""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

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
        logging.error(f"数据库连接失败: {e}")
        return None

def execute_query(query, params=None, fetch=True):
    """执行数据库查询"""
    connection = get_db_connection()
    if not connection:
        return None
    
    try:
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute(query, params)
            if fetch:
                result = cursor.fetchall()
                connection.close()
                return result
            else:
                connection.commit()
                connection.close()
                return cursor.rowcount
    except Exception as e:
        logging.error(f"查询执行失败: {e}")
        connection.close()
        return None

def get_video_duration(file_path):
    """使用ffmpeg获取视频时长"""
    try:
        # 使用ffprobe获取视频信息
        cmd = [
            'ffprobe', 
            '-v', 'quiet', 
            '-print_format', 'json', 
            '-show_format', 
            file_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            import json
            info = json.loads(result.stdout)
            duration = float(info['format']['duration'])
            logging.info(f"获取视频时长成功: {duration}秒")
            return duration
        else:
            logging.error(f"ffprobe执行失败: {result.stderr}")
            return None
            
    except subprocess.TimeoutExpired:
        logging.error("获取视频时长超时")
        return None
    except Exception as e:
        logging.error(f"获取视频时长失败: {e}")
        return None

@admin_bp.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """获取仪表板统计数据"""
    try:
        stats = {}
        
        # 用户统计
        users_query = "SELECT COUNT(*) as total, COUNT(CASE WHEN is_active = 1 THEN 1 END) as active FROM users WHERE is_deleted = 0"
        users_result = execute_query(users_query)
        if users_result and users_result[0]:
            user_stats = users_result[0]
            stats['users'] = {
                'total': int(user_stats['total']),
                'active': int(user_stats['active'])
            }
        else:
            stats['users'] = {'total': 0, 'active': 0}
        
        # 问题统计
        questions_query = """
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'answered' THEN 1 END) as answered
        FROM questions WHERE is_deleted = 0
        """
        questions_result = execute_query(questions_query)
        if questions_result and questions_result[0]:
            question_stats = questions_result[0]
            stats['questions'] = {
                'total': int(question_stats['total']),
                'pending': int(question_stats['pending']),
                'answered': int(question_stats['answered'])
            }
        else:
            stats['questions'] = {'total': 0, 'pending': 0, 'answered': 0}
        
        # 视频统计
        videos_query = """
        SELECT 
            COUNT(*) as total,
            COALESCE(SUM(file_size), 0) as total_size,
            COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready
        FROM videos WHERE is_deleted = 0
        """
        videos_result = execute_query(videos_query)
        if videos_result and videos_result[0]:
            video_stats = videos_result[0]
            # 转换Decimal类型为int
            stats['videos'] = {
                'total': int(video_stats['total']),
                'total_size': int(video_stats['total_size']) if video_stats['total_size'] else 0,
                'ready': int(video_stats['ready'])
            }
        else:
            stats['videos'] = {'total': 0, 'total_size': 0, 'ready': 0}
        
        # 反馈统计
        feedbacks_query = """
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
            COUNT(CASE WHEN priority = 'HIGH' THEN 1 END) as high_priority
        FROM feedbacks WHERE is_deleted = 0
        """
        feedbacks_result = execute_query(feedbacks_query)
        if feedbacks_result and feedbacks_result[0]:
            feedback_stats = feedbacks_result[0]
            stats['feedbacks'] = {
                'total': int(feedback_stats['total']),
                'pending': int(feedback_stats['pending']),
                'high_priority': int(feedback_stats['high_priority'])
            }
        else:
            stats['feedbacks'] = {'total': 0, 'pending': 0, 'high_priority': 0}
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        logging.error(f"获取统计数据失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/users', methods=['GET'])
def get_users():
    """获取用户列表"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '')
        
        offset = (page - 1) * per_page
        
        where_clause = "WHERE is_deleted = 0"
        params = []
        
        if search:
            where_clause += " AND (username LIKE %s OR email LIKE %s OR nickname LIKE %s)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param])
        
        # 获取总数
        count_query = f"SELECT COUNT(*) as total FROM users {where_clause}"
        count_result = execute_query(count_query, params)
        total = count_result[0]['total'] if count_result else 0
        
        # 获取用户列表
        users_query = f"""
        SELECT id, username, email, 
               COALESCE(nickname, '') as real_name,
               CASE 
                   WHEN is_active = 1 THEN 'active' 
                   ELSE 'inactive' 
               END as status,
               'student' as role,
               is_active, last_login, login_count, 
               created_at, phone, bio, password
        FROM users {where_clause}
        ORDER BY created_at DESC
        LIMIT %s OFFSET %s
        """
        params.extend([per_page, offset])
        
        users = execute_query(users_query, params)
        
        return jsonify({
            'success': True,
            'data': {
                'users': users or [],
                'total': total,
                'current_page': page,
                'per_page': per_page,
                'total_pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        logging.error(f"获取用户列表失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """删除用户"""
    try:
        query = "UPDATE users SET is_deleted = 1, deleted_at = %s WHERE id = %s"
        result = execute_query(query, [datetime.now(), user_id], fetch=False)
        
        if result and result > 0:
            return jsonify({'success': True, 'message': '用户删除成功'})
        else:
            return jsonify({'success': False, 'message': '用户不存在'}), 404
            
    except Exception as e:
        logging.error(f"删除用户失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/users', methods=['POST'])
def create_user():
    """创建新用户"""
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'message': '无效的请求数据'}), 400
        
        # 验证必填字段
        if not data.get('username') or not data.get('email'):
            return jsonify({'success': False, 'message': '用户名和邮箱是必填字段'}), 400
        
        # 验证密码字段
        if not data.get('password'):
            return jsonify({'success': False, 'message': '密码是必填字段'}), 400
        
        # 检查用户名和邮箱是否已存在
        check_query = "SELECT id FROM users WHERE (username = %s OR email = %s) AND is_deleted = 0"
        existing = execute_query(check_query, [data['username'], data['email']])
        if existing:
            return jsonify({'success': False, 'message': '用户名或邮箱已存在'}), 400
        
        # 创建新用户
        insert_query = """
        INSERT INTO users (username, email, password_hash, password, nickname, phone, bio,
                          is_active, created_at, updated_at, login_count, is_deleted)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        now = datetime.now()
        is_active = 1 if data.get('status', 'active') == 'active' else 0
        password_hash = hash_password(data['password'])  # 生成密码哈希
        
        params = [
            data['username'],
            data['email'], 
            password_hash,
            data['password'],  # 存储原始密码
            data.get('real_name', ''),
            data.get('phone', ''),
            data.get('bio', ''),
            is_active,
            now,
            now,
            0,
            0  # is_deleted = 0 (未删除)
        ]
        
        result = execute_query(insert_query, params, fetch=False)
        
        if result and result > 0:
            return jsonify({'success': True, 'message': '用户创建成功'})
        else:
            return jsonify({'success': False, 'message': '用户创建失败'}), 500
            
    except Exception as e:
        logging.error(f"创建用户失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """更新用户"""
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'message': '无效的请求数据'}), 400
        
        # 构建更新字段
        update_fields = []
        params = []
        
        if 'username' in data:
            update_fields.append('username = %s')
            params.append(data['username'])
        
        if 'email' in data:
            update_fields.append('email = %s')
            params.append(data['email'])
        
        if 'real_name' in data:
            update_fields.append('nickname = %s')
            params.append(data['real_name'])
        
        if 'phone' in data:
            update_fields.append('phone = %s')
            params.append(data['phone'])
        
        if 'bio' in data:
            update_fields.append('bio = %s')
            params.append(data['bio'])
        
        # 处理密码字段
        if 'password' in data and data['password']:  # 只有当密码不为空时才更新
            update_fields.append('password_hash = %s')
            params.append(hash_password(data['password']))
            update_fields.append('password = %s')
            params.append(data['password'])
        
        # 处理状态字段
        if 'status' in data:
            if data['status'] == 'active':
                update_fields.append('is_active = %s')
                params.append(1)
            elif data['status'] == 'inactive':
                update_fields.append('is_active = %s')
                params.append(0)
        
        if 'is_active' in data:
            update_fields.append('is_active = %s')
            params.append(data['is_active'])
        
        # 注意：role字段目前数据库中可能没有，这里先忽略
        # if 'role' in data:
        #     update_fields.append('role = %s')
        #     params.append(data['role'])
        
        if not update_fields:
            return jsonify({'success': False, 'message': '没有要更新的字段'}), 400
        
        update_fields.append('updated_at = %s')
        params.append(datetime.now())
        params.append(user_id)
        
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s AND is_deleted = 0"
        result = execute_query(query, params, fetch=False)
        
        if result and result > 0:
            return jsonify({'success': True, 'message': '用户更新成功'})
        else:
            return jsonify({'success': False, 'message': '用户不存在'}), 404
            
    except Exception as e:
        logging.error(f"更新用户失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/questions', methods=['GET'])
def get_questions():
    """获取问题列表"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        grade_level = request.args.get('grade_level', '')
        subject = request.args.get('subject', '')
        
        offset = (page - 1) * per_page
        
        where_clause = "WHERE q.is_deleted = 0"
        params = []
        
        if search:
            where_clause += " AND (q.title LIKE %s OR q.content LIKE %s)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param])
        
        if status:
            where_clause += " AND q.status = %s"
            params.append(status)
        
        if grade_level:
            where_clause += " AND q.grade_level = %s"
            params.append(grade_level)
        
        if subject:
            where_clause += " AND q.subject = %s"
            params.append(subject)
        
        # 获取总数
        count_query = f"SELECT COUNT(*) as total FROM questions q {where_clause}"
        count_result = execute_query(count_query, params)
        total = count_result[0]['total'] if count_result else 0
        
        # 获取问题列表
        questions_query = f"""
        SELECT q.id, q.title, q.content, q.status, q.priority, q.view_count, 
               q.answer_count, q.category, q.grade_level, q.subject, 
               q.created_at, u.username as user_name
        FROM questions q
        LEFT JOIN users u ON q.user_id = u.id
        {where_clause}
        ORDER BY q.created_at DESC
        LIMIT %s OFFSET %s
        """
        params.extend([per_page, offset])
        
        questions = execute_query(questions_query, params)
        
        return jsonify({
            'success': True,
            'data': {
                'questions': questions or [],
                'total': total,
                'page': page,
                'per_page': per_page,
                'pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        logging.error(f"获取问题列表失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/questions/<int:question_id>', methods=['DELETE'])
def delete_question(question_id):
    """删除问题"""
    try:
        query = "UPDATE questions SET is_deleted = 1, deleted_at = %s WHERE id = %s"
        result = execute_query(query, [datetime.now(), question_id], fetch=False)
        
        if result and result > 0:
            return jsonify({'success': True, 'message': '问题删除成功'})
        else:
            return jsonify({'success': False, 'message': '问题不存在'}), 404
            
    except Exception as e:
        logging.error(f"删除问题失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/questions', methods=['POST'])
def create_question():
    """创建新问题"""
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'message': '无效的请求数据'}), 400
        
        # 验证必填字段
        if not data.get('title') or not data.get('content'):
            return jsonify({'success': False, 'message': '标题和内容是必填字段'}), 400
        
        # 创建新问题
        insert_query = """
        INSERT INTO questions (title, content, user_id, status, priority, grade_level, 
                              subject, category, view_count, answer_count, created_at, updated_at, is_deleted)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        now = datetime.now()
        
        params = [
            data['title'],
            data['content'],
            data.get('user_id', 1),  # 默认用户ID为1，实际使用时应该从登录用户获取
            data.get('status', 'pending'),
            data.get('priority', 0),
            data.get('grade_level', ''),
            data.get('subject', ''),
            data.get('category', ''),
            0,  # 初始浏览次数
            0,  # 初始回答数量
            now,
            now,
            0  # is_deleted = 0 (未删除)
        ]
        
        result = execute_query(insert_query, params, fetch=False)
        
        if result and result > 0:
            return jsonify({'success': True, 'message': '问题创建成功'})
        else:
            return jsonify({'success': False, 'message': '问题创建失败'}), 500
            
    except Exception as e:
        logging.error(f"创建问题失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/questions/<int:question_id>', methods=['PUT'])
def update_question(question_id):
    """更新问题"""
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'message': '无效的请求数据'}), 400
        
        # 构建更新字段
        update_fields = []
        params = []
        
        if 'title' in data:
            update_fields.append('title = %s')
            params.append(data['title'])
        
        if 'content' in data:
            update_fields.append('content = %s')
            params.append(data['content'])
        
        if 'grade_level' in data:
            update_fields.append('grade_level = %s')
            params.append(data['grade_level'])
        
        if 'subject' in data:
            update_fields.append('subject = %s')
            params.append(data['subject'])
        
        if 'status' in data:
            update_fields.append('status = %s')
            params.append(data['status'])
        
        if not update_fields:
            return jsonify({'success': False, 'message': '没有要更新的字段'}), 400
        
        update_fields.append('updated_at = %s')
        params.append(datetime.now())
        params.append(question_id)
        
        query = f"UPDATE questions SET {', '.join(update_fields)} WHERE id = %s AND is_deleted = 0"
        result = execute_query(query, params, fetch=False)
        
        if result and result > 0:
            return jsonify({'success': True, 'message': '问题更新成功'})
        else:
            return jsonify({'success': False, 'message': '问题不存在'}), 404
            
    except Exception as e:
        logging.error(f"更新问题失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/videos', methods=['GET'])
def get_videos():
    """获取视频列表"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        
        offset = (page - 1) * per_page
        
        where_clause = "WHERE v.is_deleted = 0"
        params = []
        
        if search:
            where_clause += " AND (v.title LIKE %s OR v.description LIKE %s)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param])
        
        if status:
            where_clause += " AND v.status = %s"
            params.append(status)
        
        # 获取总数
        count_query = f"SELECT COUNT(*) as total FROM videos v {where_clause}"
        count_result = execute_query(count_query, params)
        total = count_result[0]['total'] if count_result else 0
        
        # 获取视频列表
        videos_query = f"""
        SELECT v.id, v.title, v.description, v.file_path, v.file_size, 
               v.duration, v.format, v.status, v.view_count, v.like_count,
               v.upload_time, u.username as user_name
        FROM videos v
        LEFT JOIN users u ON v.user_id = u.id
        {where_clause}
        ORDER BY v.upload_time DESC
        LIMIT %s OFFSET %s
        """
        params.extend([per_page, offset])
        
        videos = execute_query(videos_query, params)
        
        # 格式化文件大小
        if videos:
            for video in videos:
                if video['file_size']:
                    size_mb = video['file_size'] / (1024 * 1024)
                    video['file_size_mb'] = round(size_mb, 2)
        
        return jsonify({
            'success': True,
            'data': {
                'videos': videos or [],
                'total': total,
                'page': page,
                'per_page': per_page,
                'pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        logging.error(f"获取视频列表失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/videos/<int:video_id>', methods=['DELETE'])
def delete_video(video_id):
    """删除视频"""
    try:
        query = "UPDATE videos SET is_deleted = 1, deleted_at = %s WHERE id = %s"
        result = execute_query(query, [datetime.now(), video_id], fetch=False)
        
        if result and result > 0:
            return jsonify({'success': True, 'message': '视频删除成功'})
        else:
            return jsonify({'success': False, 'message': '视频不存在'}), 404
            
    except Exception as e:
        logging.error(f"删除视频失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/videos/<int:video_id>', methods=['PUT'])
def update_video(video_id):
    """更新视频"""
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'message': '无效的请求数据'}), 400
        
        # 构建更新字段
        update_fields = []
        params = []
        
        if 'title' in data:
            update_fields.append('title = %s')
            params.append(data['title'])
        
        if 'description' in data:
            update_fields.append('description = %s')
            params.append(data['description'])
        
        if 'status' in data:
            update_fields.append('status = %s')
            params.append(data['status'])
        
        if not update_fields:
            return jsonify({'success': False, 'message': '没有要更新的字段'}), 400
        
        update_fields.append('updated_at = %s')
        params.append(datetime.now())
        params.append(video_id)
        
        query = f"UPDATE videos SET {', '.join(update_fields)} WHERE id = %s AND is_deleted = 0"
        result = execute_query(query, params, fetch=False)
        
        if result and result > 0:
            return jsonify({'success': True, 'message': '视频更新成功'})
        else:
            return jsonify({'success': False, 'message': '视频不存在'}), 404
            
    except Exception as e:
        logging.error(f"更新视频失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/videos', methods=['POST'])
def create_video():
    """上传新视频"""
    try:
        # 检查是否有文件在请求中
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': '没有文件被上传'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'message': '没有选择文件'}), 400
        
        # 检查文件类型
        allowed_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm'}
        filename = secure_filename(file.filename)
        file_ext = os.path.splitext(filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            return jsonify({'success': False, 'message': '不支持的文件格式'}), 400
        
        # 生成唯一文件名
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        
        # 确保上传目录存在
        upload_dir = os.path.join(current_app.root_path, '..', 'static', 'videos')
        os.makedirs(upload_dir, exist_ok=True)
        
        # 保存文件
        file_path = os.path.join(upload_dir, unique_filename)
        file.save(file_path)
        
        # 获取文件信息
        file_size = os.path.getsize(file_path)
        
        # 获取视频时长
        duration = get_video_duration(file_path)
        logging.info(f"视频文件 {unique_filename} 时长: {duration}秒")
        
        # 生成默认标题（基于原文件名）
        original_name = os.path.splitext(filename)[0]
        title = original_name or f"视频_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # 根据时长获取是否成功确定状态
        video_status = 'ready' if duration is not None else 'processing'
        
        # 插入数据库记录
        insert_query = """
        INSERT INTO videos (title, description, file_path, file_size, format, duration,
                           status, user_id, upload_time, created_at, updated_at, is_deleted,
                           view_count, like_count, comment_count)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        now = datetime.now()
        relative_path = f"static/videos/{unique_filename}"
        
        params = [
            title,
            f"上传的视频文件: {filename}",  # 默认描述
            relative_path,
            file_size,
            file_ext[1:],  # 去掉点号
            duration,  # 视频时长
            video_status,  # 根据时长获取结果设置状态
            1,  # 默认用户ID，实际使用时应该从登录用户获取
            now,
            now,
            now,
            0,  # is_deleted = 0 (未删除)
            0,  # view_count = 0
            0,  # like_count = 0
            0   # comment_count = 0
        ]
        
        connection = get_db_connection()
        if not connection:
            # 如果数据库连接失败，删除已上传的文件
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'success': False, 'message': '数据库连接失败'}), 500
        
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(insert_query, params)
                video_id = cursor.lastrowid
                connection.commit()
                
                # 获取刚创建的视频信息
                select_query = "SELECT id, title, description, status FROM videos WHERE id = %s"
                cursor.execute(select_query, [video_id])
                video_info = cursor.fetchone()
                
                return jsonify({
                    'success': True, 
                    'message': '视频上传成功',
                    'video': video_info
                })
                
        except Exception as e:
            logging.error(f"数据库插入失败: {e}")
            # 如果数据库操作失败，删除已上传的文件
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'success': False, 'message': f'数据库操作失败: {str(e)}'}), 500
        finally:
            connection.close()
            
    except Exception as e:
        logging.error(f"视频上传失败: {e}")
        return jsonify({'success': False, 'message': f'上传失败: {str(e)}'}), 500

@admin_bp.route('/feedbacks', methods=['GET'])
def get_feedbacks():
    """获取反馈列表"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        priority = request.args.get('priority', '')
        
        offset = (page - 1) * per_page
        
        where_clause = "WHERE f.is_deleted = 0"
        params = []
        
        if search:
            where_clause += " AND (f.title LIKE %s OR f.content LIKE %s)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param])
        
        if status:
            where_clause += " AND f.status = %s"
            params.append(status)
        
        if priority:
            where_clause += " AND f.priority = %s"
            params.append(priority)
        
        # 获取总数
        count_query = f"SELECT COUNT(*) as total FROM feedbacks f {where_clause}"
        count_result = execute_query(count_query, params)
        total = count_result[0]['total'] if count_result else 0
        
        # 获取反馈列表
        feedbacks_query = f"""
        SELECT f.id, f.title, f.content, f.type, f.status, f.priority,
               f.handle_note, f.handle_time, f.created_at, 
               u.username as user_name, h.username as handler_name
        FROM feedbacks f
        LEFT JOIN users u ON f.user_id = u.id
        LEFT JOIN users h ON f.handler_id = h.id
        {where_clause}
        ORDER BY f.created_at DESC
        LIMIT %s OFFSET %s
        """
        params.extend([per_page, offset])
        
        feedbacks = execute_query(feedbacks_query, params)
        
        return jsonify({
            'success': True,
            'data': {
                'feedbacks': feedbacks or [],
                'total': total,
                'page': page,
                'per_page': per_page,
                'pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        logging.error(f"获取反馈列表失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/feedbacks/<int:feedback_id>', methods=['DELETE'])
def delete_feedback(feedback_id):
    """删除反馈"""
    try:
        query = "UPDATE feedbacks SET is_deleted = 1, deleted_at = %s WHERE id = %s"
        result = execute_query(query, [datetime.now(), feedback_id], fetch=False)
        
        if result and result > 0:
            return jsonify({'success': True, 'message': '反馈删除成功'})
        else:
            return jsonify({'success': False, 'message': '反馈不存在'}), 404
            
    except Exception as e:
        logging.error(f"删除反馈失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/feedbacks', methods=['POST'])
def create_feedback():
    """创建新反馈"""
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'message': '无效的请求数据'}), 400
        
        # 验证必填字段
        if not data.get('content'):
            return jsonify({'success': False, 'message': '反馈内容是必填字段'}), 400
        
        # 创建新反馈
        insert_query = """
        INSERT INTO feedbacks (title, content, user_id, type, status, priority, 
                              created_at, updated_at, is_deleted)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        now = datetime.now()
        
        # 自动生成标题（使用内容的前30个字符）
        content = data['content']
        auto_title = content[:30] + ('...' if len(content) > 30 else '')
        
        params = [
            auto_title,  # 使用自动生成的标题
            content,
            data.get('user_id', 1),  # 默认用户ID为1，实际使用时应该从登录用户获取
            data.get('type', 'OTHER'),
            data.get('status', 'PENDING'),
            data.get('priority', 'MEDIUM'),
            now,
            now,
            0  # is_deleted = 0 (未删除)
        ]
        
        result = execute_query(insert_query, params, fetch=False)
        
        if result and result > 0:
            return jsonify({'success': True, 'message': '反馈创建成功'})
        else:
            return jsonify({'success': False, 'message': '反馈创建失败'}), 500
            
    except Exception as e:
        logging.error(f"创建反馈失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/feedbacks/<int:feedback_id>', methods=['PUT'])
def update_feedback(feedback_id):
    """更新反馈"""
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'message': '无效的请求数据'}), 400
        
        # 构建更新字段
        update_fields = []
        params = []
        
        if 'title' in data:
            update_fields.append('title = %s')
            params.append(data['title'])
        
        if 'content' in data:
            update_fields.append('content = %s')
            params.append(data['content'])
        
        if 'type' in data:
            update_fields.append('type = %s')
            params.append(data['type'])
        
        if 'priority' in data:
            update_fields.append('priority = %s')
            params.append(data['priority'])
        
        if 'status' in data:
            update_fields.append('status = %s')
            params.append(data['status'])
        
        if not update_fields:
            return jsonify({'success': False, 'message': '没有要更新的字段'}), 400
        
        update_fields.append('updated_at = %s')
        params.append(datetime.now())
        params.append(feedback_id)
        
        query = f"UPDATE feedbacks SET {', '.join(update_fields)} WHERE id = %s AND is_deleted = 0"
        result = execute_query(query, params, fetch=False)
        
        if result and result > 0:
            return jsonify({'success': True, 'message': '反馈更新成功'})
        else:
            return jsonify({'success': False, 'message': '反馈不存在'}), 404
            
    except Exception as e:
        logging.error(f"更新反馈失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/static/video/<filename>')
def serve_video(filename):
    """提供视频文件服务 - 支持HTTP Range请求进行流式播放"""
    try:
        # 使用本地的视频存储目录
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        video_dir = os.path.join(backend_dir, 'static', 'videos')
        
        file_path = os.path.join(video_dir, filename)
        
        if not os.path.exists(file_path):
            logging.error(f"File not found: {file_path}")
            return jsonify({'success': False, 'message': f'视频文件不存在: {file_path}'}), 404
            
        file_size = os.path.getsize(file_path)
        
        # 检查是否是Range请求 - 支持视频流式播放
        range_header = request.headers.get('Range')
        
        if range_header:
            # 解析Range头：bytes=start-end
            import re
            range_match = re.search(r'bytes=(\d+)-(\d*)', range_header)
            if range_match:
                start = int(range_match.group(1))
                end = int(range_match.group(2)) if range_match.group(2) else file_size - 1
                
                # 确保范围有效
                start = max(0, start)
                end = min(file_size - 1, end)
                content_length = end - start + 1
                
                # 读取指定范围的数据
                with open(file_path, 'rb') as f:
                    f.seek(start)
                    data = f.read(content_length)
                
                from flask import Response
                
                # 返回部分内容响应
                response = Response(
                    data,
                    206,  # Partial Content
                    headers={
                        'Content-Range': f'bytes {start}-{end}/{file_size}',
                        'Accept-Ranges': 'bytes',
                        'Content-Length': str(content_length),
                        'Content-Type': 'video/mp4',
                        'Cache-Control': 'public, max-age=3600',  # 缓存1小时
                        'ETag': f'"{filename}-{file_size}"',
                        'Last-Modified': datetime.fromtimestamp(os.path.getmtime(file_path)).strftime('%a, %d %b %Y %H:%M:%S GMT')
                    }
                )
                return response
        
        # 如果不是Range请求，返回完整文件
        from flask import send_from_directory
        
        # 添加缓存头
        response = send_from_directory(video_dir, filename, as_attachment=False)
        response.headers['Cache-Control'] = 'public, max-age=3600'
        response.headers['Accept-Ranges'] = 'bytes'
        response.headers['ETag'] = f'"{filename}-{file_size}"'
        response.headers['Last-Modified'] = datetime.fromtimestamp(os.path.getmtime(file_path)).strftime('%a, %d %b %Y %H:%M:%S GMT')
        
        return response
        
    except Exception as e:
        logging.error(f"提供视频文件失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 404

@admin_bp.route('/videos/<int:video_id>/stream', methods=['GET'])
def stream_video(video_id):
    """获取视频流地址 - 优化版本支持流式播放"""
    try:
        query = """
        SELECT file_path, file_size, duration, format, title 
        FROM videos 
        WHERE id = %s AND is_deleted = 0 AND status = 'ready'
        """
        result = execute_query(query, [video_id])
        
        if result and len(result) > 0:
            video_info = result[0]
            file_path = video_info['file_path']
            filename = os.path.basename(file_path)
            
            # 检查文件是否实际存在
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            video_dir = os.path.join(backend_dir, 'static', 'videos')
            full_file_path = os.path.join(video_dir, filename)
            
            if not os.path.exists(full_file_path):
                return jsonify({
                    'success': False, 
                    'message': '视频文件不存在，可能已被移动或删除'
                }), 404
            
            return jsonify({
                'success': True,
                'data': {
                    'video_url': f'/api/static/video/{filename}',
                    'file_path': file_path,
                    'file_size': video_info.get('file_size', 0),
                    'duration': video_info.get('duration', 0),
                    'format': video_info.get('format', 'mp4'),
                    'title': video_info.get('title', '未知视频'),
                    'supports_range': True,  # 标识支持Range请求
                    'cache_hint': 'aggressive'  # 建议激进缓存策略
                }
            })
        else:
            return jsonify({
                'success': False, 
                'message': '视频不存在或未就绪'
            }), 404
            
    except Exception as e:
        logging.error(f"获取视频流失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500 