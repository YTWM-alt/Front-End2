#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
未决定AI平台 - 安全数据库管理工具启动脚本
不加载视频处理相关库，避免内存问题
"""

import os
import sys
import logging
import json
from datetime import datetime
from flask import Flask, url_for, redirect, jsonify
from flask.json import JSONEncoder

# 重要：禁用自动导入视频处理相关库
os.environ['IMAGEIO_NO_IMPORT'] = '1'
os.environ['OPENCV_DISABLE_GLOBAL_RESOURCES'] = '1'

# 创建logs目录
os.makedirs('logs', exist_ok=True)

# 防止重复日志：清理根日志记录器
root_logger = logging.getLogger()
for handler in root_logger.handlers[:]:
    root_logger.removeHandler(handler)

# 配置根日志记录器，避免重复输出
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/safe_db_admin.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

# 获取应用日志记录器
logger = logging.getLogger('safe_db_admin')
# 清理任何可能的重复处理器
for handler in logger.handlers[:]:
    logger.removeHandler(handler)

# 自定义JSON编码器
class CustomJSONEncoder(JSONEncoder):
    """处理特殊数据类型的JSON编码器"""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, bytes):
            try:
                return obj.decode('utf-8')
            except UnicodeDecodeError:
                return f"[二进制数据，长度：{len(obj)}字节]"
        return super().default(obj)

def create_app():
    """创建Flask应用"""
    app = Flask(__name__)
    
    # 配置静态文件
    app.static_folder = 'static'
    app.template_folder = 'templates'
    
    # 注册自定义JSON编码器
    app.json_encoder = CustomJSONEncoder
    
    # 注册数据库管理模块
    try:
        # 避免导入可能含有问题库的模块
        try:
            import mysql.connector
            logger.info("已检测到mysql-connector-python库")
        except ImportError:
            logger.error("未安装mysql-connector-python库，请使用pip install mysql-connector-python安装")
            return app
        
        # 导入数据库管理模块
        import db_admin
        db_admin.init_app(app)
        logger.info("数据库管理模块已加载")
    except Exception as e:
        logger.error(f"加载数据库管理模块时出错: {e}", exc_info=True)
    
    # 根路由重定向到数据库管理页面
    @app.route('/')
    def index():
        return redirect(url_for('db_admin.index'))
    
    return app

if __name__ == '__main__':
    print("="*60)
    print("未决定AI平台 - 安全数据库管理工具")
    print("="*60)
    print("服务正在启动，请访问 http://localhost:3003/")
    print("按 Ctrl+C 停止服务")
    print("="*60)
    
    app = create_app()
    app.run(host='0.0.0.0', port=3003, debug=True) 