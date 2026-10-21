"""Backend tests for BIBLIA Bible endpoints (Elberfelder 1905)."""
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


# --- Bible chapter endpoints ---
class TestBibleChapter:
    def test_genesis_1_has_31_verses(self, api):
        r = api.get(f"{BASE_URL}/api/bible/1/1", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["book"] == 1
        assert data["chapter"] == 1
        assert data["translation"] == "Elberfelder 1905"
        assert isinstance(data["verses"], list)
        assert len(data["verses"]) == 31
        assert "Anfang" in data["verses"][0] or "anfang" in data["verses"][0].lower()

    def test_revelation_22_loads(self, api):
        r = api.get(f"{BASE_URL}/api/bible/66/22", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["book"] == 66
        assert data["chapter"] == 22
        assert len(data["verses"]) >= 20

    def test_invalid_chapter_404(self, api):
        r = api.get(f"{BASE_URL}/api/bible/1/99", timeout=30)
        assert r.status_code == 404

    def test_invalid_book_404(self, api):
        r = api.get(f"{BASE_URL}/api/bible/999/1", timeout=30)
        assert r.status_code == 404

    def test_psalms_119_long_chapter(self, api):
        r = api.get(f"{BASE_URL}/api/bible/19/119", timeout=30)
        assert r.status_code == 200
        assert len(r.json()["verses"]) >= 150


# --- Bible search endpoint ---
class TestBibleSearch:
    def test_search_gnade_returns_hits(self, api):
        r = api.get(f"{BASE_URL}/api/bible/search", params={"q": "Gnade"}, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "results" in data
        assert isinstance(data["results"], list)
        assert len(data["results"]) > 0
        # validate shape
        hit = data["results"][0]
        for k in ("book", "chapter", "verse", "text"):
            assert k in hit
        assert "gnade" in hit["text"].lower()

    def test_search_short_query_rejected(self, api):
        r = api.get(f"{BASE_URL}/api/bible/search", params={"q": "ab"}, timeout=30)
        assert r.status_code == 422

    def test_search_limit_truncation(self, api):
        # 'und' is extremely common; should be truncated at default limit 60
        r = api.get(f"{BASE_URL}/api/bible/search", params={"q": "und"}, timeout=60)
        assert r.status_code == 200
        data = r.json()
        assert len(data["results"]) <= 60
        if data.get("truncated"):
            assert len(data["results"]) == 60


# --- Core health ---
class TestHealth:
    def test_health(self, api):
        r = api.get(f"{BASE_URL}/health", timeout=15)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_api_root(self, api):
        r = api.get(f"{BASE_URL}/api/", timeout=15)
        assert r.status_code == 200
