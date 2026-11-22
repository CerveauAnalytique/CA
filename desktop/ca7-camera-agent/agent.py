#!/usr/bin/env python3
"""CA7 Camera Agent with people detection.

Reads a picture from each camera (JPEG snapshot URL, RTSP/HTTP video stream, video file or webcam number), counts the people in it
with OpenCV's built-in people detector and measures how much the picture changed. Only the numbers go to your CA7 account;
pictures never leave this computer.

  pip install -r requirements.txt
  python agent.py --token=cs_... --camera=door=http://192.168.1.20/snapshot.jpg --camera=yard=rtsp://user:pw@192.168.1.21/stream

Record sent: {"camera": "door", "people": 2, "motion": 12.4, "timestamp": "..."}
Options: --site (default https://cloud.ca7.io), --every seconds (10), --min-score (0.5), --once, --dry-run (print, do not send).
Environment: CA7_TOKEN, CA7_SITE, CA7_CAMERAS (name=url,name=url), CA7_EVERY.
"""
import argparse
import json
import os
import sys
import time
import urllib.request
from datetime import datetime, timezone

import cv2
import numpy as np

_hog = None


def _get_hog():
    global _hog
    if _hog is None:
        if not hasattr(cv2, "HOGDescriptor"):
            sys.exit("This OpenCV version has no built-in people detector (OpenCV 5). Use --detector yolo, or install opencv-python-headless<5.")
        _hog = cv2.HOGDescriptor()
        _hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
    return _hog


def count_people(frame, min_score=0.5):
    """Number of people in a BGR picture (classic HOG + SVM detector; works best for people that are fully visible)."""
    h, w = frame.shape[:2]
    scale = 640.0 / w if w > 640 else 1.0
    small = cv2.resize(frame, (int(w * scale), int(h * scale))) if scale != 1.0 else frame
    rects, scores = _get_hog().detectMultiScale(small, winStride=(8, 8), padding=(8, 8), scale=1.05)
    boxes = [r for r, s in zip(rects, np.array(scores).reshape(-1)) if float(s) >= min_score]

    def inside(a, b):
        return a[0] >= b[0] and a[1] >= b[1] and a[0] + a[2] <= b[0] + b[2] and a[1] + a[3] <= b[1] + b[3]

    # a box that sits inside another box is the same person
    return sum(1 for i, a in enumerate(boxes) if not any(i != j and inside(a, b) for j, b in enumerate(boxes)))


_yolo = None


def count_people_yolo(frame, min_score=0.5, model="yolov8n.pt"):
    """Number of people found by a YOLO neural network (needs `pip install ultralytics`; the small model is downloaded the first time)."""
    global _yolo
    if _yolo is None:
        from ultralytics import YOLO

        _yolo = YOLO(model)
    res = _yolo.predict(frame, classes=[0], conf=min_score, verbose=False)[0]
    return int(len(res.boxes))


def motion_percent(prev, cur):
    """How much of the picture changed since the previous one, 0 to 100."""
    a = cv2.GaussianBlur(cv2.cvtColor(cv2.resize(prev, (320, 180)), cv2.COLOR_BGR2GRAY), (9, 9), 0)
    b = cv2.GaussianBlur(cv2.cvtColor(cv2.resize(cur, (320, 180)), cv2.COLOR_BGR2GRAY), (9, 9), 0)
    return round(float((cv2.absdiff(a, b) > 25).mean() * 100), 1)


def grab(source):
    """One picture from a snapshot URL, stream, file or webcam number (None when it fails)."""
    streams = (".mp4", ".m3u8", ".mjpg", ".mjpeg")
    if source.startswith(("http://", "https://")) and not source.lower().endswith(streams):
        try:
            with urllib.request.urlopen(source, timeout=10) as r:
                return cv2.imdecode(np.frombuffer(r.read(), np.uint8), cv2.IMREAD_COLOR)
        except Exception as e:
            print(f"  could not read {source}: {e}", file=sys.stderr)
            return None
    cap = cv2.VideoCapture(int(source) if source.isdigit() else source)
    ok, frame = cap.read()
    cap.release()
    return frame if ok else None


def send(site, token, records):
    body = json.dumps({"records": records}).encode()
    req = urllib.request.Request(f"{site}/api/ca/ingest", data=body, headers={"Content-Type": "application/json", "X-CA7-Token": token}, method="POST")
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())


def main():
    p = argparse.ArgumentParser(description="CA7 camera agent with people detection")
    p.add_argument("--token", default=os.environ.get("CA7_TOKEN"))
    p.add_argument("--site", default=os.environ.get("CA7_SITE", "https://cloud.ca7.io"))
    p.add_argument("--camera", action="append", default=[], help="name=url (repeat for more cameras)")
    p.add_argument("--every", type=float, default=float(os.environ.get("CA7_EVERY", 10)))
    p.add_argument("--min-score", type=float, default=0.5)
    p.add_argument("--detector", choices=["auto", "hog", "yolo"], default=os.environ.get("CA7_DETECTOR", "auto"), help="auto = yolo when ultralytics is installed, else hog; hog = built in, weak; yolo = neural network, more accurate (pip install ultralytics)")
    p.add_argument("--model", default="yolov8n.pt", help="YOLO weights (a file or a standard name such as yolov8s.pt)")
    p.add_argument("--once", action="store_true")
    p.add_argument("--dry-run", action="store_true")
    a = p.parse_args()
    cams = a.camera or [c for c in os.environ.get("CA7_CAMERAS", "").split(",") if c]
    cams = dict(c.split("=", 1) for c in cams)
    if not cams or (not a.token and not a.dry_run):
        p.error("give --token and at least one --camera name=url")
    site = a.site.rstrip("/")
    if a.detector == "auto":
        import importlib.util

        a.detector = "yolo" if importlib.util.find_spec("ultralytics") else "hog"
    print(f"detector: {a.detector}")
    prev = {}
    while True:
        records = []
        for name, src in cams.items():
            frame = grab(src)
            if frame is None:
                continue
            rec = {
                "camera": name,
                "people": count_people_yolo(frame, a.min_score, a.model) if a.detector == "yolo" else count_people(frame, a.min_score),
                "motion": motion_percent(prev[name], frame) if name in prev else 0.0,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            prev[name] = frame
            records.append(rec)
            print(rec)
        if records and not a.dry_run:
            try:
                print("  sent:", send(site, a.token, records))
            except Exception as e:
                print("  could not send:", e, file=sys.stderr)
        if a.once:
            return
        time.sleep(a.every)


if __name__ == "__main__":
    main()
