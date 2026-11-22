#!/usr/bin/env bash
# Installs the tools CA7 runs next to the website. Needs Docker with the compose plugin, git and curl.
# Usage: bash platform/install.sh [timescale|thingsboard|openremote|dify|airbyte|all]
# Each tool is started the way its own project documents it. Read their docs before using this in production.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="${CA7_PLATFORM_DIR:-$HERE/vendor}"
mkdir -p "$WORK"
what="${1:-all}"

SECRETS="$WORK/passwords.txt"
newpw() { head -c 18 /dev/urandom | base64 | tr '+/' 'ab' | tr -d '=\n'; }
remember() { umask 077; echo "$1: $2" >> "$SECRETS"; }

# ThingsBoard starts with well-known passwords: replace them as soon as it answers (needs curl).
thingsboard_passwords() {
  local base="http://localhost:8085" i
  for i in $(seq 1 60); do curl -fs "$base/login" >/dev/null 2>&1 && break; sleep 5; done
  local who pass new tok
  for pair in "sysadmin@thingsboard.org:sysadmin" "tenant@thingsboard.org:tenant"; do
    who="${pair%%:*}"; pass="${pair#*:}"; new="$(newpw)"
    tok=$(curl -fs -X POST "$base/api/auth/login" -H 'Content-Type: application/json' -d "{\"username\":\"$who\",\"password\":\"$pass\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p') || true
    if [ -n "$tok" ] && curl -fs -X POST "$base/api/auth/changePassword" -H "X-Authorization: Bearer $tok" -H 'Content-Type: application/json' -d "{\"currentPassword\":\"$pass\",\"newPassword\":\"$new\"}" >/dev/null; then
      remember "ThingsBoard $who" "$new"
    else
      echo "!! Could not change the password of $who. Change it yourself at $base"
    fi
  done
}

timescale_and_thingsboard() {
  : "${TIMESCALE_PASSWORD:?Set TIMESCALE_PASSWORD first}"
  docker compose -f "$HERE/docker-compose.yml" up -d
  thingsboard_passwords
  echo "TimescaleDB: localhost:5433 (user ca7, db ca7_data). ThingsBoard: http://localhost:8085"
}

openremote() {
  # OpenRemote quick start (https://github.com/openremote/openremote): manager on https://localhost, login admin / secret
  mkdir -p "$WORK/openremote" && cd "$WORK/openremote"
  curl -fsSL -o docker-compose.yml https://raw.githubusercontent.com/openremote/openremote/master/docker-compose.yml
  local pw; pw="$(newpw)"; remember "OpenRemote admin" "$pw"
  OR_ADMIN_PASSWORD="$pw" docker compose -p openremote up -d
  echo "OpenRemote: https://localhost  (user admin; the password is in $SECRETS)"
}

dify() {
  # Dify (https://github.com/langgenius/dify). Moved to port 8081 so it does not clash with OpenRemote on 80/443.
  [ -d "$WORK/dify" ] || git clone --depth 1 https://github.com/langgenius/dify.git "$WORK/dify"
  cd "$WORK/dify/docker"
  [ -f .env ] || cp .env.example .env
  sed -i 's/^EXPOSE_NGINX_PORT=.*/EXPOSE_NGINX_PORT=8081/; s/^EXPOSE_NGINX_SSL_PORT=.*/EXPOSE_NGINX_SSL_PORT=8444/' .env
  docker compose up -d
  echo "Dify: http://localhost:8081/install  (create the admin account yourself; Dify has no default password)"
}

airbyte() {
  # Airbyte is installed with its own tool abctl (https://docs.airbyte.com). UI: http://localhost:8000
  command -v abctl >/dev/null || curl -LsfS https://get.airbyte.com | bash -
  abctl local install
  local pw; pw="$(newpw)"; abctl local credentials --password "$pw" && remember "Airbyte" "$pw"
}

case "$what" in
  timescale|thingsboard) timescale_and_thingsboard ;;
  openremote) openremote ;;
  dify) dify ;;
  airbyte) airbyte ;;
  all) timescale_and_thingsboard; (openremote); (dify); (airbyte) ;;
  *) echo "Unknown: $what"; exit 1 ;;
esac

[ -f "$SECRETS" ] && echo "Generated passwords are in $SECRETS (only you can read it). Store them in a password manager and delete the file."
cat <<EOF

Next: put these in the CA7 environment so the Platform page can find them
  OPENREMOTE_URL=https://localhost
  DIFY_URL=http://localhost:8081
  AIRBYTE_URL=http://localhost:8000
  THINGSBOARD_URL=http://localhost:8085
EOF
