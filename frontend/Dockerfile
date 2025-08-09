# CSV大模型处理引擎前端Dockerfile

# 构建阶段
FROM node:18-alpine as builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建应用
ENV DISABLE_ESLINT_PLUGIN=true
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制自定义nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建结果
COPY --from=builder /app/build /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
