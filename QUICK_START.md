# 🚀 快速开始指南

## 一键启动

### 使用Docker Compose（推荐）

```bash
# 1. 克隆项目（如果还没有）
git clone <repository-url>
cd csv-converter

# 2. 一键启动
make start
# 或者
docker-compose up --build -d

# 3. 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:8000
# API文档: http://localhost:8000/docs
```

### 使用脚本启动

```bash
# 启动生产环境
./scripts/start.sh

# 启动开发环境
./scripts/start.sh dev

# 查看日志
./scripts/logs.sh

# 停止服务
./scripts/stop.sh
```

## 📝 使用步骤

### 1. 准备CSV文件
- 支持UTF-8或GBK编码
- 文件大小限制50MB
- 确保有明确的列标题

### 2. 配置处理参数
访问 http://localhost:3000，按以下步骤操作：

1. **上传CSV文件** - 拖拽或点击上传
2. **预览数据** - 检查文件结构和样本数据
3. **配置处理** - 设置以下参数：
   - 分块大小（建议20-100行）
   - 处理逻辑描述
   - 输出列定义
   - OpenAI API密钥
4. **开始处理** - 等待AI处理完成
5. **下载结果** - 获取处理后的CSV文件

### 3. 示例配置

```json
{
  "chunk_size": 40,
  "processing_logic": "请将每条用户问题分类为'同比分析'、'占比分析'、'趋势分析'、'其他'之一",
  "output_schema": [
    {
      "name": "question_id",
      "description": "原始数据中的问题编号"
    },
    {
      "name": "category",
      "description": "问题类型分类"
    }
  ],
  "llm_provider": "openai",
  "llm_model": "gpt-3.5-turbo",
  "api_key": "your-api-key",
  "max_retries": 3,
  "timeout": 30
}
```

## 🔧 常用命令

```bash
# 启动服务
make start          # 生产环境
make dev           # 开发环境

# 管理服务
make stop          # 停止服务
make restart       # 重启服务
make logs          # 查看日志
make status        # 查看状态

# 清理环境
make clean         # 清理容器和镜像

# 健康检查
make health        # 检查服务健康状态
```

## 📊 性能建议

### 分块大小设置
- 小文件（<1000行）：20-50行/块
- 中等文件（1000-10000行）：50-100行/块  
- 大文件（>10000行）：100-200行/块

### API使用优化
- 使用高速率限制的API密钥
- 合理设置重试次数和超时时间
- 监控API使用额度

## 🛠️ 故障排除

### 常见问题

**Q: 后端服务启动失败**
```bash
# 检查端口占用
netstat -an | grep 8000

# 查看详细日志
docker-compose logs backend
```

**Q: 前端无法访问**
```bash
# 检查容器状态
docker-compose ps

# 重启前端服务
docker-compose restart frontend
```

**Q: 文件处理失败**
- 检查API密钥是否正确
- 确认网络连接正常
- 查看错误日志详情

### 日志查看

```bash
# 查看所有日志
docker-compose logs -f

# 查看特定服务
docker-compose logs -f backend
docker-compose logs -f frontend

# 查看开发环境日志
docker-compose -f docker-compose.dev.yml logs -f
```

## 🎯 测试数据

项目提供了示例数据用于测试：

- `sample_data/finance_questions.csv` - 财务问题样本数据
- `sample_data/sample_config.json` - 示例配置文件

可以直接使用这些文件测试系统功能。

## 📞 获取帮助

1. 查看完整文档：`README.md`
2. 查看API文档：http://localhost:8000/docs
3. 查看项目日志排查问题
4. 提交Issue反馈问题

---

🎉 现在就开始使用CSV大模型处理引擎吧！
