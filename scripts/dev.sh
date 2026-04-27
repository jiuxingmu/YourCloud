#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yml"

echo "Starting PostgreSQL..."
(docker compose -f "$COMPOSE_FILE" up postgres) &
DB_PID=$!

echo "Starting API and Web..."
(cd "$ROOT_DIR/services/api-go" && go run ./cmd/server) &
API_PID=$!
(cd "$ROOT_DIR/clients/web" && npm install && npm run dev) &
WEB_PID=$!

cleanup() {
  kill "$API_PID" "$WEB_PID" "$DB_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

echo "Web: http://localhost:8082"
echo "Backend: http://localhost:8080"

wait
