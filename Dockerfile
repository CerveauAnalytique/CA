# CA7 backend: Next.js + Payload (API, admin panel, database access).
# It serves no website: the website is the Flutter app (flutter_app/Dockerfile).
# The image holds only Next's self-contained server ("standalone"), not node_modules or the sources: a few hundred MB
# instead of 3 GB, so an update uploads quickly (./deploy.sh).
FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1 PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
# The build does not need the database: the migrations run when the container starts.
ENV PAYLOAD_SKIP_MIGRATIONS=1 PAYLOAD_SECRET=build-only DATABASE_URL=postgres://none:none@127.0.0.1:1/none NEXT_PUBLIC_SERVER_URL=http://localhost:3000 NEXT_OUTPUT=standalone
RUN --mount=type=cache,target=/app/.next/cache pnpm build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 MEDIA_DIR=/app/public/media
WORKDIR /app
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
# media uploads and the security log live in volumes
RUN mkdir -p /app/public/media /app/storage/logs && chown -R node:node /app/public/media /app/storage
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/ca/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# the first start on an empty database runs the migrations (prodMigrations), so it can take a minute
CMD ["node", "server.js"]
