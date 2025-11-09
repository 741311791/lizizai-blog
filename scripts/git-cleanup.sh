#!/bin/bash

# Git 历史清理脚本
# 功能: 从 Git 历史中移除 backend/.env.production 文件
# 警告: 此操作会重写 Git 历史，需要团队成员重新克隆仓库

set -e

echo "================================"
echo "Git 历史清理脚本"
echo "================================"
echo ""
echo "⚠️  警告: 此操作将重写 Git 历史!"
echo "⚠️  执行后，所有团队成员需要重新克隆仓库"
echo ""
echo "将要移除的文件:"
echo "  - backend/.env.production"
echo ""
read -p "确认继续? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "操作已取消"
    exit 0
fi

echo ""
echo "📦 步骤 1: 创建备份..."
BACKUP_DIR="../lizizai-blog-backup-$(date +%Y%m%d-%H%M%S)"
cp -r . "$BACKUP_DIR"
echo "✅ 备份已创建: $BACKUP_DIR"

echo ""
echo "🔍 步骤 2: 检查文件是否存在于历史中..."
if git log --all --full-history -- backend/.env.production | grep -q commit; then
    echo "✅ 找到文件在历史中"
else
    echo "⚠️  文件未在历史中找到，可能已被清理"
    exit 0
fi

echo ""
echo "🧹 步骤 3: 从 Git 历史中移除文件..."

# 方法 1: 使用 git filter-branch (Git 内置)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env.production" \
  --prune-empty --tag-name-filter cat -- --all

echo "✅ 文件已从历史中移除"

echo ""
echo "🧹 步骤 4: 清理引用和垃圾回收..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "✅ 清理完成"

echo ""
echo "📋 步骤 5: 验证文件已被移除..."
if git log --all --full-history -- backend/.env.production | grep -q commit; then
    echo "❌ 警告: 文件仍在历史中"
    exit 1
else
    echo "✅ 验证通过: 文件已完全移除"
fi

echo ""
echo "================================"
echo "✅ Git 历史清理完成!"
echo "================================"
echo ""
echo "下一步操作:"
echo "1. 推送到远程仓库:"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "2. 通知团队成员重新克隆仓库:"
echo "   git clone <repository-url>"
echo ""
echo "⚠️  注意: 必须使用 --force 推送，这会重写远程历史"
