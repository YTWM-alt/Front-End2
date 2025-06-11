#!/bin/bash
# 修复视频加载问题脚本

echo "===== 修复视频加载问题 ====="

# 检查是否已激活虚拟环境
if [[ "$VIRTUAL_ENV" == "" ]]; then
    # 检查虚拟环境是否存在
    if [ -d "venv" ]; then
        echo "正在激活虚拟环境..."
        source venv/bin/activate
    else
        echo "正在创建虚拟环境..."
        python -m venv venv
        source venv/bin/activate
    fi
fi

# 安装依赖
echo "正在安装必要的依赖..."
pip install moviepy numpy flask flask-sqlalchemy

# 创建必要的目录
echo "正在创建必要的目录..."
mkdir -p database/video

# 测试数据库连接
echo "测试数据库连接..."
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); print('数据库连接成功' if db.engine.connect() else '数据库连接失败')"

if [ $? -ne 0 ]; then
    echo "数据库连接失败，请检查配置"
    exit 1
fi

# 生成测试视频
echo "生成测试视频并添加到数据库..."
python test_video.py

if [ $? -ne 0 ]; then
    echo "生成测试视频失败"
    exit 1
fi

# 启动后端服务
echo "正在启动后端服务..."
./start.sh &
BACKEND_PID=$!

# 等待后端服务启动
echo "等待后端服务启动..."
sleep 5

# 启动前端服务
echo "正在启动前端服务..."
cd react && npm start &
FRONTEND_PID=$!

echo "服务已启动！"
echo "后端PID: $BACKEND_PID"
echo "前端PID: $FRONTEND_PID"
echo "现在可以在浏览器中访问 http://localhost:3000 测试视频加载功能"
echo "按Ctrl+C停止服务"

# 捕获中断信号
trap "kill $BACKEND_PID $FRONTEND_PID; echo '服务已停止'; exit" INT

# 保持脚本运行
wait 