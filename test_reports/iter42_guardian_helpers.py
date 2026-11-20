# Iteration 42 helpers: Data Guardian Engine web tests (paste into browser_automation scripts)
BASE = "https://gottes-wort-app.preview.emergentagent.com"
LEGACY = {"schemaVersion": 6, "xp": 120,
          "stations": {"john-1": {"completedAt": "2025-01-01T00:00:00.000Z", "examScore": 3, "examTotal": 4, "bestScore": 3, "attempts": 1}},
          "notes": [{"id": "n1", "title": "TEST_Legacy Notiz", "text": "Hallo", "createdAt": "2025-01-01T00:00:00.000Z", "updatedAt": "2025-01-01T00:00:00.000Z"}],
          "bookmarks": [], "highlights": {}, "settings": {"theme": "system", "fontScale": 1, "translation": "elb1905"}}
# seed: localStorage.setItem('biblia_state', JSON.stringify(JSON.stringify(LEGACY)))
# guardian keys: biblia_guardian_{live-a,live-b,week-a,week-b,before-change}
