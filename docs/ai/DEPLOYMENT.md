# Deployment of the AI features

**Status: the language model (Qwen through Ollama) is NOT installed by this repository.** It is a 4 GB+ download that has to run on your own server
(the build environment of this project cannot reach ollama.com). Until you install it, the AI features still work with plain code:
recommendations, offers, "running low?" and smart search do not need a model, and the assistant answers from the product catalog (real prices and stock).
Check with `GET /api/ca/ai/status` (`mode: "model"` or `"catalog"`); the AI shopping assistant screen and the AI Control Center show it too.

Quick install on a server with 8 GB+ RAM (Linux):

```bash
curl -fsSL https://ollama.com/install.sh | sh
cd /path/to/ca && bash ai/ca7/build.sh           # pulls qwen2.5:7b and builds the "ca7" model (CA7_BASE=qwen2.5:3b for a small server)
ollama list                                      # "ca7" must be in the list
# then set on the backend: CA7_API_URL=http://<ollama-host>:11434  CA7_MODEL=ca7
curl https://<backend>/api/ca/ai/status          # {"installed":true,"mode":"model"}
```

1. Install Ollama (https://ollama.com) on a server the site can reach and build the CA7 model: `bash ai/ca7/build.sh` (see `ai/ca7/README.md`).
2. Set `CA7_API_URL` (default `http://127.0.0.1:11434`) and `CA7_MODEL` (default `ca7`) in the environment. A bigger Qwen model is chosen in `ai/ca7/Modelfile`.
3. Without the model the shop keeps working: recommendations and search are plain code; the assistant answers "offline".
4. First time: Admin panel → Globals → AI settings (flags, ranking versions) and AI Control Center → Policy rules. Defaults are built in, so nothing is needed to start.
5. Customers opt in under Dashboard → Profile → Personal AI suggestions.

DeepSeek is not wired in; adding it means another model call in `assistantAnswer` (`src/lib/ai/engine.ts`) behind a flag. Run the tests with `pnpm test:int`.
