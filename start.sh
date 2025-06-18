#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 消息函数
print_success() {
    echo -e "${GREEN}[成功] $1${NC}"
}

print_error() {
    echo -e "${RED}[错误] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[警告] $1${NC}"
}

print_info() {
    echo -e "[智映教匠AI平台] $1"
}

# 检查Python3
check_python() {
    if command -v python3 &>/dev/null; then
        version=$(python3 --version 2>&1 | awk '{print $2}')
        print_success "Python3已安装: Python $version"
        return 0
    else
        print_error "未找到Python3，请先安装Python3"
        exit 1
    fi
}

# 检查虚拟环境
check_venv() {
    if [ ! -d "venv" ]; then
        print_info "创建虚拟环境..."
        python3 -m venv venv
        if [ $? -eq 0 ]; then
            print_success "虚拟环境创建成功"
        else
            print_error "虚拟环境创建失败"
            exit 1
        fi
    fi
}

# 检查系统依赖
check_system_deps() {
    print_info "检查系统依赖..."
    
    # 检查libmagic
    if ! ldconfig -p | grep -q libmagic; then
        print_warning "未找到libmagic，尝试安装..."
        sudo apt-get update && sudo apt-get install -y libmagic1
    fi
    
    # 检查ffmpeg
    if ! command -v ffmpeg &>/dev/null; then
        print_warning "未找到ffmpeg，尝试安装..."
        sudo apt-get update && sudo apt-get install -y ffmpeg
    fi
    
    print_success "系统依赖检查完成"
}

# 安装项目依赖
install_deps() {
    print_info "安装项目依赖..."
    source venv/bin/activate
    
    # 使用 -q 参数减少输出
    pip install -q --upgrade pip
    pip install -q -r requirements.txt
    
    if [ $? -eq 0 ]; then
        print_success "依赖安装完成"
    else
        print_error "依赖安装失败"
        exit 1
    fi
}

# 检查环境变量
check_env() {
    if [ ! -f ".env" ]; then
        print_info "创建.env文件..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "已从.env.example创建.env文件"
        else
            # 创建默认的.env文件
            cat > .env << EOL
FLASK_APP=app
FLASK_DEBUG=1
FLASK_HOST=0.0.0.0
FLASK_PORT=3003
SECRET_KEY=dev-key-please-change-in-production
EOL
            print_success "已创建默认.env文件"
        fi
    fi
}

# 启动服务
start_service() {
    print_info "启动服务..."
    source venv/bin/activate
    
    # 从.env文件读取端口
    PORT=$(grep FLASK_PORT .env | cut -d '=' -f2)
    print_info "服务将在 http://localhost:${PORT:-3003} 启动"
    
    # 启动Python服务
    python run.py
}

# 主函数
main() {
    print_info "开始启动智映教匠AI平台后端服务..."
    
    # 检查Python
    check_python
    
    # 检查系统依赖
    check_system_deps
    
    # 检查虚拟环境
    check_venv
    
    # 安装依赖
    install_deps
    
    # 检查环境变量
    check_env
    
    # 启动服务
    start_service
}

# 捕获Ctrl+C
trap 'echo -e "\n${YELLOW}[智映教匠AI平台] 服务已停止${NC}"; exit 0' INT

# 运行主函数
main 