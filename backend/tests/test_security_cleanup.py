# Iteration 50: security cleanup – /api/status removed, search limits, regression of core read APIs
import os
import requests
import pytest

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL").rstrip("/")


@pytest.fixture
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# Removed write endpoint
def test_status_post_removed(api):
    r = api.post(f"{BASE_URL}/api/status", json={"client_name": "TEST_x"})
    assert r.status_code in (404, 405)


def test_status_get_removed(api):
    r = api.get(f"{BASE_URL}/api/status")
    assert r.status_code in (404, 405)


# Search
def test_search_limit_2(api):
    r = api.get(f"{BASE_URL}/api/bible/search", params={"q": "Liebe", "limit": 2})
    assert r.status_code == 200
    d = r.json()
    assert len(d["results"]) == 2 and d["truncated"] is True
    assert all("liebe" in x["text"].lower() for x in d["results"])


def test_search_limit_500_rejected(api):
    assert api.get(f"{BASE_URL}/api/bible/search", params={"q": "Liebe", "limit": 500}).status_code == 422


def test_search_limit_200_ok(api):
    assert api.get(f"{BASE_URL}/api/bible/search", params={"q": "Liebe", "limit": 200}).status_code == 200


def test_search_q_too_long(api):
    assert api.get(f"{BASE_URL}/api/bible/search", params={"q": "a" * 201}).status_code == 422


def test_search_q_too_short(api):
    assert api.get(f"{BASE_URL}/api/bible/search", params={"q": "ab"}).status_code == 422


def test_search_limit_zero(api):
    assert api.get(f"{BASE_URL}/api/bible/search", params={"q": "Liebe", "limit": 0}).status_code == 422


# Regression
def test_chapter(api):
    r = api.get(f"{BASE_URL}/api/bible/1/1")
    assert r.status_code == 200 and len(r.json()["verses"]) == 31


def test_commentary_rieger_no_fffd(api):
    r = api.get(f"{BASE_URL}/api/study/commentary/45/8")
    assert r.status_code == 200
    ents = r.json()["entries"]
    assert any(e["id"] == "rieger-45-8-28" for e in ents)
    assert all("\ufffd" not in e["text"] for e in ents)
    assert "Römer" in next(e for e in ents if e["id"] == "rieger-45-8-28")["text"]


def test_cors_no_credentials(api):
    r = api.get(f"{BASE_URL}/api/bible/translations", headers={"Origin": "https://example.com"})
    assert r.status_code == 200
    assert r.headers.get("access-control-allow-credentials") in (None, "false")
