#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
未决定AI平台 - 数据库管理工具启动脚本
"""

import os
import sys
import logging
from flask import Flask, url_for, redirect

# 创建logs目录
os.makedirs('logs', exist_ok=True)

# 配置根日志记录器，避免重复输出
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/db_admin.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

# 获取应用日志记录器
logger = logging.getLogger('db_admin_run')

def create_app():
    """创建Flask应用"""
    app = Flask(__name__)
    
    # 配置静态文件
    app.static_folder = 'static'
    app.template_folder = 'templates'
    
    # 注册数据库管理模块
    import db_admin
    db_manager = db_admin.init_app(app)
    
    # 根路径重定向到数据库管理界面
    @app.route('/')
    def index():
        return redirect(url_for('db_admin.index'))
    
    return app

if __name__ == '__main__':
    try:
        # 检查必要的目录是否存在
        for directory in ['templates/db_admin', 'static/db_admin', 'database']:
            os.makedirs(directory, exist_ok=True)
        
        # 检查mysql-connector-python是否已安装
        try:
            import mysql.connector
        except ImportError:
            print("错误: 缺少必要的依赖包 'mysql-connector-python'")
            print("请运行以下命令安装:")
            print("pip install mysql-connector-python")
            sys.exit(1)
        
        # 创建并运行应用
        app = create_app()
        port = 3003  # 固定使用3003端口
        
        print("="*60)
        print("未决定AI平台 - 数据库管理工具")
        print("="*60)
        print(f"服务正在启动，请访问 http://localhost:{port}/")
        print("按 Ctrl+C 停止服务")
        print("="*60)
        
        app.run(host='0.0.0.0', port=port, debug=True)
    except Exception as e:
        logger.error(f"启动数据库管理工具出错: {e}")
        print(f"错误: {e}")
        sys.exit(1) 