"""Importiert gemeinfreie / frei weitergebbare deutsche SWORD-Kommentare (RawCom) nach backend/data/commentaries/<id>.json.
Nutzung (einmalig, offline danach): python3 import_sword_commentaries.py <modulordner> <quelle-id> <versification>
Benötigt pysword nur zur Bauzeit (Kanon-Tabellen), nicht in der App.
"""
import html, json, re, struct, sys
from pathlib import Path

sys.path.insert(0, "/tmp/pyw")
from pysword import canons  # noqa: E402

OSIS_TO_NR = {o: i + 1 for i, o in enumerate(
    "Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal "
    "Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev".split())}
ELB = json.load(open(Path(__file__).resolve().parents[1] / "data/elb1905.json"))
VCOUNT = {b["nr"]: [len(c) for c in b["chapters"]] for b in ELB["books"]}


def clean(raw: bytes) -> str:
    t = raw.decode("utf-8", "replace") if raw else ""
    t = re.sub(r"(?is)<(note|rdg|scripRef)[^>]*>.*?</\1>", lambda m: "" if m.group(1).lower() == "note" else re.sub(r"<[^>]+>", "", m.group(0)), t)
    t = re.sub(r"(?i)<(br|lb|p|div|l)\b[^>]*/?>|</(p|div|l)>", "\n", t)
    t = re.sub(r"<[^>]+>", "", t)
    t = html.unescape(t).replace("\\par", "\n")
    t = re.sub(r"[ \t\r\f\v]+", " ", t)
    return re.sub(r"\n\s*\n+", "\n\n", t).strip()


def read(moddir: Path, versification: str, source: str):
    canon = canons.canons[versification]
    out = []
    for testament in ("ot", "nt"):
        vss, dat = moddir / f"{testament}.vss", moddir / testament
        if not vss.exists():
            continue
        idx, data = vss.read_bytes(), dat.read_bytes()
        n = len(idx) // 6
        entry = lambda i: struct.unpack("<IH", idx[i * 6:i * 6 + 6]) if i < n else (0, 0)
        i = 2  # 0: Modul, 1: Testament
        for book in canon[testament]:
            i += 1  # Buch-Einleitung
            nr = OSIS_TO_NR.get(book[1])
            for ch, verses in enumerate(book[3], start=1):
                i += 1  # Kapitel-Einleitung
                prev = None
                for v in range(1, verses + 1):
                    off, size = entry(i)
                    i += 1
                    if not nr or size == 0 or ch > len(VCOUNT[nr]) or v > VCOUNT[nr][ch - 1]:
                        prev = None
                        continue
                    if prev and prev[0] == (off, size):  # verlinkte Verse = ein Abschnitt
                        prev[1]["to"] = v
                        prev[1]["scope"] = "range"
                        continue
                    text = clean(data[off:off + size])
                    if len(text) < 20:
                        prev = None
                        continue
                    e = {"id": f"{source}-{nr}-{ch}-{v}", "book": nr, "chapter": ch, "from": v, "to": v, "scope": "verse", "title": "", "text": text}
                    out.append(e)
                    prev = ((off, size), e)
    return out


if __name__ == "__main__":
    moddir, source, vers, label = Path(sys.argv[1]), sys.argv[2], sys.argv[3], sys.argv[4]
    entries = read(moddir, vers, source)
    from_books = {}
    for e in entries:
        e["title"] = f"{label} zu {e['book']}:{e['chapter']},{e['from']}" + (f"–{e['to']}" if e["to"] != e["from"] else "")
        from_books.setdefault(e["book"], 0)
    out = Path(__file__).resolve().parents[1] / f"data/commentaries/{source.replace('-', '_')}.json"
    json.dump({"source": source, "entries": entries}, open(out, "w"), ensure_ascii=False)
    print(source, len(entries), "Abschnitte,", len(from_books), "Bücher,", round(out.stat().st_size / 1e6, 1), "MB")
