#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
智映教匠AI平台 - 数据库管理系统
Web版管理工具启动入口
端口: 8081 (与主AI平台和其他服务区分)
"""

from app import create_app
import logging

def main():
    """启动应用"""
    try:
        app = create_app()
        
        print("=" * 60)
        print("    智映教匠AI平台 - 数据库管理系统 (Web版)")
        print("=" * 60)
        print("🚀 服务启动中...")
        print("📍 访问地址: http://localhost:8081")
        print("📊 管理界面: http://localhost:8081/admin")
        print("🔧 API接口: http://localhost:8081/api")
        print("⚡ 按 Ctrl+C 停止服务")
        print("=" * 60)
        
        app.run(
            host='0.0.0.0',
            port=8081,
            debug=True,
            threaded=True
        )
        
    except KeyboardInterrupt:
        print("\n\n✅ 服务已安全停止")
    except Exception as e:
        logging.error(f"启动失败: {e}")
        print(f"\n❌ 服务启动失败: {e}")

if __name__ == '__main__':
    main() 