#!/bin/bash

# CSV大模型处理引擎停止脚本

set -e

echo "🛑 正在停止CSV大模型处理引擎..."

# 检查环境参数
ENVIRONMENT=${1:-"production"}

if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "development" ]; then
    echo "🔧 停止开发环境..."
    docker-compose -f docker-compose.dev.yml down
    
    # 可选：清理容器和镜像
    if [ "$2" = "--clean" ]; then
        echo "🧹 清理开发环境容器和镜像..."
        docker-compose -f docker-compose.dev.yml down --rmi all --volumes --remove-orphans
    fi
    
    echo "✅ 开发环境已停止"
    
else
    echo "🏭 停止生产环境..."
    docker-compose down
    
    # 可选：清理容器和镜像
    if [ "$2" = "--clean" ]; then
        echo "🧹 清理生产环境容器和镜像..."
        docker-compose down --rmi all --volumes --remove-orphans
    fi
    
    echo "✅ 生产环境已停止"
fi

echo "✨ 服务已完全停止"
