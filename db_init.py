#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
数据库初始化脚本 - 创建MySQL数据库和所需表
"""

import os
import sys
import json
import getpass
import logging
import mysql.connector
from mysql.connector import Error

# 配置日志记录
logging.basicConfig(
    filename='logs/db_init.log',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('db_init')

# 创建logs目录
os.makedirs('logs', exist_ok=True)

# 数据库配置文件路径
DB_CONFIG_PATH = 'database/db_config.json'

# 创建数据库配置目录
os.makedirs('database', exist_ok=True)


def get_user_input(prompt, default=None, password=False):
    """获取用户输入，支持默认值和密码输入"""
    if default:
        prompt = f"{prompt} [{default}]: "
    else:
        prompt = f"{prompt}: "
    
    if password:
        value = getpass.getpass(prompt)
    else:
        value = input(prompt)
    
    return value if value else default


def save_config(config):
    """保存数据库配置"""
    try:
        with open(DB_CONFIG_PATH, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=4, ensure_ascii=False)
        logger.info("数据库配置已保存")
        return True
    except Exception as e:
        logger.error(f"保存数据库配置出错: {e}")
        return False


def connect_to_mysql(host, user, password, database=None, port=3306):
    """连接到MySQL数据库"""
    try:
        connection = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database,
            port=port
        )
        logger.info(f"已连接到MySQL服务器: {host}:{port}")
        return connection
    except Error as e:
        logger.error(f"连接MySQL服务器出错: {e}")
        return None


def create_database(connection, database_name):
    """创建数据库"""
    try:
        cursor = connection.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{database_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        logger.info(f"数据库 '{database_name}' 已创建或已存在")
        return True
    except Error as e:
        logger.error(f"创建数据库出错: {e}")
        return False


def create_tables(connection):
    """创建所需的表"""
    cursor = connection.cursor()
    
    try:
        # 用户表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS `users` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `username` VARCHAR(50) NOT NULL UNIQUE,
            `password_hash` VARCHAR(255) NOT NULL,
            `email` VARCHAR(100) UNIQUE,
            `avatar_path` VARCHAR(255) DEFAULT NULL,
            `role` ENUM('user', 'admin') DEFAULT 'user',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            `last_login` TIMESTAMP NULL,
            `is_active` BOOLEAN DEFAULT TRUE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        logger.info("用户表已创建")
        
        # 视频表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS `videos` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `title` VARCHAR(255) NOT NULL,
            `description` TEXT,
            `file_path` VARCHAR(255) NOT NULL,
            `thumbnail_path` VARCHAR(255),
            `duration` INT,
            `user_id` INT,
            `upload_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `is_public` BOOLEAN DEFAULT TRUE,
            `view_count` INT DEFAULT 0,
            `category` VARCHAR(50),
            FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        logger.info("视频表已创建")
        
        # 问题表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS `questions` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `content` TEXT NOT NULL,
            `user_id` INT,
            `video_id` INT,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `status` ENUM('pending', 'answered', 'rejected') DEFAULT 'pending',
            FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
            FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        logger.info("问题表已创建")
        
        # 回答表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS `answers` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `content` TEXT NOT NULL,
            `question_id` INT NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `source` ENUM('ai', 'human') DEFAULT 'ai',
            FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        logger.info("回答表已创建")
        
        # 反馈表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS `feedback` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `content` TEXT NOT NULL,
            `user_id` INT,
            `question_id` INT,
            `answer_id` INT,
            `rating` INT,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
            FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE SET NULL,
            FOREIGN KEY (`answer_id`) REFERENCES `answers`(`id`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        logger.info("反馈表已创建")
        
        # 视图历史表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS `view_history` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT,
            `video_id` INT,
            `viewed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `duration_watched` INT DEFAULT 0,
            FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
            FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        logger.info("视图历史表已创建")
        
        # 用户登录历史表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS `login_history` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT,
            `login_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `ip_address` VARCHAR(45),
            `user_agent` TEXT,
            FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        logger.info("用户登录历史表已创建")
        
        connection.commit()
        logger.info("所有表已成功创建")
        return True
    except Error as e:
        connection.rollback()
        logger.error(f"创建表出错: {e}")
        return False


def create_admin_user(connection, admin_username, admin_password):
    """创建管理员用户"""
    from hashlib import sha256
    
    try:
        cursor = connection.cursor()
        
        # 检查用户是否已存在
        cursor.execute("SELECT id FROM `users` WHERE `username` = %s", (admin_username,))
        user = cursor.fetchone()
        
        if user:
            logger.info(f"管理员用户 '{admin_username}' 已存在")
            return True
        
        # 创建密码哈希
        password_hash = sha256(admin_password.encode()).hexdigest()
        
        # 创建管理员用户
        cursor.execute("""
        INSERT INTO `users` (`username`, `password_hash`, `role`)
        VALUES (%s, %s, 'admin')
        """, (admin_username, password_hash))
        
        connection.commit()
        logger.info(f"管理员用户 '{admin_username}' 已创建")
        return True
    except Error as e:
        connection.rollback()
        logger.error(f"创建管理员用户出错: {e}")
        return False


def main():
    """主函数"""
    print("="*50)
    print("未决定AI平台 - MySQL数据库初始化工具")
    print("="*50)
    print("\n该工具将帮助您创建MySQL数据库和所需表\n")
    
    # 获取MySQL连接信息
    host = get_user_input("MySQL主机地址", "localhost")
    port = int(get_user_input("MySQL端口", "3306"))
    root_user = get_user_input("MySQL管理员用户名", "root")
    root_password = get_user_input("MySQL管理员密码", "123456", password=True)
    
    # 连接到MySQL服务器
    connection = connect_to_mysql(host, root_user, root_password, port=port)
    if not connection:
        print("\n错误: 无法连接到MySQL服务器，请检查连接信息")
        sys.exit(1)
    
    # 获取数据库名称
    db_name = get_user_input("数据库名称", "ai_platform")
    
    # 创建数据库
    if not create_database(connection, db_name):
        connection.close()
        print("\n错误: 创建数据库失败")
        sys.exit(1)
    
    # 关闭连接并重新连接到新数据库
    connection.close()
    connection = connect_to_mysql(host, root_user, root_password, db_name, port)
    if not connection:
        print("\n错误: 无法连接到新创建的数据库")
        sys.exit(1)
    
    # 创建表
    if not create_tables(connection):
        connection.close()
        print("\n错误: 创建表失败")
        sys.exit(1)
    
    # 创建管理员用户
    admin_username = get_user_input("管理员用户名", "admin")
    admin_password = get_user_input("管理员密码", "admin123", password=True)
    
    if not create_admin_user(connection, admin_username, admin_password):
        connection.close()
        print("\n错误: 创建管理员用户失败")
        sys.exit(1)
    
    # 保存数据库配置
    config = {
        'host': host,
        'user': root_user,
        'password': root_password,
        'database': db_name,
        'port': port
    }
    
    if not save_config(config):
        print("\n警告: 保存数据库配置失败，但数据库和表已成功创建")
    
    # 关闭连接
    connection.close()
    
    print("\n"+"="*50)
    print("数据库初始化完成!")
    print(f"- 数据库名称: {db_name}")
    print(f"- 管理员用户: {admin_username}")
    print("="*50)
    
    print("\n您现在可以运行数据库管理工具来管理您的数据库")
    print("命令: python db_admin.py")


if __name__ == "__main__":
    main() 