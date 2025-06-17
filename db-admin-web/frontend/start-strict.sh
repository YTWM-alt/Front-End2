#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔒 严格端口模式启动 - 仅限5173端口${NC}"
echo "================================================"

# 检查5173端口是否被占用
echo -e "${YELLOW}🔍 检查端口5173占用情况...${NC}"
if lsof -i:5173 >/dev/null 2>&1; then
    echo -e "${RED}❌ 端口5173被占用！${NC}"
    echo "占用进程信息："
    lsof -i:5173
    echo ""
    echo -e "${RED}请先停止占用端口的服务，然后重新启动${NC}"
    echo -e "${YELLOW}手动清理命令: npm run kill-port${NC}"
    exit 1
else
    echo -e "${GREEN}✅ 端口5173可用${NC}"
fi

echo ""
echo -e "${GREEN}🚀 启动前端服务 (严格端口模式)${NC}"
echo "- 固定端口: 5173"
echo "- 备用端口: 已禁用"
echo "- 自动清理: 已禁用"
echo "- 冲突处理: 报错退出"
echo "================================================"

# 启动Vite开发服务器
npm run dev 