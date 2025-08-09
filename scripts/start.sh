#!/bin/bash

# CSV大模型处理引擎启动脚本

set -e

echo "🚀 正在启动CSV大模型处理引擎..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 检查环境参数
ENVIRONMENT=${1:-"production"}

echo "📦 构建并启动服务 (环境: $ENVIRONMENT)..."

if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "development" ]; then
    echo "🔧 启动开发环境..."
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml up --build -d
    
    echo "✅ 开发环境启动完成!"
    echo "📱 前端地址: http://localhost:3000"
    echo "🔗 后端地址: http://localhost:8000"
    echo "📚 API文档: http://localhost:8000/docs"
    echo ""
    echo "📋 查看日志: docker-compose -f docker-compose.dev.yml logs -f"
    echo "🛑 停止服务: docker-compose -f docker-compose.dev.yml down"
    
else
    echo "🏭 启动生产环境..."
    docker-compose down
    docker-compose up --build -d
    
    echo "✅ 生产环境启动完成!"
    echo "📱 应用地址: http://localhost:3000"
    echo "🔗 后端地址: http://localhost:8000"
    echo "📚 API文档: http://localhost:8000/docs"
    echo ""
    echo "📋 查看日志: docker-compose logs -f"
    echo "🛑 停止服务: docker-compose down"
fi

echo ""
echo "⏳ 等待服务启动完成..."
sleep 10

# 健康检查
echo "🔍 检查服务状态..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ 后端服务正常"
else
    echo "⚠️  后端服务可能还在启动中，请稍后检查"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 前端服务正常"
else
    echo "⚠️  前端服务可能还在启动中，请稍后检查"
fi

echo ""
echo "🎉 服务启动完成！请访问 http://localhost:3000 开始使用"
