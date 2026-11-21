# LobeHub chat (CA7)

`/chat-ca7` embeds a self-hosted [LobeHub](https://github.com/lobehub/lobehub) when
`NEXT_PUBLIC_LOBEHUB_URL` is set. Without it, the built-in demo chat is shown.

## Run LobeHub

Needs Node 22, pnpm, PostgreSQL with the `pgvector` extension and Redis.

```bash
git clone --depth 1 https://github.com/lobehub/lobehub && cd lobehub
pnpm install
cat > .env <<ENV
APP_URL=http://localhost:3010
KEY_VAULTS_SECRET=$(openssl rand -base64 32)
AUTH_SECRET=$(openssl rand -base64 32)
DATABASE_URL=postgresql://USER@localhost:5432/lobechat
DATABASE_DRIVER=node
REDIS_URL=redis://localhost:6379
FTS_SEARCH_PROVIDER=pg_like
OLLAMA_PROXY_URL=http://localhost:11434
ENV
pnpm db:migrate
pnpm dev            # http://localhost:3010
```

## Local model (Ollama)

Install [Ollama](https://ollama.com) on the machine that runs LobeHub, pull a model
(`ollama pull llama3.1`) and enable the Ollama provider in LobeHub under
Settings → AI Providers. `OLLAMA_PROXY_URL` points LobeHub at it.

## Connect to this site

Set `NEXT_PUBLIC_LOBEHUB_URL=http://localhost:3010` in `.env` and restart the site. The home
page chat bar sends visitors to `/chat-ca7?q=...`; the page shows the question with a Copy
button so it can be pasted into LobeHub.

LobeHub sends no `X-Frame-Options` unless `ENABLED_CSP=1`, so leave that unset for embedding.
