# 亲子伴读 Business Service Dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package.json package-lock.json* ./
RUN npm ci --production

# 复制Prisma schema并生成客户端
COPY prisma ./prisma/
RUN npx prisma generate

# 复制应用代码
COPY . .

# 创建上传目录
RUN mkdir -p /app/uploads

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "src/index.js"]
