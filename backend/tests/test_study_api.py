"""Backend tests for BIBLIA study endpoints (sources, commentary, cross-references)."""
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
    def test_sources_list_shape_and_mhcc_integrated(self, api):
        r = api.get(f"{BASE_URL}/api/study/sources", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "sources" in data
        sources = data["sources"]
        assert isinstance(sources, list)
        assert len(sources) == 6, f"expected 6 sources, got {len(sources)}"
        by_id = {s["id"]: s for s in sources}
        # mhcc must be present and integrated
        assert "mhcc" in by_id
        assert by_id["mhcc"]["status"] == "integrated"
        assert by_id["mhcc"]["type"] == "commentary"
        # openbible-xref must be present and integrated
        assert "openbible-xref" in by_id
        assert by_id["openbible-xref"]["status"] == "integrated"
        # Required rights/license/perspective fields
        for s in sources:
            for key in ("id", "type", "title", "license", "rights", "status"):
                assert key in s, f"missing key {key} in {s.get('id')}"


# --- /api/study/commentary/{book}/{chapter} ---
class TestStudyCommentary:
    def test_john_3_has_three_mhcc_sections(self, api):
        r = api.get(f"{BASE_URL}/api/study/commentary/43/3", timeout=15)
        assert r.status_code == 200
        data = r.json()
        entries = data["entries"]
        assert len(entries) == 3
        expected_ranges = [(1, 8), (9, 21), (22, 36)]
        got_ranges = sorted([(e["from"], e["to"]) for e in entries])
        assert got_ranges == expected_ranges, f"got {got_ranges}"
        # All sections should have scope 'section' and source metadata
        for e in entries:
            assert e["scope"] == "section"
            assert e["book"] == 43 and e["chapter"] == 3
            assert e.get("source") == "mhcc"
            assert e["text"] and len(e["text"]) > 100

    def test_genesis_1_empty(self, api):
        r = api.get(f"{BASE_URL}/api/study/commentary/1/1", timeout=15)
        assert r.status_code == 200
        assert r.json()["entries"] == []

    def test_john_1_empty(self, api):
        """Only John 3 is covered by MHCC seed."""
        r = api.get(f"{BASE_URL}/api/study/commentary/43/1", timeout=15)
        assert r.status_code == 200
        assert r.json()["entries"] == []


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
        # row format: [verse, toBook, toCh, toV, toCh2, toV2, votes, versificationUncertain]
        row = refs[0]
        assert len(row) == 8
        for v in row:
            assert isinstance(v, int)
        # format metadata present
        assert "format" in data

    def test_unknown_book_returns_empty(self, api):
        r = api.get(f"{BASE_URL}/api/study/xref/999/1", timeout=10)
        assert r.status_code == 200
        assert r.json()["refs"] == []
