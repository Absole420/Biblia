"""Backend tests for BIBLIA study endpoints (sources, commentary, cross-references).

Covers iteration 10 addition: Calvin Kommentare (calvin-de) — German, public domain.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL") or os.environ.get("EXPO_BACKEND_URL")
assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL must be set"
BASE_URL = BASE_URL.rstrip("/")


@pytest.fixture
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- /api/study/sources ---
class TestStudySources:
    def test_sources_list_shape_and_integrated(self, api):
        r = api.get(f"{BASE_URL}/api/study/sources", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "sources" in data
        sources = data["sources"]
        assert isinstance(sources, list)
        # v0.9.0: 13 Quellen (5 deutsche Kommentare + xref integriert, übrige pending/link)
        assert len(sources) == 13, f"expected 13 sources, got {len(sources)}"
        ids = [s["id"] for s in sources]
        assert len(ids) == len(set(ids)), "duplicate source ids"
        integrated = {s["id"] for s in sources if s["status"] == "integrated"}
        assert integrated == {"calvin-de", "openbible-xref", "kroeker", "rieger", "ansorg", "streitenberger"}, integrated
        for s in sources:
            if s["status"] == "integrated":
                assert s["rights"]["fulltext"] is True and s["rights"]["redistribute"] is True, s["id"]
        by_id = {s["id"]: s for s in sources}
        # calvin-de (new, iteration 10)
        assert "calvin-de" in by_id
        calvin = by_id["calvin-de"]
        assert calvin["status"] == "integrated"
        assert calvin["type"] == "commentary"
        assert calvin["language"] == "de"
        assert "Gemeinfrei" in calvin["license"]
        assert calvin["rights"]["fulltext"] is True
        assert calvin["rights"]["redistribute"] is True
        # mhcc (englisch) ist nicht mehr gebündelt, nur noch als „pending“ gelistet
        assert "mhcc" in by_id
        assert by_id["mhcc"]["status"] == "pending"
        # openbible-xref must be present and integrated
        assert "openbible-xref" in by_id
        assert by_id["openbible-xref"]["status"] == "integrated"
        # Required rights/license/perspective fields
        for s in sources:
            for key in ("id", "type", "title", "license", "rights", "status"):
                assert key in s, f"missing key {key} in {s.get('id')}"


# --- /api/study/commentary/{book}/{chapter} ---
class TestStudyCommentary:
    def test_john_3_has_calvin_and_mhcc(self, api):
        r = api.get(f"{BASE_URL}/api/study/commentary/43/3", timeout=20)
        assert r.status_code == 200
        data = r.json()
        entries = data["entries"]
        # Must contain both mhcc (3 sections) + calvin (verse-level, 33 entries)
        by_src = {}
        for e in entries:
            by_src.setdefault(e["source"], []).append(e)
        assert "mhcc" in by_src, f"mhcc missing; sources={list(by_src.keys())}"
        assert "calvin-de" in by_src, f"calvin-de missing; sources={list(by_src.keys())}"
        assert len(by_src["mhcc"]) == 3
        assert len(by_src["calvin-de"]) >= 20, f"calvin Joh3 count={len(by_src['calvin-de'])}"
        # mhcc section ranges unchanged
        mhcc_ranges = sorted([(e["from"], e["to"]) for e in by_src["mhcc"]])
        assert mhcc_ranges == [(1, 8), (9, 21), (22, 36)]
        for e in entries:
            assert e["book"] == 43 and e["chapter"] == 3
            assert e["text"] and len(e["text"]) > 50

    def test_romans_8_has_calvin(self, api):
        """Romans 8 should return calvin-de entries (book 45)."""
        r = api.get(f"{BASE_URL}/api/study/commentary/45/8", timeout=20)
        assert r.status_code == 200
        entries = r.json()["entries"]
        srcs = {e["source"] for e in entries}
        assert "calvin-de" in srcs, f"calvin missing; sources={srcs}"
        calvin = [e for e in entries if e["source"] == "calvin-de"]
        assert len(calvin) > 10
        for e in calvin:
            assert e["book"] == 45 and e["chapter"] == 8
            assert isinstance(e.get("from"), int)
            assert e["text"] and len(e["text"]) > 50

    def test_genesis_1_covered_by_kroeker(self, api):
        """Genesis 1 is now covered by Kroeker (and nicht von Calvin/mhcc); every entry is valid."""
        r = api.get(f"{BASE_URL}/api/study/commentary/1/1", timeout=15)
        assert r.status_code == 200
        entries = r.json()["entries"]
        assert len(entries) >= 1
        srcs = {e["source"] for e in entries}
        assert "kroeker" in srcs
        assert not srcs & {"calvin-de", "mhcc"}, srcs
        assert any(e["from"] <= 1 <= e["to"] for e in entries if e["source"] == "kroeker")
        for e in entries:
            assert e["book"] == 1 and e["chapter"] == 1
            assert 1 <= e["from"] <= e["to"] <= 31
            assert e["text"].strip() and "\ufffd" not in e["text"]

    def test_john_1_has_calvin_only(self, api):
        """John 1 is covered by Calvin but NOT by mhcc seed."""
        r = api.get(f"{BASE_URL}/api/study/commentary/43/1", timeout=15)
        assert r.status_code == 200
        entries = r.json()["entries"]
        srcs = {e["source"] for e in entries}
        assert "calvin-de" in srcs
        assert "mhcc" not in srcs
        assert len(entries) >= 20


# --- /api/study/xref/{book}/{chapter} ---
class TestStudyXref:
    def test_john_3_has_many_refs(self, api):
        r = api.get(f"{BASE_URL}/api/study/xref/43/3", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert "refs" in data
        refs = data["refs"]
        assert isinstance(refs, list)
        assert len(refs) > 20
        row = refs[0]
        assert len(row) == 8
        for v in row:
            assert isinstance(v, int)
        assert "format" in data

    def test_unknown_book_returns_empty(self, api):
        r = api.get(f"{BASE_URL}/api/study/xref/999/1", timeout=10)
        assert r.status_code == 200
        assert r.json()["refs"] == []
