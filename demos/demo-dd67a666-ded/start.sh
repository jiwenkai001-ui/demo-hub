#!/usr/bin/env bash
# 宠物医院管理系统一键启动：建库 -> 灌入演示数据 -> 启动服务
set -e
cd "$(dirname "$0")"

PORT="${PORT:-8000}"
DB="data/pethospital.db"

echo "==> 检查依赖"
python3 -c "import fastapi, uvicorn, PIL" 2>/dev/null || {
  echo "    安装依赖: fastapi uvicorn pillow"
  pip install -q fastapi uvicorn pillow
}

echo "==> 初始化数据库与演示数据"
python3 backend/seed.py

echo ""
echo "==> 启动成功，访问地址："
echo "    管理后台    http://127.0.0.1:${PORT}/"
echo "    小程序端    http://127.0.0.1:${PORT}/mp"
echo ""

# 代码采用扁平导入（from db import / from routers import），需在 backend 目录下启动
cd backend
exec python3 -m uvicorn main:app --host 0.0.0.0 --port "${PORT}"
