#!/bin/bash
# 智映教匠AI平台 - 数据库管理系统启动脚本

echo "🚀 智映教匠AI平台 - 数据库管理系统"
echo "================================================"

# 检查Python和Node.js
echo "📋 检查环境依赖..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装Python3"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装npm"
    exit 1
fi

echo "✅ 环境检查通过"

# 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
if [ ! -d "venv" ]; then
    echo "创建Python虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

echo "✅ 后端依赖安装完成"

# 安装前端依赖
echo "📦 安装前端依赖..."
cd ../frontend
npm install

echo "✅ 前端依赖安装完成"

echo "================================================"
echo "🔒 严格端口检查..."

# 检查和清理5173端口
echo "🔍 检查前端端口5173..."
if lsof -i:5173 >/dev/null 2>&1; then
    echo "⚠️  端口5173被占用，正在清理..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    sleep 2
    if lsof -i:5173 >/dev/null 2>&1; then
        echo "❌ 无法清理端口5173，请手动处理"
        exit 1
    fi
    echo "✅ 端口5173已清理"
else
    echo "✅ 端口5173可用"
fi

# 检查和清理8081端口  
echo "🔍 检查后端端口8081..."
if lsof -i:8081 >/dev/null 2>&1; then
    echo "⚠️  端口8081被占用，正在清理..."
    lsof -ti:8081 | xargs kill -9 2>/dev/null
    sleep 2
    if lsof -i:8081 >/dev/null 2>&1; then
        echo "❌ 无法清理端口8081，请手动处理"
        exit 1
    fi
    echo "✅ 端口8081已清理"
else
    echo "✅ 端口8081可用"
fi

echo "================================================"
echo "🎯 启动服务..."
echo "📍 后端API: http://localhost:8081 (严格模式)"
echo "🎨 前端界面: http://localhost:5173 (严格模式)"
echo "📊 管理入口: http://localhost:5173/dashboard"
echo "🚫 备用端口: 已禁用"
echo "================================================"

# 启动后端服务（后台运行）
echo "🔧 启动后端服务..."
cd ../backend
source venv/bin/activate
python run.py &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端服务（严格模式）
echo "🎨 启动前端服务（严格模式）..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ 所有服务已启动"
echo "💡 按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo ''; echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID; echo '✅ 所有服务已停止'; exit 0" INT

# 保持脚本运行
wait 