from flask import Flask
from flask_cors import CORS
import pymysql
import logging
import os
from datetime import datetime

def create_app():
    """创建Flask应用实例"""
    app = Flask(__name__, 
                static_folder='../static',
                template_folder='../templates')
    
    # 启用CORS跨域支持
    CORS(app, origins=['http://localhost:5173'])
    
    # 配置数据库连接
    app.config['MYSQL_CONFIG'] = {
        'host': 'localhost',
        'user': 'root',
        'password': '123456',
        'database': 'ai_platform',
        'charset': 'utf8mb4'
    }
    
    # 配置日志
    if not os.path.exists('../logs'):
        os.makedirs('../logs')
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('../logs/db_admin.log', encoding='utf-8'),
            logging.StreamHandler()
        ]
    )
    
    app.logger.info('数据库管理系统启动')
    
    # 注册路由
    from .routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api')
    
    return app

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