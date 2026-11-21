#!/usr/bin/env bash
# Installs the tools CA7 runs next to the website. Needs Docker with the compose plugin, git and curl.
# Usage: bash platform/install.sh [timescale|thingsboard|openremote|dify|airbyte|all]
# Each tool is started the way its own project documents it. Read their docs before using this in production.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="${CA7_PLATFORM_DIR:-$HERE/vendor}"
mkdir -p "$WORK"
what="${1:-all}"

timescale_and_thingsboard() {
  : "${TIMESCALE_PASSWORD:?Set TIMESCALE_PASSWORD first}"
  docker compose -f "$HERE/docker-compose.yml" up -d
  echo "TimescaleDB: localhost:5433 (user ca7, db ca7_data). ThingsBoard: http://localhost:8085"
}

openremote() {
  # OpenRemote quick start (https://github.com/openremote/openremote): manager on https://localhost, login admin / secret
  mkdir -p "$WORK/openremote" && cd "$WORK/openremote"
  curl -fsSL -o docker-compose.yml https://raw.githubusercontent.com/openremote/openremote/master/docker-compose.yml
  docker compose -p openremote up -d
  echo "OpenRemote: https://localhost  (change the default password)"
}

dify() {
  # Dify (https://github.com/langgenius/dify). Moved to port 8081 so it does not clash with OpenRemote on 80/443.
  [ -d "$WORK/dify" ] || git clone --depth 1 https://github.com/langgenius/dify.git "$WORK/dify"
  cd "$WORK/dify/docker"
  [ -f .env ] || cp .env.example .env
  sed -i 's/^EXPOSE_NGINX_PORT=.*/EXPOSE_NGINX_PORT=8081/; s/^EXPOSE_NGINX_SSL_PORT=.*/EXPOSE_NGINX_SSL_PORT=8444/' .env
  docker compose up -d
  echo "Dify: http://localhost:8081/install  (create the admin account)"
}

airbyte() {
  # Airbyte is installed with its own tool abctl (https://docs.airbyte.com). UI: http://localhost:8000
  command -v abctl >/dev/null || curl -LsfS https://get.airbyte.com | bash -
  abctl local install
  abctl local credentials
}

case "$what" in
  timescale|thingsboard) timescale_and_thingsboard ;;
  openremote) openremote ;;
  dify) dify ;;
  airbyte) airbyte ;;
  all) timescale_and_thingsboard; (openremote); (dify); (airbyte) ;;
  *) echo "Unknown: $what"; exit 1 ;;
esac

cat <<EOF

Next: put these in the CA7 environment so the Platform page can find them
  OPENREMOTE_URL=https://localhost
  DIFY_URL=http://localhost:8081
  AIRBYTE_URL=http://localhost:8000
  THINGSBOARD_URL=http://localhost:8085
EOF
