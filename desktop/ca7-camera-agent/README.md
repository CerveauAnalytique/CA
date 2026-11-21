# CA7 Camera Agent (preview)

Runs on a computer in the same network as your cameras. It reads a JPEG snapshot from each camera, measures how much the
picture changed since the last one (0–100) and sends that to your CA7 account.

1. In CA7: Dashboard → Data Connect → add a source of type **Camera** and copy its token.
2. `cd desktop/ca7-camera-agent && npm install`
3. `node agent.mjs --token=cs_... --camera=door=http://192.168.1.20/snapshot.jpg,yard=http://192.168.1.21/snapshot.jpg`

Options: `--site=https://cloud.ca7.io`, `--every=10` (seconds). Also `CA7_TOKEN`, `CA7_CAMERAS`, `CA7_SITE`, `CA7_EVERY`.

Records look like `{ "camera": "door", "motion": 12.4, "timestamp": "..." }`. Use them in Data Intelligence and Automation
(for example: e-mail me when `motion` is unusual at night).

**Not built yet:** recognising people or objects, RTSP streams, a graphical app and installers.
