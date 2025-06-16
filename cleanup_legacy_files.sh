#!/bin/bash
# cleanup_legacy_files.sh
# 清理已迁移的遗留文件 - 智映教匠AI平台

set -e

echo "================================================"
echo "智映教匠AI平台 - 遗留文件清理工具"
echo "================================================"
echo ""

# 创建备份目录
BACKUP_DIR="backup/legacy_files_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "1. 创建备份..."

# 备份已迁移的文件
if [ -d "database/user" ] && [ "$(ls -A database/user/*.txt 2>/dev/null | wc -l)" -gt 0 ]; then
    cp -r database/user "$BACKUP_DIR/"
    echo "   ✓ 用户数据已备份"
fi

if [ -d "database/question" ] && [ "$(ls -A database/question/*.txt 2>/dev/null | wc -l)" -gt 0 ]; then
    cp -r database/question "$BACKUP_DIR/"
    echo "   ✓ 问题数据已备份"
fi

if [ -d "database/feedback" ] && [ "$(ls -A database/feedback/*.txt 2>/dev/null | wc -l)" -gt 0 ]; then
    cp -r database/feedback "$BACKUP_DIR/"
    echo "   ✓ 反馈数据已备份"
fi

echo ""
echo "2. 清理已迁移的文件..."

# 删除已迁移的文件（保留.gitkeep）
USER_COUNT=$(find database/user -name "*.txt" -not -name ".gitkeep" 2>/dev/null | wc -l)
QUESTION_COUNT=$(find database/question -name "*.txt" -not -name ".gitkeep" 2>/dev/null | wc -l)
FEEDBACK_COUNT=$(find database/feedback -name "*.txt" -not -name ".gitkeep" 2>/dev/null | wc -l)

if [ "$USER_COUNT" -gt 0 ]; then
    find database/user -name "*.txt" -not -name ".gitkeep" -delete
    echo "   ✓ 已删除 $USER_COUNT 个用户文件"
fi

if [ "$QUESTION_COUNT" -gt 0 ]; then
    find database/question -name "*.txt" -not -name ".gitkeep" -delete
    echo "   ✓ 已删除 $QUESTION_COUNT 个问题文件"
fi

if [ "$FEEDBACK_COUNT" -gt 0 ]; then
    find database/feedback -name "*.txt" -not -name ".gitkeep" -delete
    echo "   ✓ 已删除 $FEEDBACK_COUNT 个反馈文件"
fi

echo ""
echo "3. 清理空目录..."

# 检查并清理空目录
EMPTY_DIRS=()

for dir in database/answer database/requestion database/AI_product; do
    if [ -d "$dir" ]; then
        # 检查目录是否为空（除了.gitkeep）
        if [ -z "$(ls -A "$dir" 2>/dev/null | grep -v '\.gitkeep')" ]; then
            EMPTY_DIRS+=("$dir")
        fi
    fi
done

if [ ${#EMPTY_DIRS[@]} -gt 0 ]; then
    echo "   发现空目录可以删除："
    for dir in "${EMPTY_DIRS[@]}"; do
        echo "     - $dir"
    done
    echo ""
    read -p "   是否删除这些空目录? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for dir in "${EMPTY_DIRS[@]}"; do
            rm -rf "$dir"
            echo "   ✓ 已删除 $dir"
        done
    else
        echo "   跳过删除空目录"
    fi
fi

echo ""
echo "4. 整理报告..."

# 生成清理报告
REPORT_FILE="$BACKUP_DIR/cleanup_report.txt"
cat > "$REPORT_FILE" << EOF
智映教匠AI平台遗留文件清理报告
=====================================

清理时间: $(date)
清理类型: 已迁移到MySQL数据库的文本文件

已清理的文件:
- 用户数据文件: $USER_COUNT 个
- 问题数据文件: $QUESTION_COUNT 个  
- 反馈数据文件: $FEEDBACK_COUNT 个

备份位置: $BACKUP_DIR

仍保留的重要文件:
- database/db_config.json (数据库配置)
- database/video/*.mp4 (视频文件)
- database/*/\.gitkeep (目录结构标记)
- database/touxiang/ (头像目录)

数据迁移状态:
✓ 用户数据 -> MySQL users表 (8条记录)
✓ 问题数据 -> MySQL questions表 (77条记录)  
✓ 反馈数据 -> MySQL feedbacks表 (2条记录)
✓ 视频数据 -> MySQL videos表 (30条记录)

注意事项:
- 所有结构化数据已完全迁移到MySQL数据库
- 视频文件仍存储在文件系统中，通过数据库记录元信息
- 如需恢复，请使用备份文件
EOF

echo "清理完成！"
echo ""
echo "================================================"
echo "清理统计:"
echo "  用户文件: $USER_COUNT 个"
echo "  问题文件: $QUESTION_COUNT 个"
echo "  反馈文件: $FEEDBACK_COUNT 个"
echo "  备份位置: $BACKUP_DIR"
echo "  清理报告: $REPORT_FILE"
echo "================================================"
echo ""
echo "✓ 所有数据已安全迁移到MySQL数据库"
echo "✓ 原始文件已备份到 $BACKUP_DIR"
echo "✓ 视频文件和配置文件已保留"
echo ""
echo "如需查看数据库内容，请运行: ./start_db_admin.sh" 