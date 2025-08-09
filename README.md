# CSV大模型处理引擎

基于大语言模型的通用CSV数据处理平台，支持配置驱动的数据分析和处理。

## 🚀 功能特性

- **配置驱动**: 通过JSON配置文件定义处理逻辑，无需修改代码
- **分块处理**: 自动将大型CSV文件分割成小块，适应LLM上下文限制
- **多模型支持**: 支持OpenAI GPT系列模型
- **实时预览**: 上传文件后可预览数据结构和样本
- **进度跟踪**: 实时显示处理进度和统计信息
- **结果下载**: 处理完成后可下载结果CSV文件
- **配置管理**: 支持保存、加载、导入导出配置
- **容器化部署**: 提供Docker和Docker Compose支持

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React前端     │    │   FastAPI后端   │    │   LLM API      │
│                 │    │                 │    │                 │
│ - 文件上传      │───▶│ - 数据分块      │───▶│ - OpenAI        │
│ - 配置管理      │    │ - 提示词生成    │    │ - 其他模型       │
│ - 进度显示      │    │ - 结果汇总      │    │                 │
│ - 结果下载      │    │ - API路由       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📦 项目结构

```
csv-converter/
├── backend/                 # 后端服务
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── core/           # 核心处理模块
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务服务
│   │   └── main.py         # 应用入口
│   ├── requirements.txt    # Python依赖
│   └── Dockerfile         # 后端容器配置
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── utils/          # 工具函数
│   │   └── App.js          # 主应用
│   ├── package.json        # 前端依赖
│   ├── Dockerfile         # 前端容器配置
│   └── nginx.conf         # Nginx配置
├── docker-compose.yml      # 生产环境编排
├── docker-compose.dev.yml  # 开发环境编排
└── README.md              # 项目文档
```

## 🛠️ 开发环境搭建

### 方式一：Docker Compose（推荐）

1. **克隆项目**
```bash
git clone <repository-url>
cd csv-converter
```

2. **启动开发环境**
```bash
# 启动开发环境（支持热重载）
docker-compose -f docker-compose.dev.yml up --build

# 或者启动生产环境
docker-compose up --build
```

3. **访问应用**
- 前端: http://localhost:3000
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

### 方式二：本地开发

#### 后端启动

1. **安装Python依赖**
```bash
cd backend
pip install -r requirements.txt
```

2. **启动后端服务**
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 前端启动

1. **安装Node.js依赖**
```bash
cd frontend
npm install
```

2. **启动前端服务**
```bash
npm start
```

## 📝 使用指南

### 基本使用流程

1. **上传CSV文件**
   - 支持拖拽上传或点击选择
   - 文件大小限制50MB
   - 支持UTF-8和GBK编码

2. **预览数据**
   - 查看文件基本信息（行数、列数、编码）
   - 预览前10行样本数据
   - 分析列数据类型

3. **配置处理参数**
   - 设置分块大小（建议20-100行）
   - 描述处理逻辑（自然语言）
   - 配置输出列结构
   - 输入API密钥

4. **开始处理**
   - 系统自动分块处理
   - 实时显示处理进度
   - 查看成功/失败统计

5. **下载结果**
   - 处理完成后下载CSV结果文件

### 配置示例

```json
{
  "chunk_size": 40,
  "processing_logic": "请将每条用户问题分类为'同比分析'、'占比分析'、'趋势分析'、'其他'之一。如果是同比分析，请提取涉及的年份区间；如果是占比分析，请提取涉及的指标名称；否则留空。",
  "output_schema": [
    {
      "name": "question_id",
      "description": "原始数据中的问题编号"
    },
    {
      "name": "category", 
      "description": "问题类型：同比分析、占比分析、趋势分析、其他"
    },
    {
      "name": "extra_info",
      "description": "针对同比分析提取年份区间，针对占比分析提取指标名称，其他类型为空"
    }
  ],
  "llm_provider": "openai",
  "llm_model": "gpt-3.5-turbo",
  "api_key": "your-api-key",
  "max_retries": 3,
  "timeout": 30
}
```

## 🐳 部署指南

### 生产环境部署

1. **使用Docker Compose**
```bash
# 克隆项目
git clone <repository-url>
cd csv-converter

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

2. **服务访问**
- 应用入口: http://localhost:3000
- 后端API: http://localhost:8000

### 环境变量配置

创建 `.env` 文件（可选）：

```bash
# 后端配置
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000

# 前端配置
REACT_APP_API_URL=/api/v1
```

## 🔧 API接口

### 主要端点

- `POST /api/v1/process` - 处理CSV文件
- `POST /api/v1/preview` - 预览CSV数据  
- `GET /api/v1/download/{file_path}` - 下载结果文件
- `POST /api/v1/validate-config` - 验证配置
- `GET /api/v1/health` - 健康检查
- `GET /api/v1/models` - 获取支持的模型

详细API文档访问: http://localhost:8000/docs

## 🧪 测试

### 后端测试
```bash
cd backend
pytest tests/ -v
```

### 前端测试
```bash
cd frontend
npm test
```

## 📊 性能优化建议

1. **分块大小调优**
   - 小文件（<1000行）：20-50行/块
   - 中等文件（1000-10000行）：50-100行/块
   - 大文件（>10000行）：100-200行/块

2. **API密钥管理**
   - 使用高速率限制的API密钥
   - 考虑使用多个密钥轮询

3. **系统资源**
   - 推荐4GB+内存
   - SSD存储提升文件I/O性能

## 🔒 安全考虑

- 文件大小限制（50MB）
- 路径遍历防护
- CORS配置
- API密钥本地存储
- 请求超时限制

## 🐛 故障排除

### 常见问题

1. **后端服务无法启动**
   - 检查端口8000是否被占用
   - 验证Python依赖是否正确安装

2. **前端无法连接后端**
   - 确认后端服务运行正常
   - 检查代理配置

3. **文件上传失败**
   - 检查文件格式（仅支持CSV）
   - 验证文件编码（UTF-8/GBK）
   - 确认文件大小在限制内

4. **处理失败**
   - 验证API密钥有效性
   - 检查网络连接
   - 查看错误日志

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs backend
docker-compose logs frontend

# 实时查看日志
docker-compose logs -f
```

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 支持

如有问题或建议，请创建Issue或联系开发团队。

---

**CSV大模型处理引擎** - 让AI处理您的数据 🚀
