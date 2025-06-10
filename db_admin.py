#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
数据库管理模块 - 为未决定AI平台提供MySQL数据库连接和操作功能
"""

import os
import json
import logging
import mysql.connector
from mysql.connector import Error, pooling
from datetime import datetime
from flask import Flask, render_template, request, jsonify, Blueprint
from functools import wraps
import pandas as pd
import threading
import queue
import time
import weakref

# 配置日志记录
import sys

# 创建logger
logger = logging.getLogger('db_admin')
logger.setLevel(logging.INFO)

# 移除所有现有的处理器，避免重复
for handler in logger.handlers[:]:
    logger.removeHandler(handler)

# 文件处理器
file_handler = logging.FileHandler('logs/db_admin.log')
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(file_handler)

# 控制台处理器 - 只添加一次
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

# 数据类型转换函数，处理不能直接JSON序列化的类型
def convert_for_json(obj):
    """将不能JSON序列化的类型转换为可序列化类型"""
    if isinstance(obj, bytes):
        return obj.decode('utf-8', errors='replace')  # 转为字符串，忽略无法解码的字节
    elif isinstance(obj, datetime):
        return obj.isoformat()  # 日期时间转为ISO格式字符串
    elif hasattr(obj, '__dict__'):
        return obj.__dict__  # 对象转为字典
    else:
        return str(obj)  # 其他类型转为字符串

# 序列化处理函数
def prepare_for_json(data):
    """递归处理数据结构，确保所有内容可以被JSON序列化"""
    if isinstance(data, dict):
        return {k: prepare_for_json(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [prepare_for_json(item) for item in data]
    elif isinstance(data, (bytes, datetime)) or (not isinstance(data, (str, int, float, bool, type(None)))):
        return convert_for_json(data)
    else:
        return data

class DatabasePool:
    """线程安全的数据库连接池，提供数据库连接管理"""
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(DatabasePool, cls).__new__(cls)
                cls._instance.config = None
                cls._instance.pool = None
                cls._instance.initialized = False
            return cls._instance
    
    def initialize(self, config):
        """初始化连接池"""
        if self.initialized:
            return True
            
        with self._lock:
            if not self.initialized:  # 双重检查锁
                self.config = config
                try:
                    self.pool = pooling.MySQLConnectionPool(
                        pool_name="db_admin_pool",
                        pool_size=10,  # 增加连接池大小
                        pool_reset_session=True,
                        **config
                    )
                    self.initialized = True
                    logger.info(f"已初始化数据库连接池，连接到：{config['database']}")
                    return True
                except Error as e:
                    logger.error(f"初始化数据库连接池失败: {e}")
                    return False
            return True
    
    def get_connection(self):
        """从连接池获取连接"""
        if not self.initialized:
            if not self.config:
                self.config = config  # 使用全局配置
            # 如果未初始化，尝试初始化
            if not self.initialize(self.config):
                raise ValueError("连接池未初始化")
            
        # 尝试获取连接，最多等待5秒
        max_attempts = 10
        attempt = 0
        last_error = None
        
        while attempt < max_attempts:
            try:
                connection = self.pool.get_connection()
                return connection
            except Error as e:
                last_error = e
                logger.warning(f"获取连接失败，重试中 ({attempt+1}/{max_attempts}): {e}")
                attempt += 1
                time.sleep(0.5)  # 等待500毫秒后重试
        
        logger.error(f"从连接池获取连接失败，已重试{max_attempts}次: {last_error}")
        raise last_error
    
    def close_pool(self):
        """关闭连接池中的所有连接"""
        with self._lock:
            if self.initialized:
                # 连接池不需要显式关闭，MySQL Connector Python会处理
                self.initialized = False
                logger.info("数据库连接池已关闭")

class DatabaseManager:
    """数据库管理类，提供MySQL数据库连接和基本操作功能"""
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        """单例模式，确保只有一个数据库连接实例"""
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(DatabaseManager, cls).__new__(cls)
                cls._instance.db_pool = DatabasePool()
                cls._instance.config = cls._instance._load_config()
                cls._instance.query_queue = queue.Queue()
                cls._instance.result_queue = queue.Queue()
                cls._instance.worker_thread = None
                cls._instance.running = False
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
    
    def connect(self, host=None, port=None, user=None, password=None, database=None):
        """连接到MySQL数据库"""
        try:
            # 更新配置
            if host is not None:
                self.config['host'] = host
            if port is not None:
                self.config['port'] = int(port)
            if user is not None:
                self.config['user'] = user
            if password is not None:
                self.config['password'] = password
            if database is not None:
                self.config['database'] = database
            
            # 关闭旧连接池
            if self.db_pool.initialized:
                self.db_pool.close_pool()
            
            # 初始化连接池
            result = self.db_pool.initialize(self.config)
            if result:
                logger.info(f"已连接到MySQL数据库: {self.config['database']}")
                
                # 测试连接有效性
                try:
                    test_connection = self.db_pool.get_connection()
                    test_connection.close()
                except Exception as e:
                    logger.error(f"测试连接失败: {e}")
                    return False
                    
                return True
            return False
        except Error as e:
            logger.error(f"连接MySQL失败: {e}")
            return False
    
    def disconnect(self):
        """断开数据库连接"""
        try:
            self.stop_worker()
            self.db_pool.close_pool()
            logger.info("已断开MySQL数据库连接")
            return True
        except Exception as e:
            logger.error(f"断开MySQL连接失败: {e}")
            return False
    
    def execute_query(self, query, params=None):
        """执行SQL查询并返回结果"""
        try:
            logger.info(f"执行查询: {query[:100]}..." if len(query) > 100 else f"执行查询: {query}")
            
            # 使用连接池直接执行查询，避免线程安全问题
            connection = None
            try:
                connection = self.db_pool.get_connection()
                cursor = connection.cursor(dictionary=True)
                cursor.execute(query, params or ())
                
                # 检查是否是SELECT查询
                if query.strip().upper().startswith("SELECT") or query.strip().upper().startswith("SHOW"):
                    # 获取查询结果
                    result = cursor.fetchall()
                    logger.info(f"查询执行成功, 返回记录数: {len(result)}")
                    if result and len(result) > 0:
                        logger.info(f"结果示例: {result[0]}")
                    return True, result
                else:
                    # 非SELECT查询，返回受影响的行数
                    connection.commit()
                    logger.info(f"查询执行成功, 影响行数: {cursor.rowcount}")
                    return True, cursor.rowcount
            finally:
                if connection:
                    if cursor:
                        cursor.close()
                    connection.close()
        except Exception as e:
            logger.error(f"执行查询出错: {e}", exc_info=True)
            return False, str(e)
    
    def execute_update(self, query, params=None):
        """执行更新SQL"""
        try:
            logger.info(f"执行更新: {query[:100]}..." if len(query) > 100 else f"执行更新: {query}")
            
            # 使用连接池直接执行更新，避免线程安全问题
            connection = None
            cursor = None
            try:
                connection = self.db_pool.get_connection()
                cursor = connection.cursor()
                cursor.execute(query, params or ())
                connection.commit()
                affected_rows = cursor.rowcount
                logger.info(f"更新执行成功, 影响行数: {affected_rows}")
                return True, affected_rows
            finally:
                if cursor:
                    cursor.close()
                if connection:
                    connection.close()
        except Error as e:
            logger.error(f"执行更新出错: {e}, SQL: {query[:100]}...")
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
        return self.execute_query(query)
    
    def _start_worker(self):
        """启动后台工作线程处理查询"""
        if self.worker_thread and self.worker_thread.is_alive():
            return  # 如果线程已经在运行，不需要再次启动
        
        def worker():
            self.running = True
            while self.running:
                try:
                    # 从队列获取查询，最多等待1秒
                    try:
                        query_data = self.query_queue.get(timeout=1)
                    except queue.Empty:
                        continue
                    
                    if query_data is None:  # 终止信号
                        break
                    
                    query_id, query, params = query_data
                    
                    # 执行查询
                    connection = None
                    try:
                        connection = self.db_pool.get_connection()
                        cursor = connection.cursor(dictionary=True)
                        cursor.execute(query, params or ())
                        
                        # 检查是否是SELECT查询
                        if query.strip().upper().startswith("SELECT") or query.strip().upper().startswith("SHOW"):
                            # 获取查询结果
                            result = cursor.fetchall()
                            self.result_queue.put((query_id, True, result))
                        else:
                            # 非SELECT查询，返回受影响的行数
                            connection.commit()
                            self.result_queue.put((query_id, True, cursor.rowcount))
                            
                        cursor.close()
                    except Exception as e:
                        logger.error(f"执行查询时出错: {e}", exc_info=True)
                        self.result_queue.put((query_id, False, str(e)))
                    finally:
                        if connection:
                            connection.close()
                            
                except Exception as e:
                    logger.error(f"查询工作线程异常: {e}", exc_info=True)
                    time.sleep(0.1)  # 避免CPU过度使用
            
            logger.info("查询工作线程已终止")
        
        self.worker_thread = threading.Thread(target=worker, daemon=True)
        self.worker_thread.start()
    
    def stop_worker(self):
        """停止工作线程"""
        if self.worker_thread and self.worker_thread.is_alive():
            self.running = False
            self.query_queue.put(None)  # 发送终止信号
            self.worker_thread.join(timeout=2)  # 等待线程结束
            logger.info("查询工作线程已停止")
    
    def async_execute(self, query, params=None, query_type='query'):
        """异步执行SQL"""
        query_id = datetime.now().strftime('%Y%m%d%H%M%S%f')
        self.query_queue.put((query_id, query, params))
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
    try:
        logger.info(f"请求表结构: {table_name}")
        # 使用一个新的连接查询表结构，避免连接池问题
        query = f"DESCRIBE `{table_name}`"
        connection = None
        cursor = None
        try:
            connection = db_manager.db_pool.get_connection()
            cursor = connection.cursor(dictionary=True)
            cursor.execute(query)
            info = cursor.fetchall()
            cursor.close()
            connection.close()
            
            if not info:
                logger.warning(f"表结构获取失败或为空: {table_name}")
                return jsonify({"success": False, "error": "无法获取表结构或表不存在", "data": []})
            
            # 记录原始数据类型，帮助调试
            sample = info[0] if info else {}
            logger.info(f"表结构数据示例: {table_name}, 字段数: {len(sample)}, 类型: {[(k, type(v).__name__) for k, v in sample.items() if v is not None][:3]}")
            
            # 准备JSON数据
            return jsonify({"success": True, "data": prepare_for_json(info)})
        except Exception as e:
            logger.error(f"表结构查询错误: {str(e)}")
            if cursor:
                cursor.close()
            if connection and connection.is_connected():
                connection.close()
            return jsonify({"success": False, "error": str(e), "data": []})
    except Exception as e:
        logger.error(f"表结构获取失败: {str(e)}")
        return jsonify({"success": False, "error": str(e), "data": []})

@db_admin_bp.route('/api/table/<table_name>/data', methods=['GET'])
@admin_required
def get_table_data(table_name):
    """获取表数据API"""
    try:
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        logger.info(f"请求表数据: {table_name}, limit: {limit}, offset: {offset}")
        
        success, data = db_manager.get_table_data(table_name, limit, offset)
        if not success:
            logger.warning(f"表数据获取失败: {table_name}, 错误: {data}")
            return jsonify({"success": False, "error": data, "data": []})
        
        # 记录数据量和类型信息
        count = len(data) if data else 0
        logger.info(f"表数据获取成功: {table_name}, 记录数: {count}")
        if count > 0:
            sample = data[0]
            logger.info(f"数据示例: 字段数: {len(sample)}, 类型: {[(k, type(v).__name__) for k, v in sample.items() if v is not None][:3]}")
        
        # 处理结果以确保JSON序列化
        data = prepare_for_json(data)
        return jsonify({"success": True, "data": data})
    except Exception as e:
        logger.error(f"获取表数据时出错: {table_name}, 错误: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": f"服务器错误: {str(e)}", "data": []})

@db_admin_bp.route('/api/query', methods=['POST'])
@admin_required
def execute_query():
    """执行自定义查询API"""
    try:
        data = request.json
        if not data or 'query' not in data:
            logger.warning("缺少查询参数")
            return jsonify({"success": False, "message": "缺少查询参数"})
        
        query = data['query']
        logger.info(f"执行自定义查询: {query[:100]}..." if len(query) > 100 else f"执行自定义查询: {query}")
        
        success, result = db_manager.execute_custom_query(data['query'])
        if not success:
            logger.warning(f"查询执行失败: {result}")
            return jsonify({"success": False, "error": result, "result": []})
        
        # 记录结果信息
        if isinstance(result, (list, tuple)) and result:
            count = len(result)
            logger.info(f"查询执行成功, 返回记录数: {count}")
            if count > 0:
                sample = result[0] if isinstance(result[0], dict) else {"value": result[0]}
                logger.info(f"结果示例: {sample}")
        else:
            logger.info(f"查询执行成功, 影响行数: {result}")
        
        # 处理结果以确保JSON序列化
        result = prepare_for_json(result)
        return jsonify({"success": True, "result": result})
    except Exception as e:
        logger.error(f"执行查询时出错: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": f"服务器错误: {str(e)}", "result": []})

@db_admin_bp.route('/api/update', methods=['POST'])
@admin_required
def update_cell():
    """更新单元格值的API"""
    try:
        # 从请求中获取更新信息
        data = request.json
        logger.info(f"收到更新请求: {data}")
        
        table = data.get('table')
        column = data.get('column')
        value = data.get('value')
        primary_key = data.get('primaryKey')
        primary_key_value = data.get('primaryKeyValue')
        
        # 验证必要的参数
        if not all([table, column, primary_key, primary_key_value is not None]):
            logger.warning(f"更新请求缺少必要参数: table={table}, column={column}, primaryKey={primary_key}, primaryKeyValue={primary_key_value}")
            return jsonify({'success': False, 'error': '缺少必要的参数'})
        
        # 构建更新SQL
        update_sql = f"UPDATE `{table}` SET `{column}` = %s WHERE `{primary_key}` = %s"
        params = (value, primary_key_value)
        
        # 记录操作
        logger.info(f"正在更新表 {table} 中 {primary_key}={primary_key_value} 的行，列 {column} 的值为 {value}")
        
        # 执行更新
        success, result = db_manager.execute_update(update_sql, params)
        
        if not success:
            logger.error(f"更新失败: {result}")
            return jsonify({'success': False, 'error': str(result)})
        
        logger.info(f"更新成功，影响行数: {result}")
        return jsonify({
            'success': True, 
            'message': f'更新成功，影响行数: {result}', 
            'affected_rows': result,
            'table': table,
            'column': column,
            'primaryKey': primary_key,
            'primaryKeyValue': primary_key_value,
            'newValue': value
        })
    except Exception as e:
        error_msg = str(e)
        logger.error(f"更新数据出错: {error_msg}", exc_info=True)
        return jsonify({'success': False, 'error': error_msg})

@db_admin_bp.route('/api/table/<table_name>/row/<int:row_index>', methods=['GET'])
@admin_required
def get_row_data(table_name, row_index):
    """获取指定行数据的API"""
    try:
        # 获取表主键
        table_info_query = f"SHOW KEYS FROM {table_name} WHERE Key_name = 'PRIMARY'"
        success, primary_key_info = db_manager.execute_query(table_info_query)
        
        if not success or not primary_key_info:
            return jsonify({'success': False, 'error': '无法获取表主键信息'})
        
        primary_key = primary_key_info[0]['Column_name']
        
        # 获取排序后的数据
        query = f"SELECT * FROM {table_name} ORDER BY {primary_key} LIMIT {row_index}, 1"
        success, rows = db_manager.execute_query(query)
        
        if not success or not rows:
            return jsonify({'success': False, 'error': '未找到指定行'})
        
        return jsonify({'success': True, 'data': rows[0]})
    except Exception as e:
        logger.error(f"获取行数据出错: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

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