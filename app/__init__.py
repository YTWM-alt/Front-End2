from flask import Flask, send_from_directory, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.app_config import get_config, init_app
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 初始化扩展
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app(config_class=None):
    # 创建应用实例
    app = Flask(__name__)
    
    # 加载配置
    if config_class is None:
        config_class = get_config()
    app.config.from_object(config_class)
    
    # 初始化应用配置
    init_app(app)
    
    # 初始化CORS
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # 初始化扩展
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # 初始化数据库
    with app.app_context():
        logger.info("正在初始化数据库...")
        try:
            # 确保数据库和所有表存在
            from app.models.base import Base
            from app.models.user import User
            from app.models.video import Video
            from app.models.question import Question
            from app.models.feedback import Feedback
            from app.models.answer import Answer
            
            # 创建所有表
            db.create_all()
            logger.info("数据库表初始化成功")
        except Exception as e:
            logger.error(f"初始化数据库出错: {str(e)}")
    
    # 注册蓝图
    from app.routes import auth, video, question, feedback, ai
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(video.bp, url_prefix='/videos')
    app.register_blueprint(question.bp, url_prefix='/api/questions')
    app.register_blueprint(feedback.bp, url_prefix='/api/feedback')
    app.register_blueprint(ai.bp, url_prefix='/api/ai')
    
    # 注册数据库管理模块
    try:
        import db_admin
        db_admin.init_app(app)
        logger.info("数据库管理模块已加载")
    except Exception as e:
        logger.error(f"加载数据库管理模块出错: {str(e)}")
    
    # 添加静态文件路由
    @app.route('/videos/<filename>')
    def serve_video_file(filename):
        video_dir = app.config['VIDEO_DIR']
        file_path = video_dir / filename
        app.logger.info(f"直接访问视频文件: {file_path}, 存在状态: {file_path.exists()}")
        
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
            
            app.logger.info(f"提供视频文件: {file_path}, MIME类型: {mime_type}")
            return send_from_directory(video_dir, filename, mimetype=mime_type)
        else:
            app.logger.error(f"视频文件不存在: {file_path}")
            return jsonify({'error': '视频文件不存在'}), 404
    
    # 添加静态文件路由 - 用户头像
    @app.route('/avatars/<filename>')
    def serve_avatar_file(filename):
        avatar_dir = app.config['AVATAR_DIR']
        file_path = avatar_dir / filename
        
        if file_path.exists():
            # 猜测图片MIME类型
            mime_type = 'image/jpeg'  # 默认为JPEG
            if filename.lower().endswith('.png'):
                mime_type = 'image/png'
            elif filename.lower().endswith('.gif'):
                mime_type = 'image/gif'
            elif filename.lower().endswith('.webp'):
                mime_type = 'image/webp'
            
            return send_from_directory(avatar_dir, filename, mimetype=mime_type)
        else:
            return jsonify({'error': '头像文件不存在'}), 404
    
    # 注册错误处理器
    from app.utils.error_handlers import register_error_handlers
    register_error_handlers(app)
    
    # 初始化日志
    if not app.debug:
        init_logging(app)
    
    # 返回应用实例
    return app 