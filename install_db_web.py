#!/usr/bin/env python3
"""
数据库Web管理工具安装脚本
======================
自动安装所需依赖包
"""

import subprocess
import sys
import os

def install_package(package):
    """安装Python包"""
    try:
        print(f"正在安装 {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ {package} 安装成功")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ {package} 安装失败")
        return False

def check_package(package):
    """检查包是否已安装"""
    try:
        __import__(package)
        return True
    except ImportError:
        return False

def main():
    """主函数"""
    print("=== 数据库Web管理工具安装程序 ===\n")
    
    # 检查Python版本
    if sys.version_info < (3, 7):
        print("❌ 错误：需要Python 3.7或更高版本")
        sys.exit(1)
    
    # 检查并安装依赖
    dependencies = [
        'flask',
        'rich',
        'sqlalchemy',
        'pymysql',
        'cryptography'
    ]
    
    success = True
    for package in dependencies:
        if not check_package(package):
            if not install_package(package):
                success = False
                break
    
    if success:
        print("\n✅ 所有依赖安装成功！")
        print("\n使用说明：")
        print("1. 运行 python db_web_manager.py 启动Web服务")
        print("2. 在浏览器中访问 http://localhost:5001")
    else:
        print("\n❌ 安装失败，请检查错误信息并重试")

if __name__ == "__main__":
    main() 