"""Bereinigt OCR-Artefakte in Kroeker (nur Typografie/Silbentrennung, kein Wortlaut) und verteilt
kapitelübergreifende Ansorg-Predigten auf alle behandelten Kapitel. Läuft auf backend/data und dem Offline-Bündel.
"""
import glob, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ELB = json.load(open(ROOT / "backend/data/elb1905.json"))
VC = {b["nr"]: [len(c) for c in b["chapters"]] for b in ELB["books"]}
CONJ = {"und", "oder", "bis", "bzw", "sowie", "noch", "als", "wie", "u"}


def ocr(t: str) -> str:
    t = re.sub(r"(\d)\s?(?:£f|f£|#£)\.?", r"\1 ff.", t)
    t = re.sub(r"(\d, )iff\.", r"\g<1>1ff.", t)
    t = re.sub(r"(\d, )i£\.", r"\g<1>1f.", t)
    for a, b in (("W a s sind", "Was sind"), ("Erz leuchtung", "Erleuchtung"), ("HaltetdasRecht", "Haltet das Recht"),
                 ("PropHeten", "Propheten"), ("FamHie", "Familie"),
                 ("Aufenthalt.DieEinwohnerschaftvon Marothgrämt sichnach", "Aufenthalt. Die Einwohnerschaft von Maroth grämt sich nach")):
        t = t.replace(a, b)
    t = re.sub(r"f£\.", "ff.", t)
    t = re.sub(r"(?<=[a-zäöü])\$(?=[a-zäöü])", "ß", t)
    t = re.sub(r"(\d, )if\.", r"\g<1>1f.", t)
    t = re.sub(r"(?<=\s)j(?=\s)", "", t)
    t = re.sub(r"(\d)\s?££\.", r"\1 ff.", t)
    t = re.sub(r"(\d)\s?£\.", r"\1 f.", t)
    t = re.sub(r"(\d)\s?#f?\.", r"\1 ff.", t)
    t = re.sub(r"ı(?=\d)|(?<=\d)ı|(?<=[\s(.;,])ı(?=[\s,.;])", "1", t).replace("ı", "i")
    t = t.replace("®", "").replace(" | ", " ").replace("|", "")
    t = re.sub(r"(\w)\s?[\\>]-?\s+(\w)", r"\1\2", t).replace("\\", "")
    t = re.sub(r"\$(?=o\b)", "S", t)
    t = re.sub(r"\$\.", "S.", t)
    t = re.sub(r"©\.", "O.", t)
    t = re.sub(r"\s?©\s", " ", t)
    t = re.sub(r"\((\d+)\}", r"(\1)", t).replace("{?)", "(?)").replace("{a}", "(a)")
    t = re.sub(r"(?<=[a-zäöü])B(?=[a-zäöü])", "ß", t)
    t = re.sub(r"\b([a-zäöüß]{2,})(?=[A-ZÄÖÜ][a-zäöüß]{2,})", r"\1 ", t)
    t = re.sub(r"(\w{2,})- ([a-zäöüß][\wäöüß]*)", lambda m: m.group(0) if m.group(2) in CONJ else m.group(1) + m.group(2), t)
    return re.sub(r"[ \t]{2,}", " ", t)


RANGE = re.compile(r"Stelle:\s*[^\n]*?(\d+)[:,](\d+)\s*[-–]\s*(\d+)[:,](\d+)")


def split_ansorg(e):  # noqa: C901
    m = RANGE.search(e["text"][:300])
    if not m:
        return [e]
    c1, v1, c2, v2 = map(int, m.groups())
    if c1 != e["chapter"] or v1 != e["from"]:
        return [e]
    out = []
    for ch in range(c1, min(c2, len(VC[e["book"]])) + 1):
        last = VC[e["book"]][ch - 1]
        a, b = (v1 if ch == c1 else 1), (min(v2, last) if ch == c2 else last)
        x = {**e, "chapter": ch, "from": a, "to": b, "scope": "range" if b > a else "verse"}
        if ch != c1:
            x["id"] = f"{e['id']}-k{ch}"
        x["title"] = re.sub(r" \d+,\d+(–\d+)?$", "", e["title"]) + f" {ch},{a}" + (f"–{b}" if b > a else "")
        out.append(x)
    return out


def fix(entries, source):
    if source == "kroeker":
        for e in entries:
            e["text"] = ocr(e["text"])
        return entries
    if source == "ansorg":
        if any("-k" in e["id"] for e in entries):  # bereits verteilt – Skript ist wiederholbar
            return entries
        return [x for e in entries for x in split_ansorg(e)]
    return entries


if __name__ == "__main__":
    for f in ("kroeker", "ansorg"):
        p = ROOT / f"backend/data/commentaries/{f}.json"
        d = json.load(open(p))
        d["entries"] = fix(d["entries"], d["source"])
        json.dump(d, open(p, "w"), ensure_ascii=False)
    for p in glob.glob(str(ROOT / "frontend/src/data/offline/commentary/*.json")):
        d = json.load(open(p))
        out = [x for s in ("kroeker", "ansorg") for x in fix([e for e in d if e["source"] == s], s)]
        d = [e for e in d if e["source"] not in ("kroeker", "ansorg")] + out
        json.dump(d, open(p, "w"), ensure_ascii=False, separators=(",", ":"))
    print("ok")
