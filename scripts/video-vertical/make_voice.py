#!/usr/bin/env python3
"""One voice-over clip per scene with Kokoro v1.0 (kokoro-onnx), voice af_heart, speed 0.95, lang en-us. Nothing else is applied to the voice.

  pip install kokoro-onnx soundfile numpy
  # model files (GitHub release thewh1teagle/kokoro-onnx, tag model-files-v1.0): kokoro-v1.0.onnx and voices-v1.0.bin
  python make_voice.py <folder-with-model-files> <out-folder>

Writes <out>/NN.wav and <out>/durations.json (seconds per clip).
"""
import json
import os
import sys

import soundfile as sf
from kokoro_onnx import Kokoro

models, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
texts = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "narration.json")))
k = Kokoro(os.path.join(models, "kokoro-v1.0.onnx"), os.path.join(models, "voices-v1.0.bin"))
durations = []
for i, t in enumerate(texts):
    samples, rate = k.create(t, voice="af_heart", speed=0.95, lang="en-us")
    sf.write(os.path.join(out, f"{i:02d}.wav"), samples, rate)
    durations.append(round(len(samples) / rate, 3))
    print(i, durations[-1])
json.dump({"rate": rate, "durations": durations}, open(os.path.join(out, "durations.json"), "w"))
