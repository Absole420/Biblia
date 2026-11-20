# Kroeker residual OCR detail: counts per artifact class + full scan of 1Mo 1 and Ps 1
import glob, json, re, collections
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
entries = []
for p in glob.glob(str(ROOT / "frontend/src/data/offline/commentary/*.json")):
    entries += json.load(open(p))
kro = [e for e in entries if e["source"] == "kroeker"]
cnt = collections.Counter()
ents = collections.defaultdict(set)
rx = {
    "£": r"£", "®": r"®", "|": r"\|", "\\": r"\\", "©": r"©", "$": r"\$",
    "ref ' if.'": r"\d, ?i(f|ff)\.", "ref 'f£'": r"f£", "stray single letter j": r"\s[jJ]\s[A-ZÄÖÜ]",
    "glued lower words (>=25 chars)": r"[a-zäöüß]{25,}",
}
for e in kro:
    for k, r in rx.items():
        n = len(re.findall(r, e["text"]))
        if n:
            cnt[k] += n
            ents[k].add(e["id"])
for k in rx:
    print(f"{k}: {cnt[k]} occurrences in {len(ents[k])} entries")
for b, c in [(1, 1), (19, 1)]:
    for e in kro:
        if (e["book"], e["chapter"]) == (b, c):
            t = e["text"]
            print(f"\n## {e['id']} len={len(t)}")
            for k, r in rx.items():
                for m in re.finditer(r, t):
                    print("  ", k, "|", t[max(0, m.start() - 30): m.end() + 30].replace("\n", " "))
            for m in re.finditer(r"\b\w+ \w{1,3}\b(?= ?[a-zäöü]{4,})", t[:0]):
                pass
            refs = re.findall(r"\d\. Mose \d+, ?\d+ ?f+\.?", t)
            print("   refs sample:", refs[:8])
