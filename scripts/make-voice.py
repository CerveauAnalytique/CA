#!/usr/bin/env python3
"""Adds a spoken voice (espeak-ng, a synthetic voice) to docs/video/ca7-overview.mp4 in English and Dutch.

  sudo apt-get install -y espeak-ng ffmpeg
  python3 scripts/make-voice.py            # writes docs/video/ca7-overview-en.mp4 and ca7-overview-nl.mp4

The scenes of the video last SCENES seconds each (see docs/video/index.html); every sentence is spoken at the start of its scene
and sped up a little when it would not fit.
"""
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEO = os.path.join(HERE, "..", "docs", "video")
DURATIONS = [7, 11, 11, 10, 10, 9, 12, 12, 9, 9, 9, 13, 7]
START = float(os.environ.get("VOICE_START", "0.1"))  # scene 1 starts right at the beginning of the recording

TEXT = {
    "en": [
        "CA7 connects your data, builds on it with AI, and acts on it. For companies of every size.",
        "Here is how it works. You connect your data, from cameras, sensors, files or apps. CA7 stores it, helps you understand it, and then acts on it.",
        "The website and the apps are built with Flutter. The backend is Next.js with Payload, and everything is stored in PostgreSQL.",
        "Inside the dashboard you get six modules: connect, intelligence, automation, camera, API keys and platform tools.",
        "There are five packs, from Free to Enterprise. The server enforces the limits, and payment goes by card or invoice.",
        "The shop is complete, with Mollie checkout, orders, addresses, and card payments with Stripe.",
        "Every activity is scored from low to critical. Suspicious behavior is flagged, restricted or blocked automatically, without needing any AI.",
        "The AI proposes, and the Compliance Engine decides. It checks real prices, stock, discounts and consent, so the assistant can never make things up.",
        "The help center and all site content come from the database, and you edit them in the admin panel.",
        "OpenRemote, ThingsBoard, Dify, Airbyte and TimescaleDB run next to CA7, with one account for all of them.",
        "Everything starts with one command: docker compose up. The database, backend, website and scheduler start together.",
        "Honest status. The product is built and tested. What is left happens on your server: starting the images, adding your keys and domains, and building the AI model.",
        "Start it, try it, and tell us what comes next.",
    ],
    "nl": [
        "CA7 verbindt je data, bouwt er met AI op voort en handelt ernaar. Voor bedrijven van elke grootte.",
        "Zo werkt het. Je verbindt je data, van camera's, sensoren, bestanden of apps. CA7 slaat ze op, helpt je ze te begrijpen en handelt er daarna naar.",
        "De website en de apps zijn gemaakt met Flutter. De backend is Next.js met Payload, en alles staat in PostgreSQL.",
        "In het dashboard vind je zes onderdelen: koppelen, inzicht, automatisering, camera, API-sleutels en platformtools.",
        "Er zijn vijf pakketten, van Free tot Enterprise. De server dwingt de limieten af, en betalen gaat met kaart of factuur.",
        "De winkel is compleet, met Mollie-betaling, bestellingen, adressen en kaartbetaling met Stripe.",
        "Elke activiteit krijgt een score van laag tot kritiek. Verdacht gedrag wordt automatisch gemarkeerd, beperkt of geblokkeerd, zonder AI.",
        "De AI doet een voorstel en de Compliance Engine beslist. Die controleert echte prijzen, voorraad, kortingen en toestemming, dus de assistent kan nooit iets verzinnen.",
        "Het helpcentrum en alle inhoud van de site komen uit de database, en je past ze aan in het adminpaneel.",
        "OpenRemote, ThingsBoard, Dify, Airbyte en TimescaleDB draaien naast CA7, met één account voor alles.",
        "Alles begint met één commando: docker compose up. De database, backend, website en planner starten samen.",
        "Eerlijke stand van zaken. Het product is gebouwd en getest. Wat overblijft gebeurt op jouw server: de images starten, je sleutels en domeinen toevoegen en het AI-model bouwen.",
        "Start het, probeer het, en vertel ons wat er hierna moet komen.",
    ],
}


def run(*cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def seconds(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def main():
    src = os.path.join(VIDEO, "ca7-overview.mp4")
    for lang, lines in TEXT.items():
        with tempfile.TemporaryDirectory() as tmp:
            inputs, filters, offset = [], [], START
            for i, (line, d) in enumerate(zip(lines, DURATIONS)):
                wav = os.path.join(tmp, f"{i}.wav")
                speed = 160
                while True:
                    run("espeak-ng", "-v", lang, "-s", str(speed), "-p", "40", "-w", wav, line)
                    if seconds(wav) <= d - 0.4 or speed >= 215:
                        break
                    speed += 10
                if seconds(wav) > d:
                    print(f"  warning ({lang}, scene {i + 1}): {seconds(wav):.1f}s of speech in {d}s", file=sys.stderr)
                inputs += ["-i", wav]
                filters.append(f"[{i + 1}:a]adelay={int(offset * 1000)}|{int(offset * 1000)}[a{i}]")
                offset += d
            mix = "".join(f"[a{i}]" for i in range(len(lines))) + f"amix=inputs={len(lines)}:normalize=0,volume=2.0[a]"
            out = os.path.join(VIDEO, f"ca7-overview-{lang}.mp4")
            run("ffmpeg", "-y", "-i", src, *inputs, "-filter_complex", ";".join(filters) + ";" + mix, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest", out)
            print("wrote", out)


if __name__ == "__main__":
    main()
