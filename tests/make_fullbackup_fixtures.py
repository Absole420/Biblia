# iter51: builds full-backup fixtures (valid w/ diary+progress, invalid JSON, wrong kind, invalid way entry, minimal way entry) from a real exported /tmp/full.json
import json, copy
b = json.load(open("/tmp/full.json"))
now = "2026-01-15T10:00:00.000Z"
entry = {"id": "TEST_way_1", "kind": "checkin", "date": "2026-01-15", "createdAt": now, "updatedAt": now, "mood": "TEST_ Dankbar",
         "feelings": [], "customFeelings": [], "refs": [], "topics": [], "stations": [], "lexicon": []}
good = copy.deepcopy(b)
outer = json.loads(good["state"]); st = outer["state"]
st["xp"] = 120
st["stations"] = {"hist-kings-solomon": {"completedAt": now, "examScore": 2, "examTotal": 2, "bestScore": 2, "attempts": 1}}
st["notes"] = [{"id": "TEST_note_1", "title": "TEST_ Notiz", "text": "TEST_ text", "createdAt": now, "updatedAt": now}]
good["state"] = json.dumps(outer)
good["way"] = {"v": 1, "entries": [entry]}
json.dump(good, open("/tmp/fb_good.json", "w"))
open("/tmp/fb_garbage.json", "w").write("{not json")
wrong = copy.deepcopy(good); wrong["kind"] = "something-else"; json.dump(wrong, open("/tmp/fb_wrongkind.json", "w"))
badway = copy.deepcopy(good); badway["way"] = {"v": 1, "entries": [entry, {"id": 5, "date": None}]}
json.dump(badway, open("/tmp/fb_badway.json", "w"))
minway = copy.deepcopy(good); minway["way"] = {"v": 1, "entries": [{"id": "TEST_min", "date": "2026-01-16"}]}
json.dump(minway, open("/tmp/fb_minway.json", "w"))
badphoto = copy.deepcopy(good); badphoto["photos"] = {"a.jpg": "!!notbase64"}; json.dump(badphoto, open("/tmp/fb_badphoto.json", "w"))
print("fixtures written")
