# 基于 Node.js 20 Alpine
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 拷贝 package.json 安装依赖
COPY package*.json ./
RUN npm install

# 拷贝项目文件
COPY . .

# 暴露容器 HTTPS 端口
EXPOSE 3311

# 启动 Node.js 服务器
CMD ["node", "server/server.js"]