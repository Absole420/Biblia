# Lists Ansorg entries whose 'Stelle:' header range differs from their verse mapping (iteration 48 retest)
import glob
import json
import os
import re

D = os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "data", "offline", "commentary")
for f in sorted(glob.glob(os.path.join(D, "*.json")), key=lambda p: int(os.path.basename(p)[:-5])):
    for e in json.load(open(f)):
        if e["source"] != "ansorg":
            continue
        m = re.search(r"Stelle:\s*([^\n]*)", e["text"][:300])
        if not m:
            continue
        r = re.search(r"(\d+):(\d+)(?:-(\d+))?", m.group(1))
        if r and (int(r.group(1)), int(r.group(2)), int(r.group(3) or r.group(2))) != (e["chapter"], e["from"], e["to"]):
            print(e["id"], e["chapter"], e["from"], e["to"], e["scope"], "|", m.group(1)[:80])
# Specific retest: 1Mo 1 Ansorg
for e in json.load(open(os.path.join(D, "1.json"))):
    if e["source"] == "ansorg" and e["chapter"] == 1:
        print("GEN1", e["id"], e["from"], e["to"], e["scope"])
