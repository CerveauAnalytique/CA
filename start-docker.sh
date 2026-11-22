#!/usr/bin/env bash
# Starts CA7 in Docker with one command: database, backend (API + admin), website and scheduler.
#   ./start-docker.sh          start (builds the first time; this takes several minutes)
#   ./start-docker.sh stop     stop (your data stays)
#   ./start-docker.sh logs     follow the logs
# Needs Docker Desktop (or Docker Engine with the compose plugin) running, and internet for the first build.
set -euo pipefail
cd "$(dirname "$0")"
PORT="${WEB_PORT:-8080}"

case "${1:-start}" in
  stop) docker compose down; echo "CA7 stopped. Your data is kept."; exit 0 ;;
  logs) exec docker compose logs -f backend web ;;
  start) ;;
  *) echo "Use: ./start-docker.sh [start|stop|logs]"; exit 1 ;;
esac

if ! command -v docker >/dev/null 2>&1; then echo "Docker is not installed. Install Docker Desktop: https://www.docker.com/products/docker-desktop/"; exit 1; fi
if [ -z "${DRY_RUN:-}" ] && ! docker info >/dev/null 2>&1; then echo "Docker is installed but not running. Open Docker Desktop and wait until it says it is running, then try again."; exit 1; fi

rand() { head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c "$1"; }

if [ ! -f .env ]; then
  echo "Creating .env with fresh random secrets..."
  sed -e "s|^DB_PASSWORD=.*|DB_PASSWORD=$(rand 24)|" \
      -e "s|^PAYLOAD_SECRET=.*|PAYLOAD_SECRET=$(rand 64)|" \
      -e "s|^CA7_CRON_SECRET=.*|CA7_CRON_SECRET=$(rand 24)|" \
      -e "s|^WEB_PORT=.*|WEB_PORT=${PORT}|" \
      -e "s|^PUBLIC_URL=.*|PUBLIC_URL=http://localhost:${PORT}|" \
      -e "s|^CA7_DEMO_SHOP=.*|CA7_DEMO_SHOP=1|" \
      .env.docker.example > .env
  echo ".env created (keep it: it holds your database password and the key that signs logins)."
fi

[ -n "${DRY_RUN:-}" ] && { echo "dry run: .env ready, docker not started"; exit 0; }

docker compose up -d --build

URL="$(sed -n 's/^PUBLIC_URL=//p' .env | head -1)"
URL="${URL:-http://localhost:${PORT}}"
echo "Waiting for the backend..."
for _ in $(seq 1 90); do
  if curl -fs "${URL}/api/ca/health" >/dev/null 2>&1 || curl -fs "${URL}/api/ca/shop" >/dev/null 2>&1; then
    echo; echo "CA7 is running: ${URL}"
    echo "The first account you create becomes the admin (Dashboard -> Settings -> Open admin panel)."
    command -v open >/dev/null 2>&1 && open "${URL}" || true
    command -v xdg-open >/dev/null 2>&1 && xdg-open "${URL}" >/dev/null 2>&1 || true
    exit 0
  fi
  printf '.'; sleep 4
done
echo; echo "The backend did not answer in time. Look at the logs: ./start-docker.sh logs"; exit 1
