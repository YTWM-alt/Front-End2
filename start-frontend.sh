#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[智映教匠AI平台]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[成功]${NC} $1"
}

print_error() {
    echo -e "${RED}[错误]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[警告]${NC} $1"
}

# 检查Node.js是否安装
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "未检测到Node.js，请先安装Node.js"
        exit 1
    fi
    NODE_VERSION=$(node -v)
    print_success "Node.js已安装: $NODE_VERSION"
}

# 检查npm是否安装
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "未检测到npm，请先安装npm"
        exit 1
    fi
    NPM_VERSION=$(npm -v)
    print_success "npm已安装: $NPM_VERSION"
}

# 安装依赖
install_deps() {
    print_message "安装前端依赖..."
    cd react
    npm install -q
    if [ $? -eq 0 ]; then
        print_success "依赖安装完成"
    else
        print_error "依赖安装失败"
        exit 1
    fi
    cd ..
}

# 启动前端服务
start_frontend() {
    print_message "启动前端服务..."
    cd react
    print_message "前端服务将在 http://localhost:3000 启动"
    echo ""
    echo "    ╔═══════════════════════════════════════╗"
    echo "    ║        智映教匠AI平台前端服务          ║"
    echo "    ╚═══════════════════════════════════════╝"
    echo ""
    echo "🚀 服务正在启动..."
    echo "📍 地址: http://localhost:3000"
    echo "🔧 开发模式: 开启"
    echo ""
    echo "按 Ctrl+C 停止服务"
    echo ""
    npm start
}

# 主函数
main() {
    print_message "开始启动智映教匠AI平台前端服务..."
    
    # 检查环境
    check_node
    check_npm
    
    # 安装依赖
    install_deps
    
    # 启动服务
    start_frontend
}

# 捕获Ctrl+C
trap 'print_message "正在停止服务..."; exit 0' INT

# 运行主函数
main 