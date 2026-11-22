# Vertical walkthrough video (1080x1920)

Pipeline (all steps are scripts here):
1. `make_voice.py` – one voice clip per scene, Kokoro v1.0 (kokoro-onnx), voice `af_heart`, speed 0.95, `en-us`; model files `kokoro-v1.0.onnx` + `voices-v1.0.bin` from the GitHub release `thewh1teagle/kokoro-onnx` tag `model-files-v1.0`. The voice is not changed afterwards.
2. `record.cjs` + `lib.cjs` – Playwright records the real site, sharp at 2x (the page is laid out as 540x960 and scaled to 1080x1920), blue tap circle at every tap, waits in every scene until the sentence is finished, end card with logo, "Start for free", ca7.io.
   The site must answer on `https://cloud.ca7.io`: serve the Flutter build and proxy `/api` to the backend on a local https mirror and map the name with `--host-resolver-rules` (done in `lib.cjs`). The scenes use `history.pushState` to move in the app without reloading.
3. `make_music.py` – home-made lo-fi loop (72 BPM, Fmaj7-Em7-Dm7-Cmaj7, soft drums), quieter while the voice speaks.
4. `mix.py` – voice + music under the recording, H.264 + AAC.

`node record.cjs <voice-folder> <out>` then `python make_music.py <out>/timeline.json <voice-folder> music.wav` then `python mix.py <out> <voice-folder> music.wav final.mp4`.
Result: `docs/video/ca7-how-it-works-vertical.mp4`.
