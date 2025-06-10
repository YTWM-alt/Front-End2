#!/usr/bin/env python3
"""
数据库GUI管理工具安装脚本
======================
自动安装所需依赖包
"""

import subprocess
import sys
import os
import platform

def install_system_package(package):
    """安装系统包"""
    try:
        print(f"正在安装系统包 {package}...")
        subprocess.check_call(['sudo', 'apt-get', 'install', '-y', package])
        print(f"✅ {package} 安装成功")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ {package} 安装失败")
        return False

def install_pip_package(package):
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

def is_ubuntu():
    """检查是否是Ubuntu系统"""
    return 'ubuntu' in platform.platform().lower()

def main():
    """主函数"""
    print("=== 数据库GUI管理工具安装程序 ===\n")
    
    # 检查Python版本
    if sys.version_info < (3, 7):
        print("❌ 错误：需要Python 3.7或更高版本")
        sys.exit(1)
    
    # 在Ubuntu系统上安装tkinter
    if is_ubuntu():
        print("检测到Ubuntu系统，准备安装tkinter...")
        if not check_package('tkinter'):
            if not install_system_package('python3-tk'):
                print("❌ 安装tkinter失败，请手动运行：")
                print("sudo apt-get install python3-tk")
                sys.exit(1)
    
    # 检查并安装pip依赖
    pip_dependencies = [
        'rich',     # 控制台美化
        'sqlalchemy'  # 数据库ORM
    ]
    
    success = True
    for package in pip_dependencies:
        if not check_package(package):
            if not install_pip_package(package):
                success = False
                break
        else:
            print(f"✓ {package} 已安装")
    
    if success:
        print("\n✅ 所有依赖安装成功！")
        print("\n现在你可以运行 python db_gui_manager.py 来启动数据库管理工具。")
    else:
        print("\n❌ 安装失败，请检查错误信息并重试。")

if __name__ == "__main__":
    main() 