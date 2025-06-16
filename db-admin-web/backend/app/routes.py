from flask import Blueprint, request, jsonify, current_app
import pymysql
import logging
import json
from datetime import datetime
import os

admin_bp = Blueprint('admin', __name__)

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
               created_at, phone, bio
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

@admin_bp.route('/videos/<int:video_id>/stream', methods=['GET'])
def stream_video(video_id):
    """获取视频流地址"""
    try:
        query = "SELECT file_path FROM videos WHERE id = %s AND is_deleted = 0"
        result = execute_query(query, [video_id])
        
        if result and len(result) > 0:
            file_path = result[0]['file_path']
            # 构建视频文件的实际路径
            video_file_path = os.path.join('../../database/video', os.path.basename(file_path))
            
            return jsonify({
                'success': True,
                'data': {
                    'video_url': f'/api/static/video/{os.path.basename(file_path)}',
                    'file_path': file_path
                }
            })
        else:
            return jsonify({'success': False, 'message': '视频不存在'}), 404
            
    except Exception as e:
        logging.error(f"获取视频流失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/static/video/<filename>')
def serve_video(filename):
    """提供视频文件服务"""
    try:
        # 获取相对于主项目根目录的正确路径
        # 从db-admin-web/backend/app到主项目根目录
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # db-admin-web/backend
        db_admin_root = os.path.dirname(backend_dir)  # db-admin-web
        main_project_root = os.path.dirname(db_admin_root)  # front-end2
        video_dir = os.path.join(main_project_root, 'database', 'video')
        
        # Debug信息
        logging.info(f"Backend dir: {backend_dir}")
        logging.info(f"Main project root: {main_project_root}")
        logging.info(f"Video dir: {video_dir}")
        logging.info(f"Looking for file: {filename}")
        
        # 检查文件是否存在
        file_path = os.path.join(video_dir, filename)
        logging.info(f"Full file path: {file_path}")
        
        if not os.path.exists(file_path):
            logging.error(f"File not found: {file_path}")
            return jsonify({'success': False, 'message': f'视频文件不存在: {file_path}'}), 404
            
        from flask import send_from_directory
        return send_from_directory(video_dir, filename, as_attachment=False)
    except Exception as e:
        logging.error(f"提供视频文件失败: {e}")
        return jsonify({'success': False, 'message': str(e)}), 404 