#!/bin/bash
# ============================================================
# 亲子伴读 App - 开发环境一键启动脚本
#
# 使用方法:
#   chmod +x scripts/start-dev.sh
#   ./scripts/start-dev.sh
#
# 前置条件:
#   - Docker & Docker Compose 已安装
#   - Node.js >= 18
#   - Python >= 3.11
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 亲子伴读 App - 开发环境启动"
echo "=================================="
echo ""

# ============================================================
# 1. 检查环境
# ============================================================
echo "📋 检查环境..."

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "  ❌ $1 未安装"
        return 1
    fi
    echo "  ✅ $1 已就绪"
    return 0
}

check_command docker || exit 1
check_command node || exit 1
check_command python3 || exit 1

echo ""

# ============================================================
# 2. 检查/创建 .env 文件
# ============================================================
echo "📝 检查配置文件..."

if [ ! -f "$PROJECT_DIR/docker/.env" ]; then
    echo "  ⚠️  docker/.env 不存在，从模板创建..."
    cp "$PROJECT_DIR/docker/.env.example" "$PROJECT_DIR/docker/.env"
    echo "  📝 请编辑 docker/.env 填写 API Key 等配置"
fi

if [ ! -f "$PROJECT_DIR/backend/ai-service/.env" ]; then
    echo "  ⚠️  ai-service/.env 不存在，从模板创建..."
    cat > "$PROJECT_DIR/backend/ai-service/.env" << EOF
AI_VOICE_CLONE_ENGINE=fish_audio
AI_FISH_AUDIO_API_URL=https://api.fish.audio
AI_FISH_AUDIO_API_KEY=your-api-key-here
AI_DEBUG=true
AI_STORAGE_BACKEND=local
AI_LOCAL_STORAGE_PATH=./storage
AI_REDIS_URL=redis://localhost:6379/0
EOF
    echo "  📝 请编辑 backend/ai-service/.env 填写 Fish Audio API Key"
fi

echo "  ✅ 配置文件就绪"
echo ""

# ============================================================
# 3. 启动基础设施 (PostgreSQL + Redis)
# ============================================================
echo "🐘 启动 PostgreSQL + Redis..."
cd "$PROJECT_DIR/docker"
docker compose up -d postgres redis 2>/dev/null || docker-compose up -d postgres redis

# 等待 PostgreSQL 就绪
echo "  ⏳ 等待 PostgreSQL 启动..."
for i in {1..30}; do
    if docker compose exec -T postgres pg_isready -U postgres &>/dev/null 2>&1 || \
       docker-compose exec -T postgres pg_isready -U postgres &>/dev/null 2>&1; then
        echo "  ✅ PostgreSQL 已就绪"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "  ❌ PostgreSQL 启动超时"
        exit 1
    fi
    sleep 1
done

# 等待 Redis 就绪
echo "  ⏳ 等待 Redis 启动..."
for i in {1..15}; do
    if docker compose exec -T redis redis-cli ping &>/dev/null 2>&1 || \
       docker-compose exec -T redis redis-cli ping &>/dev/null 2>&1; then
        echo "  ✅ Redis 已就绪"
        break
    fi
    sleep 1
done

echo ""

# ============================================================
# 4. 初始化数据库
# ============================================================
echo "🗄️  初始化数据库..."
cd "$PROJECT_DIR/backend/business-service"

if [ ! -d "node_modules" ]; then
    echo "  📦 安装 Node.js 依赖..."
    npm install --silent
fi

echo "  🔄 执行数据库迁移..."
npx prisma migrate deploy 2>/dev/null || echo "  ⚠️  迁移跳过(可能已是最新)"

echo "  🌱 执行数据播种..."
node prisma/seed.js 2>/dev/null || echo "  ⚠️  播种跳过(可能已存在)"
echo ""

# ============================================================
# 5. 启动应用服务
# ============================================================
echo "🎙️  启动 AI 服务 (Python FastAPI)..."
cd "$PROJECT_DIR/backend/ai-service"

if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt --quiet
else
    source venv/bin/activate
fi

# 创建存储目录
mkdir -p storage/{tts,mixed,models,recordings,music}

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
AI_PID=$!
echo "  ✅ AI 服务启动 (PID: $AI_PID, http://localhost:8000)"

echo ""
echo "🚀 启动业务服务 (Node.js Express)..."
cd "$PROJECT_DIR/backend/business-service"
npm run dev &
BIZ_PID=$!
echo "  ✅ 业务服务启动 (PID: $BIZ_PID, http://localhost:3000)"

echo ""

# ============================================================
# 6. 健康检查
# ============================================================
echo "🏥 等待服务就绪..."
sleep 3

check_health() {
    local url=$1
    local name=$2
    for i in {1..10}; do
        if curl -s "$url" | grep -q "healthy" 2>/dev/null; then
            echo "  ✅ $name 健康"
            return 0
        fi
        sleep 1
    done
    echo "  ⚠️  $name 未响应 (可能仍在启动)"
    return 0
}

check_health "http://localhost:8000/health" "AI 服务"
check_health "http://localhost:3000/health" "业务服务"

echo ""
echo "=================================="
echo "🎉 开发环境启动完成！"
echo ""
echo "  📡 AI 服务:    http://localhost:8000"
echo "  📡 API 文档:   http://localhost:8000/docs"
echo "  📡 业务服务:   http://localhost:3000"
echo "  📡 PostgreSQL: localhost:5432"
echo "  📡 Redis:      localhost:6379"
echo ""
echo "  按 Ctrl+C 停止所有服务"
echo "=================================="

# 等待子进程
wait
