import os
from pathlib import Path

class Config:
    """基础配置类"""
    # 项目根目录
    BASE_DIR = Path(__file__).parent.parent
    
    # 数据库目录
    DATABASE_DIR = BASE_DIR / 'database'
    
    # 各种数据目录
    USER_DIR = DATABASE_DIR / 'user'
    VIDEO_DIR = DATABASE_DIR / 'video'
    QUESTION_DIR = DATABASE_DIR / 'question'
    ANSWER_DIR = DATABASE_DIR / 'answer'
    FEEDBACK_DIR = DATABASE_DIR / 'feedback'
    AVATAR_DIR = DATABASE_DIR / 'touxiang'
    AI_PRODUCT_DIR = DATABASE_DIR / 'AI_product'
    REQUESTION_DIR = DATABASE_DIR / 'requestion'
    
    # 确保必要的目录存在
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)
    USER_DIR.mkdir(exist_ok=True)
    VIDEO_DIR.mkdir(exist_ok=True)
    QUESTION_DIR.mkdir(exist_ok=True)
    ANSWER_DIR.mkdir(exist_ok=True)
    FEEDBACK_DIR.mkdir(exist_ok=True)
    AVATAR_DIR.mkdir(exist_ok=True)
    AI_PRODUCT_DIR.mkdir(exist_ok=True)
    REQUESTION_DIR.mkdir(exist_ok=True)
    
    # Flask配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-please-change-in-production'
    DEBUG = os.environ.get('FLASK_DEBUG', '1') == '1'
    
    # MySQL数据库配置
    MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3306))
    MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '123456')
    MYSQL_DATABASE = os.environ.get('MYSQL_DATABASE', 'ai_platform')
    
    # SQLAlchemy配置
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = DEBUG  # 在调试模式下打印SQL语句
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,  # 连接池大小
        'max_overflow': 20,  # 超过pool_size后最多可以创建的连接数
        'pool_timeout': 30,  # 连接池获取连接的超时时间
        'pool_recycle': 1800,  # 连接在连接池中重用的时间限制
    }
    
    # 服务器配置
    HOST = os.environ.get('FLASK_HOST', '0.0.0.0')
    PORT = int(os.environ.get('FLASK_PORT', 3003))
    
    # 文件上传配置
    MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500MB
    UPLOAD_FOLDER = DATABASE_DIR / 'video'
    ALLOWED_EXTENSIONS = {
        'video': {'.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'},
        'image': {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'},
        'text': {'.txt'}
    }
    
    # 日志配置
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_DIR = BASE_DIR / 'logs'
    LOG_DIR.mkdir(exist_ok=True)
    
    # 跨域配置
    CORS_ORIGINS = ['*']
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    CORS_HEADERS = ['Content-Type', 'Authorization']
    
    # 安全配置
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = 3600  # 1小时
    
    # 其他配置
    JSON_AS_ASCII = False  # 支持中文JSON
    JSON_SORT_KEYS = False  # 保持JSON键的顺序
    JSONIFY_PRETTYPRINT_REGULAR = True  # 美化JSON输出

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    SESSION_COOKIE_SECURE = False
    LOG_LEVEL = 'DEBUG'
    SQLALCHEMY_ECHO = True

class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    LOG_LEVEL = 'WARNING'
    SECRET_KEY = os.environ.get('SECRET_KEY')  # 生产环境必须设置密钥
    SQLALCHEMY_ECHO = False

class TestingConfig(Config):
    """测试环境配置"""
    TESTING = True
    DEBUG = True
    SESSION_COOKIE_SECURE = False
    LOG_LEVEL = 'DEBUG'
    DATABASE_DIR = Config.BASE_DIR / 'tests' / 'test_database'
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:123456@localhost/ai_platform_test'

# 配置映射
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

# 获取当前环境的配置
def get_config():
    """根据环境变量获取对应的配置类"""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])

def init_app(app):
    """初始化应用配置"""
    # 创建必要的目录
    for directory in [
        Config.DATABASE_DIR,
        Config.DATABASE_DIR / 'user',
        Config.DATABASE_DIR / 'video',
        Config.DATABASE_DIR / 'question',
        Config.DATABASE_DIR / 'feedback',
        Config.DATABASE_DIR / 'touxiang',
        Config.DATABASE_DIR / 'answer',
        Config.DATABASE_DIR / 'AI_product',
        Config.DATABASE_DIR / 'requestion'
    ]:
        directory.mkdir(parents=True, exist_ok=True)
        
    # 配置日志
    if not app.debug:
        import logging
        from logging.handlers import RotatingFileHandler
        
        if not os.path.exists('logs'):
            os.mkdir('logs')
            
        file_handler = RotatingFileHandler(
            'logs/ai_platform.log',
            maxBytes=10240,
            backupCount=10
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s '
            '[in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        
        app.logger.setLevel(logging.INFO)
        app.logger.info('AI Platform startup') 