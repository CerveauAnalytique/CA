#!/usr/bin/env python3
"""Calm home-made lo-fi loop: 72 BPM, Fmaj7 - Em7 - Dm7 - Cmaj7 (one bar each), warm electric-piano chords, soft bass, soft drums, a little tape hiss.
Plays under the voice: it gets quieter while the voice speaks (the voice itself is never changed).

  python make_music.py <timeline.json> <voice-folder> <out.wav> [total-seconds]
"""
import json
import os
import sys

import numpy as np
import soundfile as sf

SR = 44100
BPM = 72
BEAT = 60.0 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(7)

CHORDS = [  # (bass, chord tones as MIDI notes)
    (41, [57, 60, 64, 69]),  # Fmaj7: F A C E  (F2 bass)
    (40, [55, 59, 62, 67]),  # Em7:   E G B D
    (38, [53, 57, 60, 64]),  # Dm7:   D F A C
    (36, [55, 59, 64, 67]),  # Cmaj7: C E G B
]
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    prev = 0.0
    for i in range(len(x)):  # one-pole, fast enough for a 14 s loop
        prev = (1 - a) * x[i] + a * prev
        y[i] = prev
    return y


def epiano(freq, dur, vel=1.0):
    t = np.arange(int(dur * SR)) / SR
    detune = 1.0015
    tone = np.sin(2 * np.pi * freq * t) + 0.5 * np.sin(2 * np.pi * freq * detune * t) + 0.25 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-3 * t) + 0.08 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-8 * t)
    env = np.minimum(1, t / 0.012) * np.exp(-1.1 * t) * np.minimum(1, (dur - t) / 0.25)
    wobble = 1 + 0.04 * np.sin(2 * np.pi * 4.5 * t)
    return vel * tone * env * wobble


def bass(freq, dur):
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(1, t / 0.02) * np.exp(-1.6 * t) * np.minimum(1, (dur - t) / 0.2)
    return 0.9 * np.sin(2 * np.pi * freq * t) * env


def kick():
    t = np.arange(int(0.35 * SR)) / SR
    f = 110 * np.exp(-14 * t) + 42
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-9 * t)


def snare():
    t = np.arange(int(0.22 * SR)) / SR
    return (rng.standard_normal(len(t)) * 0.6 + np.sin(2 * np.pi * 190 * t) * 0.4) * np.exp(-17 * t)


def hat():
    t = np.arange(int(0.06 * SR)) / SR
    n = rng.standard_normal(len(t))
    n = np.diff(n, prepend=0)  # brighter
    return n * np.exp(-60 * t)


def loop():
    out = np.zeros(int(4 * BAR * SR) + SR)
    put = lambda sig, at, g: out.__setitem__(slice(int(at * SR), int(at * SR) + len(sig)), out[int(at * SR): int(at * SR) + len(sig)] + sig * g)
    for bar, (b, notes) in enumerate(CHORDS):
        t0 = bar * BAR
        put(bass(hz(b), BAR * 0.95), t0, 0.55)
        put(bass(hz(b), BEAT * 1.2), t0 + 2.5 * BEAT, 0.3)
        for k, n in enumerate(notes):  # gently rolled chord, once per bar plus a soft re-strike on beat 3
            put(epiano(hz(n), BAR * 0.9, 0.55), t0 + k * 0.03, 0.22)
            put(epiano(hz(n), BAR * 0.45, 0.4), t0 + 2 * BEAT + k * 0.025 + 0.02, 0.14)
        for beat in range(4):
            if beat in (0, 2):
                put(kick(), t0 + beat * BEAT, 0.5 if beat == 0 else 0.35)
            else:
                put(snare(), t0 + beat * BEAT + 0.012, 0.18)
        for e in range(8):  # swung hats
            swing = 0.06 * BEAT if e % 2 else 0
            put(hat(), t0 + e * BEAT / 2 + swing, 0.06 if e % 2 else 0.09)
    return out[: int(4 * BAR * SR)]


def main():
    timeline = json.load(open(sys.argv[1]))
    voice_dir = sys.argv[2]
    out_path = sys.argv[3]
    total = float(sys.argv[4]) if len(sys.argv) > 4 else timeline["total"]
    lp = lowpass(loop(), 3600)
    lp /= np.max(np.abs(lp))
    n = int((total + 2) * SR)
    music = np.tile(lp, int(np.ceil(n / len(lp))))[:n]
    t = np.arange(n) / SR
    music += 0.012 * lowpass(rng.standard_normal(n), 6000)  # tape hiss
    # where the voice is speaking (from the recorded timeline and the clip lengths)
    durs = json.load(open(os.path.join(voice_dir, "durations.json")))["durations"]
    voice = np.zeros(n)
    for sc, d in zip(timeline["scenes"], durs):
        a = int(sc["voice"] * SR)
        voice[a: a + int(d * SR)] = 1.0
    k = int(0.35 * SR)  # smooth the ducking
    env = np.convolve(voice, np.ones(k) / k, mode="same")
    gain = 0.30 - 0.19 * env  # 0.30 alone, 0.11 under the voice
    fade = np.clip(np.minimum(t / 2.0, (total + 1.5 - t) / 2.0), 0, 1)
    music = music * gain * fade
    sf.write(out_path, music.astype(np.float32), SR)
    print("music", out_path, round(total, 1), "s")


if __name__ == "__main__":
    main()
