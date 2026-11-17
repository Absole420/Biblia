# Verifies every reading R(...) in prophets2.ts/synoptics.ts and every synopsis column S(...) resolves to Elberfelder verses via /api/bible
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", os.environ.get("EXPO_BACKEND_URL", "")).rstrip("/")
DATA = "/app/frontend/src/data"
BOOKS = {m.group(2): int(m.group(1)) for m in re.finditer(r'nr: (\d+), code: "([^"]+)"', open(f"{DATA}/books.ts").read())}


def refs():
    out = []
    for f in ("prophets2.ts", "synoptics.ts"):
        src = open(f"{DATA}/{f}").read()
        for m in re.finditer(r'\b([RS])\("([^"]+)", (\d+), (\d+), (\d+)\)', src):
            out.append((f, m.group(2), int(m.group(3)), int(m.group(4)), int(m.group(5))))
    return sorted(set(out))


_cache = {}


@pytest.mark.parametrize("f,book,ch,frm,to", refs())
def test_ref_resolves(f, book, ch, frm, to):
    assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL not set"
    assert book in BOOKS, f"unknown book code {book}"
    key = (book, ch)
    if key not in _cache:
        r = requests.get(f"{BASE_URL}/api/bible/{BOOKS[book]}/{ch}", timeout=20)
        assert r.status_code == 200, r.text[:200]
        _cache[key] = r.json()["verses"]
    verses = _cache[key]
    assert len(verses) >= to, f"{book} {ch},{frm}-{to}: chapter has only {len(verses)} verses"
    assert all(v and v.strip() for v in verses[frm - 1:to]), f"empty verse in {book} {ch},{frm}-{to}"
