#!/usr/bin/env bash
# Updates CA7 on the server (and on this Mac) with only what changed since the last deploy.
#   ./deploy.sh            website and/or backend, whatever changed
#   ./deploy.sh web        only the website      ./deploy.sh backend   only the backend
#   ./deploy.sh all        everything, also when nothing changed
# Settings (in .deploy.env or the environment): DEPLOY_HOST (user@host), DEPLOY_KEY (ssh key file), DEPLOY_DIR (default ca7).
# Website update: only the changed files go to the server (rsync), nginx serves them at once.
# Backend update: a small image (Next standalone) is uploaded and the backend restarts; migrations run on start.
set -euo pipefail
cd "$(dirname "$0")"
[ -f .deploy.env ] && set -a && . ./.deploy.env && set +a
: "${DEPLOY_HOST:?set DEPLOY_HOST=user@host in .deploy.env}"
DEPLOY_DIR="${DEPLOY_DIR:-ca7}"
SSH=(ssh -o ServerAliveInterval=30)
[ -n "${DEPLOY_KEY:-}" ] && SSH+=(-i "$DEPLOY_KEY")
STATE=.deploy/state; mkdir -p .deploy
t0=$(date +%s); say() { printf '\n▶ %s (%ss)\n' "$1" "$(( $(date +%s) - t0 ))"; }

# a fingerprint of the files that go into each part
hash_of() { git ls-files -co --exclude-standard -- "$@" | grep -vE '(^|/)(build|\.dart_tool)/' | sort | xargs shasum 2>/dev/null | shasum | cut -c1-16; }
WEB_HASH=$(hash_of flutter_app/lib flutter_app/assets flutter_app/web flutter_app/pubspec.yaml flutter_app/pubspec.lock)
NGINX_HASH=$(hash_of flutter_app/nginx.conf.template flutter_app/Dockerfile)
BACKEND_HASH=$(hash_of src public package.json pnpm-lock.yaml pnpm-workspace.yaml next.config.ts tsconfig.json redirects.ts Dockerfile)
last() { [ -f "$STATE" ] && sed -n "s/^$1=//p" "$STATE" || true; }

what="${1:-auto}"
do_web=0; do_nginx=0; do_backend=0
case "$what" in
  web) do_web=1 ;;
  backend) do_backend=1 ;;
  all) do_web=1; do_nginx=1; do_backend=1 ;;
  auto)
    [ "$WEB_HASH" != "$(last web)" ] && do_web=1
    [ "$NGINX_HASH" != "$(last nginx)" ] && do_nginx=1
    [ "$BACKEND_HASH" != "$(last backend)" ] && do_backend=1 ;;
  *) echo "Use: ./deploy.sh [auto|web|backend|all]"; exit 1 ;;
esac
if [ $((do_web + do_nginx + do_backend)) -eq 0 ]; then echo "Nothing changed since the last deploy."; exit 0; fi
echo "Deploying:$([ $do_web = 1 ] && echo ' website')$([ $do_nginx = 1 ] && echo ' nginx')$([ $do_backend = 1 ] && echo ' backend') → $DEPLOY_HOST"

ARGS=(--build-arg "CA7_API=${CA7_API:-}" --build-arg "CA7_CHAT_HOSTS=${CA7_CHAT_HOSTS:-ca7.io,ca7.nl,ca7.be}" --build-arg "CA7_CLOUD_HOST=${CA7_CLOUD_HOST:-cloud.ca7.io}")

# one thing at a time: on a small machine parallel builds are much slower
if [ $do_backend = 1 ]; then
  say "building the backend"
  docker build -t ca7-backend:latest .
fi
if [ $do_web = 1 ] || [ $do_nginx = 1 ]; then
  say "building the website"
  rm -rf .deploy/web.new && docker build "${ARGS[@]}" --target webfiles --output type=local,dest=.deploy/web.new flutter_app
  rm -rf .deploy/web && mv .deploy/web.new .deploy/web
fi
if [ $do_nginx = 1 ]; then docker build "${ARGS[@]}" -t ca7-web:latest flutter_app; fi

# the server: website files by rsync, images by docker save
"${SSH[@]}" "$DEPLOY_HOST" "mkdir -p $DEPLOY_DIR/web && command -v rsync >/dev/null || sudo dnf -y -q install rsync >/dev/null 2>&1 || sudo apt-get install -y -qq rsync >/dev/null 2>&1"
scp -q ${DEPLOY_KEY:+-i "$DEPLOY_KEY"} docker-compose.yml "$DEPLOY_HOST:$DEPLOY_DIR/docker-compose.yml"
scp -q ${DEPLOY_KEY:+-i "$DEPLOY_KEY"} deploy/docker-compose.web-files.yml "$DEPLOY_HOST:$DEPLOY_DIR/docker-compose.override.yml"
if [ $do_web = 1 ] || [ $do_nginx = 1 ]; then
  say "uploading the changed website files"
  rsync -az --delete --stats -e "${SSH[*]}" .deploy/web/ "$DEPLOY_HOST:$DEPLOY_DIR/web/" | grep -E "Number of regular files transferred|Total transferred file size" || true
fi
if [ $do_nginx = 1 ]; then
  say "uploading nginx"
  docker save ca7-web:latest | gzip -1 | "${SSH[@]}" "$DEPLOY_HOST" 'docker load >/dev/null'
fi
if [ $do_backend = 1 ]; then
  say "uploading the backend ($(docker image inspect ca7-backend:latest -f '{{.Size}}' | awk '{printf "%d MB", $1/1e6}'))"
  docker save ca7-backend:latest | gzip -1 | "${SSH[@]}" "$DEPLOY_HOST" 'docker load >/dev/null'
fi
say "restarting what changed on the server"
"${SSH[@]}" "$DEPLOY_HOST" "cd $DEPLOY_DIR && docker compose up -d --no-build 2>&1 | grep -vE 'Running|Healthy|Waiting' || true; \
  for i in \$(seq 1 60); do s=\$(docker inspect -f '{{.State.Health.Status}}' ca7-backend-1 2>/dev/null); [ \"\$s\" = healthy ] && break; sleep 5; done; \
  docker compose ps --format '{{.Service}}: {{.Status}}'; docker image prune -f >/dev/null"

# this Mac too, when Docker runs the same project here
if docker compose ps -q web >/dev/null 2>&1 && [ -n "$(docker compose ps -q web 2>/dev/null)" ]; then
  say "updating this Mac"
  WEB_FILES_DIR=./.deploy/web docker compose -f docker-compose.yml -f deploy/docker-compose.web-files.yml up -d --no-build >/dev/null 2>&1 || true
fi

printf 'web=%s\nnginx=%s\nbackend=%s\n' \
  "$([ $do_web = 1 ] && echo "$WEB_HASH" || last web)" "$([ $do_nginx = 1 ] && echo "$NGINX_HASH" || last nginx)" "$([ $do_backend = 1 ] && echo "$BACKEND_HASH" || last backend)" > "$STATE"
say "done"
