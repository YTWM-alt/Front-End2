#!/bin/bash
# 智映教匠AI平台 - 数据库管理工具启动脚本

# 彩色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}   智映教匠AI平台 - 数据库管理工具启动脚本   ${NC}"
echo -e "${BLUE}==========================================${NC}"

# 确保脚本在正确的目录中执行
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# 检查是否已激活虚拟环境
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo -e "${YELLOW}正在激活虚拟环境...${NC}"
    # 检查虚拟环境是否存在
    if [ -d "venv" ]; then
        source venv/bin/activate
    else
        echo -e "${RED}错误: 虚拟环境不存在!${NC}"
        echo -e "${YELLOW}正在为您创建虚拟环境...${NC}"
        python3 -m venv venv
        source venv/bin/activate
        echo -e "${GREEN}虚拟环境已创建并激活!${NC}"
    fi
else
    echo -e "${GREEN}已检测到激活的虚拟环境: $VIRTUAL_ENV${NC}"
fi

# 检查和安装依赖
echo -e "${YELLOW}检查所需依赖...${NC}"
pip install -q mysql-connector-python Flask werkzeug Flask-SQLAlchemy

# 确保目录存在
mkdir -p logs
mkdir -p templates/db_admin
mkdir -p static/db_admin

# 检查MySQL服务是否运行
echo -e "${YELLOW}检查MySQL服务状态...${NC}"
if systemctl is-active --quiet mysql; then
    echo -e "${GREEN}MySQL服务正在运行${NC}"
else
    echo -e "${RED}MySQL服务未运行!${NC}"
    echo -e "${YELLOW}尝试启动MySQL服务...${NC}"
    sudo systemctl start mysql
    
    if systemctl is-active --quiet mysql; then
        echo -e "${GREEN}MySQL服务已成功启动${NC}"
    else
        echo -e "${RED}无法启动MySQL服务，请手动启动后再试${NC}"
        echo -e "${YELLOW}您可以运行以下命令来启动MySQL:${NC}"
        echo -e "    ${BLUE}sudo systemctl start mysql${NC}"
        exit 1
    fi
fi

# 确保日志目录存在
mkdir -p logs

# 清空现有日志
> logs/db_admin.log

# 启动日志实时显示（后台进程）
echo -e "${GREEN}启动日志实时显示...${NC}"
( tail -f logs/db_admin.log & ) 2>/dev/null
LOG_PID=$!

# 显示分隔线
echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}            实时日志输出               ${NC}"
echo -e "${BLUE}==========================================${NC}"

# 启动数据库管理工具
echo -e "${GREEN}启动数据库管理工具...${NC}"
python3 db_admin_run.py

# 终止日志查看进程
kill $LOG_PID 2>/dev/null 