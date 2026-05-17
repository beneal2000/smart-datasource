#!/bin/bash
# ============================================================
# 亲子伴读 App - 服务健康检查脚本
#
# 使用方法:
#   ./scripts/health-check.sh
#
# 返回值:
#   0 - 所有服务健康
#   1 - 有服务异常
# ============================================================

echo "🏥 亲子伴读 App - 健康检查"
echo "=========================="
echo ""

FAILURES=0

check_service() {
    local url=$1
    local name=$2
    local response

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)

    if [ "$response" = "200" ]; then
        echo "  ✅ $name (HTTP $response)"
    else
        echo "  ❌ $name (HTTP $response)"
        FAILURES=$((FAILURES + 1))
    fi
}

check_tcp() {
    local host=$1
    local port=$2
    local name=$3

    if nc -z "$host" "$port" 2>/dev/null || (echo > /dev/tcp/$host/$port) 2>/dev/null; then
        echo "  ✅ $name ($host:$port)"
    else
        echo "  ❌ $name ($host:$port 不可达)"
        FAILURES=$((FAILURES + 1))
    fi
}

echo "应用服务:"
check_service "http://localhost:8000/health" "AI 服务 (FastAPI)"
check_service "http://localhost:3000/health" "业务服务 (Express)"

echo ""
echo "基础设施:"
check_tcp "localhost" 5432 "PostgreSQL"
check_tcp "localhost" 6379 "Redis"

echo ""
echo "第三方 API:"
# Fish Audio API
FA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer test" "https://api.fish.audio/model?page_size=1" 2>/dev/null)
if [ "$FA_STATUS" = "200" ] || [ "$FA_STATUS" = "401" ]; then
    echo "  ✅ Fish Audio API (可达, HTTP $FA_STATUS)"
else
    echo "  ⚠️  Fish Audio API (HTTP $FA_STATUS)"
fi

echo ""
echo "=========================="
if [ $FAILURES -eq 0 ]; then
    echo "  🎉 所有服务健康！"
    exit 0
else
    echo "  ⚠️  $FAILURES 个服务异常"
    exit 1
fi
