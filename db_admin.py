#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
数据库管理模块 - 为未决定AI平台提供MySQL数据库连接和操作功能
"""

import os
import json
import logging
import mysql.connector
from mysql.connector import Error
from datetime import datetime
from flask import Flask, render_template, request, jsonify, Blueprint
from functools import wraps
import pandas as pd
import threading
import queue

# 配置日志记录
import sys

# 创建logger
logger = logging.getLogger('db_admin')
logger.setLevel(logging.INFO)

# 文件处理器
file_handler = logging.FileHandler('logs/db_admin.log')
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(file_handler)

# 如果控制台处理器不存在，则添加
if not any(isinstance(handler, logging.StreamHandler) for handler in logger.handlers):
    # 控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
    logger.addHandler(console_handler)

# 创建logs目录
os.makedirs('logs', exist_ok=True)

# 数据库配置文件路径
DB_CONFIG_PATH = 'database/db_config.json'

# 创建数据库配置目录
os.makedirs('database', exist_ok=True)

# 默认数据库配置
DEFAULT_DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '123456',
    'database': 'ai_platform',
    'port': 3306
}

class DatabaseManager:
    """数据库管理类，提供MySQL数据库连接和基本操作功能"""
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        """单例模式，确保只有一个数据库连接实例"""
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(DatabaseManager, cls).__new__(cls)
                cls._instance.connection = None
                cls._instance.cursor = None
                cls._instance.config = cls._instance._load_config()
                cls._instance.query_queue = queue.Queue()
                cls._instance.result_queue = queue.Queue()
                cls._instance._start_worker()
            return cls._instance
    
    def _load_config(self):
        """加载数据库配置"""
        try:
            if os.path.exists(DB_CONFIG_PATH):
                with open(DB_CONFIG_PATH, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                # 如果配置文件不存在，则创建默认配置
                with open(DB_CONFIG_PATH, 'w', encoding='utf-8') as f:
                    json.dump(DEFAULT_DB_CONFIG, f, indent=4, ensure_ascii=False)
                return DEFAULT_DB_CONFIG
        except Exception as e:
            logger.error(f"加载数据库配置出错: {e}")
            return DEFAULT_DB_CONFIG
    
    def save_config(self, config):
        """保存数据库配置"""
        try:
            with open(DB_CONFIG_PATH, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=4, ensure_ascii=False)
            self.config = config
            logger.info("数据库配置已更新")
            return True
        except Exception as e:
            logger.error(f"保存数据库配置出错: {e}")
            return False
    
    def connect(self):
        """连接到MySQL数据库"""
        try:
            if self.connection is not None and self.connection.is_connected():
                return True
            
            self.connection = mysql.connector.connect(
                host=self.config.get('host', 'localhost'),
                user=self.config.get('user', 'root'),
                password=self.config.get('password', '123456'),
                database=self.config.get('database', 'ai_platform'),
                port=self.config.get('port', 3306)
            )
            
            if self.connection.is_connected():
                self.cursor = self.connection.cursor(dictionary=True)
                logger.info(f"已连接到MySQL数据库: {self.config.get('database')}")
                return True
            return False
        except Error as e:
            logger.error(f"连接数据库出错: {e}")
            return False
    
    def disconnect(self):
        """断开数据库连接"""
        try:
            if self.connection and self.connection.is_connected():
                self.cursor.close()
                self.connection.close()
                self.cursor = None
                self.connection = None
                logger.info("已断开MySQL数据库连接")
        except Error as e:
            logger.error(f"断开数据库连接出错: {e}")
    
    def reconnect(self):
        """重新连接数据库"""
        self.disconnect()
        return self.connect()
    
    def execute_query(self, query, params=None):
        """执行查询SQL"""
        try:
            if not self.connection or not self.connection.is_connected():
                if not self.connect():
                    return False, "数据库连接失败"
            
            self.cursor.execute(query, params or ())
            result = self.cursor.fetchall()
            logger.info(f"执行查询: {query[:100]}...")
            return True, result
        except Error as e:
            logger.error(f"执行查询出错: {e}, SQL: {query[:100]}...")
            return False, str(e)
    
    def execute_update(self, query, params=None):
        """执行更新SQL"""
        try:
            if not self.connection or not self.connection.is_connected():
                if not self.connect():
                    return False, "数据库连接失败"
            
            self.cursor.execute(query, params or ())
            self.connection.commit()
            affected_rows = self.cursor.rowcount
            logger.info(f"执行更新: {query[:100]}..., 影响行数: {affected_rows}")
            return True, affected_rows
        except Error as e:
            logger.error(f"执行更新出错: {e}, SQL: {query[:100]}...")
            if self.connection:
                self.connection.rollback()
            return False, str(e)
    
    def get_tables(self):
        """获取所有表"""
        query = "SHOW TABLES"
        success, result = self.execute_query(query)
        if success:
            return [list(table.values())[0] for table in result]
        return []
    
    def get_table_info(self, table_name):
        """获取表结构信息"""
        query = f"DESCRIBE `{table_name}`"
        success, result = self.execute_query(query)
        if success:
            return result
        return []
    
    def get_table_data(self, table_name, limit=100, offset=0):
        """获取表数据"""
        query = f"SELECT * FROM `{table_name}` LIMIT {offset}, {limit}"
        return self.execute_query(query)
    
    def execute_custom_query(self, query):
        """执行自定义SQL查询"""
        # 判断是SELECT还是其他类型的SQL
        query = query.strip()
        if query.upper().startswith('SELECT'):
            return self.execute_query(query)
        else:
            return self.execute_update(query)
    
    def _start_worker(self):
        """启动后台工作线程处理查询"""
        def worker():
            while True:
                try:
                    query, params, query_type, query_id = self.query_queue.get()
                    if query_type == 'query':
                        result = self.execute_query(query, params)
                    else:
                        result = self.execute_update(query, params)
                    self.result_queue.put((query_id, result))
                except Exception as e:
                    logger.error(f"查询工作线程出错: {e}")
                finally:
                    self.query_queue.task_done()
        
        thread = threading.Thread(target=worker, daemon=True)
        thread.start()
    
    def async_execute(self, query, params=None, query_type='query'):
        """异步执行SQL"""
        query_id = datetime.now().strftime('%Y%m%d%H%M%S%f')
        self.query_queue.put((query, params, query_type, query_id))
        return query_id
    
    def get_result(self, query_id, timeout=5):
        """获取异步执行的结果"""
        try:
            result = self.result_queue.get(timeout=timeout)
            if result[0] == query_id:
                return result[1]
            return False, "查询结果不匹配"
        except queue.Empty:
            return False, "查询超时"

# 创建数据库管理器实例
db_manager = DatabaseManager()

# 创建Blueprint
db_admin_bp = Blueprint('db_admin', __name__, url_prefix='/db_admin')

# 身份验证装饰器 (已禁用)
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 临时禁用身份验证，方便开发调试
        return f(*args, **kwargs)
    return decorated_function

@db_admin_bp.route('/')
@admin_required
def index():
    """数据库管理主页"""
    return render_template('db_admin/index.html')

@db_admin_bp.route('/analysis')
@admin_required
def analysis():
    """数据库分析页面"""
    return render_template('db_admin/analysis.html')

@db_admin_bp.route('/api/connect', methods=['POST'])
@admin_required
def connect_db():
    """连接数据库API"""
    data = request.json
    if data:
        if db_manager.save_config(data):
            if db_manager.connect():
                return jsonify({"success": True, "message": "数据库连接成功"})
            return jsonify({"success": False, "message": "数据库连接失败，请检查配置"})
    return jsonify({"success": False, "message": "无效的配置参数"})

@db_admin_bp.route('/api/disconnect', methods=['POST'])
@admin_required
def disconnect_db():
    """断开数据库连接API"""
    db_manager.disconnect()
    return jsonify({"success": True, "message": "数据库连接已断开"})

@db_admin_bp.route('/api/config', methods=['GET'])
@admin_required
def get_config():
    """获取数据库配置API"""
    return jsonify(db_manager.config)

@db_admin_bp.route('/api/tables', methods=['GET'])
@admin_required
def get_tables():
    """获取所有表API"""
    tables = db_manager.get_tables()
    return jsonify({"tables": tables})

@db_admin_bp.route('/api/table/<table_name>/info', methods=['GET'])
@admin_required
def get_table_info(table_name):
    """获取表结构API"""
    info = db_manager.get_table_info(table_name)
    return jsonify({"info": info})

@db_admin_bp.route('/api/table/<table_name>/data', methods=['GET'])
@admin_required
def get_table_data(table_name):
    """获取表数据API"""
    limit = int(request.args.get('limit', 100))
    offset = int(request.args.get('offset', 0))
    success, data = db_manager.get_table_data(table_name, limit, offset)
    return jsonify({"success": success, "data": data})

@db_admin_bp.route('/api/query', methods=['POST'])
@admin_required
def execute_query():
    """执行自定义查询API"""
    data = request.json
    if data and 'query' in data:
        success, result = db_manager.execute_custom_query(data['query'])
        return jsonify({"success": success, "result": result})
    return jsonify({"success": False, "message": "缺少查询参数"})

def init_app(app):
    """将Blueprint注册到Flask应用"""
    app.register_blueprint(db_admin_bp)
    
    # 确保模板目录存在
    os.makedirs('templates/db_admin', exist_ok=True)
    
    # 返回数据库管理器实例，便于应用程序使用
    return db_manager

if __name__ == "__main__":
    # 测试数据库连接
    if db_manager.connect():
        print("数据库连接成功!")
        tables = db_manager.get_tables()
        print(f"数据库表: {tables}")
        db_manager.disconnect()
    else:
        print("数据库连接失败，请检查配置!") 