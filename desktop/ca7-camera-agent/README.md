# CA7 Camera Agent

Runs on a computer in the same network as your cameras. For every camera it takes a picture every few seconds, **counts the people** in it
(OpenCV's built-in people detector, no model download needed) and measures how much the picture **changed** (0–100).
Only these numbers go to your CA7 account; pictures never leave the computer.

1. In CA7: Dashboard → Data Connect → add a source of type **Camera** and copy its token.
2. `cd desktop/ca7-camera-agent && pip install -r requirements.txt`
3. (recommended for people) `pip install ultralytics` and add `--detector yolo`; the small model downloads by itself the first time.
4. `python agent.py --token=cs_... --camera=door=http://192.168.1.20/snapshot.jpg --camera=yard=rtsp://user:pw@192.168.1.21/stream`

A camera can be a JPEG snapshot address, an RTSP/HTTP stream, a video file or a webcam number (`--camera=desk=0`).
Options: `--site=https://cloud.ca7.io`, `--every=10` (seconds), `--min-score=0.5` (higher = fewer false people), `--once`, `--dry-run` (print only).
Also `CA7_TOKEN`, `CA7_CAMERAS`, `CA7_SITE`, `CA7_EVERY`.

Records look like `{ "camera": "door", "people": 2, "motion": 12.4, "timestamp": "..." }`. Use them in Data Intelligence and Automation
(for example: e-mail me when `people` is above 0 at night).

**Detectors.** `--detector auto` (default) uses YOLO when `ultralytics` is installed and otherwise HOG. `--detector hog` is OpenCV's built-in classic people detector: no download, but weak (on our test photo of one person it found nobody).
`--detector yolo` uses a YOLOv8 neural network (`pip install ultralytics`; with `--model yolov8s.pt` or bigger for more accuracy) and found the person in the same photo and nobody in an empty picture.
Both were tested here on one sample photo and a blank picture, not on your cameras; people who are far away, hidden or in poor light can still be missed. Needs OpenCV 4 for `hog` (OpenCV 5 dropped it).
Not built yet: a graphical app and installers.

`agent.mjs` is the older motion-only version (Node.js) and still works without Python.
