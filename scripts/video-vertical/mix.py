#!/usr/bin/env python3
"""Puts the voice clips (unchanged) and the music under the recording and writes the final mp4.

  python mix.py <record-folder> <voice-folder> <music.wav> <out.mp4>
"""
import json
import os
import subprocess
import sys

rec, voice, music, out = sys.argv[1:5]
tl = json.load(open(os.path.join(rec, "timeline.json")))
n = len(tl["scenes"])
cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(rec, "video.webm"), "-i", music]
filters = []
for i, sc in enumerate(tl["scenes"]):
    cmd += ["-i", os.path.join(voice, f"{i:02d}.wav")]
    ms = int(sc["voice"] * 1000)
    filters.append(f"[{i + 2}:a]aresample=44100,adelay={ms}|{ms}[v{i}]")
mix = "".join(f"[v{i}]" for i in range(n)) + f"amix=inputs={n}:normalize=0[voice];[1:a]aresample=44100[m];[voice][m]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]"
cmd += ["-filter_complex", ";".join(filters) + ";" + mix, "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-b:a", "192k", "-t", str(tl["total"]), "-movflags", "+faststart", out]
subprocess.run(cmd, check=True)
print("wrote", out)
