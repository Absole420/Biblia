# Data validation for bundled German commentaries (frontend/src/data/offline/commentary): counts, verse mapping, scope labels, markup/OCR artifacts, Ansorg "Stelle:" ranges
import collections
import glob
import json
import os
import re

D = os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "data", "offline")
S = {s["id"]: s for s in json.load(open(os.path.join(D, "sources.json")))}
cnt, issues = collections.Counter(), collections.Counter()
for f in glob.glob(os.path.join(D, "commentary", "*.json")):
    nr = int(os.path.basename(f)[:-5])
    chapters = json.load(open(os.path.join(D, "bible", f"{nr}.json")))["chapters"]
    for e in json.load(open(f)):
        src, t = e["source"], e["text"]
        cnt[src] += 1
        if S.get(src, {}).get("language") != "de" or S.get(src, {}).get("status") != "integrated":
            issues[(src, "not-integrated-or-not-german")] += 1
        if e["chapter"] > len(chapters) or e["from"] < 1 or e["from"] > e["to"] or e["to"] > len(chapters[e["chapter"] - 1]):
            issues[(src, "bad-verse-mapping")] += 1
        if e["from"] != e["to"] and e["scope"] == "verse":
            issues[(src, "range-labelled-Einzelvers")] += 1
        if re.search(r"</?(p|div|br|span|w|note|title)\b|\\par|&[a-z]+;", t):
            issues[(src, "markup")] += 1
        if re.search(r"[a-zäöü]- [a-zäöü]", t) or re.search(r"[ı£¬]", t):
            issues[(src, "ocr-artifacts")] += 1
        if src == "ansorg":
            m = re.search(r"Stelle:\s*[^\n]*?(\d+):(\d+)(?:-(\d+))?", t[:300])
            if m and (int(m.group(1)), int(m.group(2)), int(m.group(3) or m.group(2))) != (e["chapter"], e["from"], e["to"]):
                issues[(src, "stelle-range-mismatch")] += 1
print("entries", dict(cnt), sum(cnt.values()))
for k, v in sorted(issues.items()):
    print(k, v)
