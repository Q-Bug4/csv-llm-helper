#!/bin/bash

# CSV大模型处理引擎日志查看脚本

# 检查环境参数
ENVIRONMENT=${1:-"production"}
SERVICE=${2:-""}

if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "development" ]; then
    echo "📋 查看开发环境日志..."
    if [ -n "$SERVICE" ]; then
        docker-compose -f docker-compose.dev.yml logs -f "$SERVICE"
    else
        docker-compose -f docker-compose.dev.yml logs -f
    fi
else
    echo "📋 查看生产环境日志..."
    if [ -n "$SERVICE" ]; then
        docker-compose logs -f "$SERVICE"
    else
        docker-compose logs -f
    fi
fi
