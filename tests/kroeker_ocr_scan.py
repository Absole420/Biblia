# Kroeker OCR residual scan + Ansorg multi-chapter mapping check (offline bundle)
import glob, json, re, collections
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
entries = []
for p in glob.glob(str(ROOT / "frontend/src/data/offline/commentary/*.json")):
    entries += json.load(open(p))

kro = [e for e in entries if e["source"] == "kroeker"]
pat = {
    "split-word": re.compile(r"\b[A-Za-zÄÖÜäöüß]{2,}- [a-zäöüß]{2,}"),
    "bad-chars": re.compile(r"[£®|\\©#$]"),
    "gluedCase": re.compile(r"[a-zäöüß]{2,}[A-ZÄÖÜ][a-zäöüß]{2,}"),
}
CONJ = {"und", "oder", "bis", "bzw", "sowie", "noch", "als", "wie", "u"}
for name, rx in pat.items():
    hits = []
    for e in kro:
        for m in rx.finditer(e["text"]):
            s = m.group(0)
            if name == "split-word" and s.split("- ")[1] in CONJ:
                continue
            hits.append((e["id"], e["text"][max(0, m.start() - 25): m.end() + 25].replace("\n", " ")))
    print(f"== {name}: {len(hits)}")
    for h in hits[:6]:
        print("  ", h)

for key in [(1, 1, 1), (19, 1, 1)]:
    for e in kro:
        if (e["book"], e["chapter"]) == key[:2] and e["from"] <= key[2] <= e["to"]:
            print("\n#### ", e["id"], e["title"], e["from"], e["to"])
            print(e["text"][:900])

# Ansorg multi-chapter targets
ans = [e for e in entries if e["source"] == "ansorg"]
ids = collections.Counter(e["id"] for e in entries)
print("\ndup ids:", [i for i, c in ids.items() if c > 1][:5])
targets = [(16, 8, 1), (16, 13, 1), (27, 11, 1), (30, 2, 1), (40, 3, 1), (40, 10, 1), (40, 28, 1), (20, 9, 1), (12, 4, 1), (27, 4, 10)]
for b, c, v in targets:
    hs = [(e["id"], e["title"], e["from"], e["to"]) for e in ans if e["book"] == b and e["chapter"] == c and e["from"] <= v <= e["to"]]
    print(f"{b} {c},{v}:", hs)
