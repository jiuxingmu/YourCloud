#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.prod.yml"
ENV_FILE="$ROOT_DIR/infra/.env.prod"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE. Copy infra/env.prod.example first." >&2
  exit 1
fi

if [ -z "${GHCR_USER:-}" ] || [ -z "${GHCR_TOKEN:-}" ]; then
  echo "Missing GHCR_USER/GHCR_TOKEN for image pull." >&2
  exit 1
fi

echo "[deploy] Pulling latest code..."
git -C "$ROOT_DIR" fetch --all --prune
git -C "$ROOT_DIR" reset --hard origin/main

echo "[deploy] Logging in to GHCR..."
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

echo "[deploy] Pulling images..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull

echo "[deploy] Starting containers..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans

echo "[deploy] Done. Running status:"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
