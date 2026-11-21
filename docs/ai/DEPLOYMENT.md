# Deployment of the AI features

1. Install Ollama (https://ollama.com) on a server the site can reach and build the CA7 model: `bash ai/ca7/build.sh` (see `ai/ca7/README.md`).
2. Set `CA7_API_URL` (default `http://127.0.0.1:11434`) and `CA7_MODEL` (default `ca7`) in the environment. A bigger Qwen model is chosen in `ai/ca7/Modelfile`.
3. Without the model the shop keeps working: recommendations and search are plain code; the assistant answers "offline".
4. First time: Admin panel → Globals → AI settings (flags, ranking versions) and AI Control Center → Policy rules. Defaults are built in, so nothing is needed to start.
5. Customers opt in under Dashboard → Profile → Personal AI suggestions.

DeepSeek is not wired in; adding it means another model call in `assistantAnswer` (`src/lib/ai/engine.ts`) behind a flag. Run the tests with `pnpm test:int`.
