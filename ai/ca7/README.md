# CA7

CA7 is the Cerveau Analytique data model: **Qwen2.5** (via [Ollama](https://ollama.com)) with a data-analyst
system prompt and low temperature, so it stays factual with tables, sensor readings, logs and camera events.

```bash
bash ai/ca7/build.sh        # pulls qwen2.5:7b and creates the model "ca7"
ollama run ca7
```

Use it in the chat: start LobeHub (see `LOBEHUB.md`), enable the Ollama provider
(Settings → AI Providers → Ollama) and pick the model `ca7`.

Notes
- This is prompt + parameter tuning of Qwen, not a newly trained model. To train on your own data
  later, fine-tune Qwen (LoRA) on exported data, then point `FROM` in `build.sh` at the result.
- Bigger base = better answers but more RAM: `CA7_BASE=qwen2.5:14b bash ai/ca7/build.sh`.
- It was built from the same recipe as ElloFive's `scripts/build-modelfile.sh`.
