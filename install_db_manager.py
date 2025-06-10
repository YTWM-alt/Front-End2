#!/usr/bin/env python3
"""
数据库管理工具安装脚本
===================
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
    print("🔧 数据库管理工具安装向导")
    print("=" * 40)
    
    # 检查是否在虚拟环境中
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("✅ 检测到虚拟环境")
    else:
        print("⚠️  建议在虚拟环境中运行此脚本")
        choice = input("是否继续？(y/N): ").lower().strip()
        if choice != 'y':
            print("安装已取消")
            return
    
    # 需要安装的包
    packages = ['rich']
    
    print("\n📦 开始安装依赖包...")
    
    all_success = True
    for package in packages:
        if check_package(package):
            print(f"✅ {package} 已安装")
        else:
            if not install_package(package):
                all_success = False
    
    print("\n" + "=" * 40)
    if all_success:
        print("🎉 所有依赖安装完成！")
        print("\n使用方法:")
        print("python db_manager.py")
        
        # 检查数据库管理脚本是否存在
        if os.path.exists('db_manager.py'):
            print("\n✅ 数据库管理脚本已就绪")
            
            choice = input("\n是否立即运行数据库管理工具？(y/N): ").lower().strip()
            if choice == 'y':
                print("\n🚀 启动数据库管理工具...")
                try:
                    subprocess.run([sys.executable, "db_manager.py"])
                except KeyboardInterrupt:
                    print("\n👋 数据库管理工具已退出")
        else:
            print("❌ 数据库管理脚本 db_manager.py 不存在")
    else:
        print("❌ 部分依赖安装失败，请手动安装")
        print("手动安装命令: pip install rich")

if __name__ == "__main__":
    main() 