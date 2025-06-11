#!/usr/bin/env python3
"""
MySQL数据库初始化脚本
用于创建MySQL数据库和用户
"""

import os
import subprocess
import sys
import getpass
from pathlib import Path

# 颜色输出
GREEN = '\033[0;32m'
RED = '\033[0;31m'
YELLOW = '\033[1;33m'
NC = '\033[0m'  # No Color

def print_success(message):
    print(f"{GREEN}[成功] {message}{NC}")

def print_error(message):
    print(f"{RED}[错误] {message}{NC}")

def print_warning(message):
    print(f"{YELLOW}[警告] {message}{NC}")

def print_info(message):
    print(f"[信息] {message}")

def run_mysql_command(command, root_password=None, as_root=True):
    """运行MySQL命令"""
    cmd = ["mysql"]
    
    if as_root and root_password:
        cmd.extend(["-u", "root", f"-p{root_password}"])
    
    cmd.extend(["-e", command])
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print_error(f"MySQL命令执行失败: {result.stderr}")
            return False, result.stderr
        return True, result.stdout
    except Exception as e:
        print_error(f"执行MySQL命令时出错: {str(e)}")
        return False, str(e)

def create_database(db_name, db_user, db_password, root_password):
    """创建数据库和用户"""
    # 创建数据库
    print_info(f"正在创建数据库 {db_name}...")
    success, output = run_mysql_command(
        f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
        root_password
    )
    if not success:
        print_error(f"创建数据库失败: {output}")
        return False
    
    # 创建用户并授权
    print_info(f"正在创建用户 {db_user} 并授权...")
    success, output = run_mysql_command(
        f"CREATE USER IF NOT EXISTS '{db_user}'@'localhost' IDENTIFIED BY '{db_password}';",
        root_password
    )
    if not success:
        print_error(f"创建用户失败: {output}")
        return False
    
    # 授权
    success, output = run_mysql_command(
        f"GRANT ALL PRIVILEGES ON {db_name}.* TO '{db_user}'@'localhost';",
        root_password
    )
    if not success:
        print_error(f"授权失败: {output}")
        return False
    
    # 刷新权限
    success, output = run_mysql_command(
        "FLUSH PRIVILEGES;",
        root_password
    )
    if not success:
        print_error(f"刷新权限失败: {output}")
        return False
    
    print_success(f"数据库 {db_name} 和用户 {db_user} 创建成功")
    return True

def create_env_file(db_name, db_user, db_password):
    """创建.env文件"""
    env_path = Path(".env")
    
    if env_path.exists():
        print_warning(".env文件已存在，将会被覆盖")
    
    with open(env_path, "w") as f:
        f.write(f"FLASK_APP=run.py\n")
        f.write(f"FLASK_ENV=development\n")
        f.write(f"FLASK_DEBUG=1\n")
        f.write(f"FLASK_HOST=0.0.0.0\n")
        f.write(f"FLASK_PORT=3003\n")
        f.write(f"MYSQL_HOST=localhost\n")
        f.write(f"MYSQL_PORT=3306\n")
        f.write(f"MYSQL_USER={db_user}\n")
        f.write(f"MYSQL_PASSWORD={db_password}\n")
        f.write(f"MYSQL_DATABASE={db_name}\n")
        f.write(f"SECRET_KEY={os.urandom(24).hex()}\n")
    
    print_success(".env文件创建成功")

def main():
    """主函数"""
    print_info("欢迎使用未决定AI平台数据库初始化工具")
    print_info("该工具将创建MySQL数据库和用户，并生成.env配置文件")
    print_info("请确保您的MySQL服务已启动并且具有root权限")
    
    # 获取数据库信息
    db_name = input(f"请输入数据库名称 [ai_platform]: ") or "ai_platform"
    db_user = input(f"请输入数据库用户名 [ai_user]: ") or "ai_user"
    db_password = getpass.getpass(f"请输入数据库密码 [ai_password]: ") or "ai_password"
    
    # 获取MySQL root密码
    root_password = getpass.getpass("请输入MySQL root密码: ")
    
    # 测试MySQL连接
    print_info("正在测试MySQL连接...")
    success, _ = run_mysql_command("SELECT VERSION();", root_password)
    if not success:
        print_error("无法连接到MySQL，请检查root密码和MySQL服务状态")
        return
    
    # 创建数据库和用户
    if create_database(db_name, db_user, db_password, root_password):
        # 创建.env文件
        create_env_file(db_name, db_user, db_password)
        
        print_success("数据库初始化完成！")
        print_info("现在您可以运行以下命令启动应用：")
        print_info("  flask db init      # 初始化迁移")
        print_info("  flask db migrate   # 创建迁移")
        print_info("  flask db upgrade   # 应用迁移")
        print_info("  python run.py      # 启动应用")
    else:
        print_error("数据库初始化失败")

if __name__ == "__main__":
    main() 