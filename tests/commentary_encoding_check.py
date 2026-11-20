# Iteration 50: U+FFFD scan for all commentary data and Kroeker OCR residue scan
import json, glob, re, os
from collections import Counter

ROOT = "/app"
files = glob.glob(f"{ROOT}/frontend/src/data/offline/commentary/*.json") + glob.glob(f"{ROOT}/backend/data/commentaries/*.json")


def entries_of(path):
    d = json.load(open(path, encoding="utf-8"))
    if isinstance(d, dict) and "entries" in d:
        return d["entries"]
    if isinstance(d, dict):
        out = []
        for v in d.values():
            if isinstance(v, list):
                out += [e for e in v if isinstance(e, dict)]
            elif isinstance(v, dict) and "entries" in v:
                out += v["entries"]
        return out
    if isinstance(d, list):
        return d
    return []


total_fffd = 0
for p in sorted(files):
    raw = open(p, encoding="utf-8").read()
    n = raw.count("\ufffd")
    total_fffd += n
    if n:
        print("FFFD", n, os.path.relpath(p, ROOT))
print("TOTAL_FFFD", total_fffd)

# Rieger Röm 8,28 snippet
for p in files:
    for e in entries_of(p):
        if str(e.get("id", "")).startswith("rieger-45-8"):
            print("RIEGER", p.split("/app/")[1], e["id"], e["text"][:120].replace("\n", " "))
            break

# Kroeker residue
kro = {}
for p in files:
    for e in entries_of(p):
        if str(e.get("id", "")).startswith("kroeker-"):
            kro[(p.split("/app/")[1].split("/")[0], e["id"])] = e["text"]
pats = {
    "£": r"£", "$inword": r"[a-zäöü]\$[a-zäöü]", ", iff.": r", iff\.", ", if.": r", if\.",
    " j ": r"(?<=\s)j(?=\s)", "W a s": r"\bW a s\b", "Erz leuchtung": r"Erz leuchtung", "letterspaced": r"\b(?:[A-Za-zÄÖÜäöü] ){3,}[A-Za-zÄÖÜäöü]\b",
}
for src in sorted({k[0] for k in kro}):
    c = Counter()
    for (s, i), t in kro.items():
        if s != src:
            continue
        for name, rx in pats.items():
            c[name] += len(re.findall(rx, t))
    print("KROEKER", src, len([k for k in kro if k[0] == src]), "entries", dict(c))
