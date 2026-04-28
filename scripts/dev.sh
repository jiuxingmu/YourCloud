#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yml"

echo "Starting PostgreSQL..."
(
  exec docker compose -f "$COMPOSE_FILE" up postgres
) &
DB_PID=$!

echo "Waiting for PostgreSQL to be ready..."
for i in {1..60}; do
  if (echo > /dev/tcp/127.0.0.1/5432) >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! (echo > /dev/tcp/127.0.0.1/5432) >/dev/null 2>&1; then
  echo "PostgreSQL did not become ready in time."
  kill "$DB_PID" 2>/dev/null || true
  exit 1
fi

echo "Starting API and Web..."
(
  cd "$ROOT_DIR/services/api-go" || exit 1
  export JWT_SECRET="${JWT_SECRET:-local-dev-please-change-32chars-minimum}"
  exec go run ./cmd/server
) &
API_PID=$!
(
  cd "$ROOT_DIR/clients/web" || exit 1
  npm install
  exec npm run dev
) &
WEB_PID=$!

cleanup() {
  for pid in "$API_PID" "$WEB_PID" "$DB_PID"; do
    [ -n "$pid" ] || continue
    pkill -TERM -P "$pid" 2>/dev/null || true
    kill -TERM "$pid" 2>/dev/null || true
  done
  wait "$API_PID" "$WEB_PID" "$DB_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

echo "Web: http://localhost:8082"
echo "Backend: http://localhost:8080"

wait
