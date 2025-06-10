#!/bin/bash

# 导入视频的shell脚本
# 使用方法: ./import_videos.sh <视频目录> [用户ID] [标题前缀] [描述]

# 显示带颜色的信息
info() {
    echo -e "\033[0;32m[信息]\033[0m $1"
}

error() {
    echo -e "\033[0;31m[错误]\033[0m $1"
}

warning() {
    echo -e "\033[0;33m[警告]\033[0m $1"
}

# 检查参数
if [ $# -lt 1 ]; then
    echo "用法: $0 <视频目录> [用户ID] [标题前缀] [描述]"
    echo "例如: $0 /home/user/videos 1 '测试-' '这是一批测试视频'"
    exit 1
fi

# 获取参数
VIDEO_DIR="$1"
USER_ID="${2:-1}"  # 默认用户ID为1
TITLE_PREFIX="${3:-''}"
DESCRIPTION="${4:-'导入的测试视频'}"

# 检查目录是否存在
if [ ! -d "$VIDEO_DIR" ]; then
    error "目录不存在: $VIDEO_DIR"
    exit 1
fi

# 检查是否有视频文件
VIDEO_COUNT=$(find "$VIDEO_DIR" -type f \( -name "*.mp4" -o -name "*.avi" -o -name "*.mov" -o -name "*.wmv" -o -name "*.flv" -o -name "*.webm" -o -name "*.mkv" \) | wc -l)

if [ "$VIDEO_COUNT" -eq 0 ]; then
    warning "在 $VIDEO_DIR 中未找到支持的视频文件"
    exit 1
fi

info "在 $VIDEO_DIR 中找到 $VIDEO_COUNT 个视频文件"
info "开始导入视频到数据库..."

# 激活虚拟环境（如果存在）
if [ -d "venv" ]; then
    info "激活虚拟环境..."
    source venv/bin/activate
fi

# 运行Python脚本
python import_videos.py "$VIDEO_DIR" --user_id="$USER_ID" --title_prefix="$TITLE_PREFIX" --description="$DESCRIPTION"

# 导入完成
info "视频导入任务完成" 