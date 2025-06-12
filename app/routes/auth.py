from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.user import User
from app.utils.error_handlers import handle_error
from app.utils.validators import validate_email, validate_password
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import datetime
from app import db  # 添加数据库导入
import logging

# 配置日志
logger = logging.getLogger(__name__)

# 创建认证蓝图
bp = Blueprint('auth', __name__)

@bp.route('/', methods=['GET'])
def auth_status():
    """获取认证服务状态"""
    return jsonify({
        'success': True,
        'message': '认证服务正常运行',
        'timestamp': datetime.datetime.now().isoformat()
    })

@bp.route('/register', methods=['POST'])
def register():
    try:
        logger.info("开始处理用户注册请求")
        data = request.get_json()
        
        # 验证必要字段
        if not all(key in data for key in ['email', 'password', 'username']):
            return jsonify({'error': '缺少必要字段'}), 400
            
        # 验证邮箱格式
        if not validate_email(data['email']):
            return jsonify({'error': '邮箱格式不正确'}), 400
            
        # 验证密码强度
        if not validate_password(data['password']):
            return jsonify({'error': '密码必须至少包含8个字符，包括大小写字母、数字和特殊字符'}), 400
            
        # 检查邮箱是否已存在
        existing_user = db.session.query(User).filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': '该邮箱已被注册'}), 400
            
        # 创建新用户
        new_user = User(
            username=data['username'],
            email=data['email'],
            password_hash=generate_password_hash(data['password'])
        )
        
        # 保存到数据库
        db.session.add(new_user)
        db.session.commit()
        
        logger.info(f"用户注册成功: {data['email']}")
        return jsonify({
            'message': '注册成功',
            'user': {
                'id': new_user.id,
                'email': new_user.email,
                'username': new_user.username
            }
        }), 201
        
    except Exception as e:
        logger.error(f"注册失败: {str(e)}")
        return handle_error(e)

@bp.route('/login', methods=['POST'])
def login():
    try:
        logger.info("开始处理用户登录请求")
        data = request.get_json()
        
        # 验证必要字段
        if not all(key in data for key in ['email', 'password']):
            return jsonify({'error': '缺少必要字段'}), 400
            
        # 查找用户
        user = db.session.query(User).filter_by(email=data['email']).first()
        if not user or not check_password_hash(user.password_hash, data['password']):
            return jsonify({'error': '邮箱或密码错误'}), 401
            
        # 创建访问令牌
        access_token = create_access_token(
            identity=user.id,
            expires_delta=datetime.timedelta(days=1)
        )
        
        # 更新用户的登录信息
        if hasattr(user, 'update_login'):
            user.update_login()
            db.session.commit()
        
        logger.info(f"用户登录成功: {data['email']}")
        return jsonify({
            'message': '登录成功',
            'access_token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            }
        }), 200
        
    except Exception as e:
        logger.error(f"登录失败: {str(e)}")
        return handle_error(e)

@bp.route('/me', methods=['GET'])
@jwt_required()
def get_user_info():
    try:
        # 获取当前用户ID
        current_user_id = get_jwt_identity()
        
        # 查找用户
        user = db.session.query(User).get(current_user_id)
        if not user:
            return jsonify({'error': '用户不存在'}), 404
            
        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'created_at': user.created_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        return handle_error(e)

@bp.route('/update', methods=['PUT'])
@jwt_required()
def update_user():
    try:
        current_user_id = get_jwt_identity()
        user = db.session.query(User).get(current_user_id)
        if not user:
            return jsonify({'error': '用户不存在'}), 404
            
        data = request.get_json()
        
        # 更新用户名
        if 'username' in data:
            user.username = data['username']
            
        # 更新密码
        if 'password' in data:
            if not validate_password(data['password']):
                return jsonify({'error': '密码必须至少包含8个字符，包括大小写字母、数字和特殊字符'}), 400
            user.password_hash = generate_password_hash(data['password'])
            
        db.session.commit()
        
        return jsonify({
            'message': '用户信息更新成功',
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            }
        }), 200
        
    except Exception as e:
        return handle_error(e) 