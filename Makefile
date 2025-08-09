# CSV大模型处理引擎 Makefile

.PHONY: help start stop restart logs clean dev prod test build

# 默认目标
help:
	@echo "CSV大模型处理引擎 - 可用命令:"
	@echo ""
	@echo "🚀 启动命令:"
	@echo "  make start     - 启动生产环境"
	@echo "  make dev       - 启动开发环境"
	@echo "  make prod      - 启动生产环境"
	@echo ""
	@echo "🛑 停止命令:"
	@echo "  make stop      - 停止服务"
	@echo "  make clean     - 停止服务并清理容器"
	@echo ""
	@echo "🔄 管理命令:"
	@echo "  make restart   - 重启服务"
	@echo "  make logs      - 查看日志"
	@echo ""
	@echo "🧪 开发命令:"
	@echo "  make test      - 运行测试"
	@echo "  make build     - 构建镜像"
	@echo ""

# 启动生产环境
start prod:
	@echo "🚀 启动生产环境..."
	docker-compose up --build -d
	@echo "✅ 生产环境启动完成"
	@echo "📱 访问地址: http://localhost:3000"

# 启动开发环境
dev:
	@echo "🔧 启动开发环境..."
	docker-compose -f docker-compose.dev.yml up --build -d
	@echo "✅ 开发环境启动完成"
	@echo "📱 前端地址: http://localhost:3000"
	@echo "🔗 后端地址: http://localhost:8000"

# 停止服务
stop:
	@echo "🛑 停止服务..."
	docker-compose down
	docker-compose -f docker-compose.dev.yml down
	@echo "✅ 服务已停止"

# 重启服务
restart:
	@echo "🔄 重启服务..."
	$(MAKE) stop
	$(MAKE) start

# 查看日志
logs:
	@echo "📋 查看日志..."
	docker-compose logs -f

# 查看开发环境日志
logs-dev:
	@echo "📋 查看开发环境日志..."
	docker-compose -f docker-compose.dev.yml logs -f

# 清理容器和镜像
clean:
	@echo "🧹 清理容器和镜像..."
	docker-compose down --rmi all --volumes --remove-orphans
	docker-compose -f docker-compose.dev.yml down --rmi all --volumes --remove-orphans
	docker system prune -f
	@echo "✅ 清理完成"

# 构建镜像
build:
	@echo "🔨 构建镜像..."
	docker-compose build --no-cache

# 运行测试
test:
	@echo "🧪 运行后端测试..."
	docker-compose exec backend pytest tests/ -v
	@echo "🧪 运行前端测试..."
	docker-compose exec frontend npm test

# 健康检查
health:
	@echo "🔍 检查服务健康状态..."
	@curl -s http://localhost:8000/health || echo "❌ 后端服务异常"
	@curl -s http://localhost:3000 > /dev/null && echo "✅ 前端服务正常" || echo "❌ 前端服务异常"

# 查看服务状态
status:
	@echo "📊 服务状态:"
	docker-compose ps
