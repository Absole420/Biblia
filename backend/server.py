from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Probe endpoint for the deployer and pod health checks: root-level (not /api), no DB call.
@app.get("/health", include_in_schema=False)
@app.head("/health", include_in_schema=False)
async def health():
    return {"status": "ok"}

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# ---- Bibel (Elberfelder 1905, gemeinfrei) ----
import json as _json
from fastapi import HTTPException, Query

with open(ROOT_DIR / "data" / "elb1905.json", encoding="utf-8") as _f:
    BIBLE = _json.load(_f)
BOOKS = {b["nr"]: b for b in BIBLE["books"]}


# Austauschbare Übersetzungen: weitere (lizenzierte) Texte im selben JSON-Format als
# data/<id>.json ablegen, z. B. data/elb2006.json – sie werden dann automatisch angeboten.
TRANSLATION_META = {
    "elb1905": "Elberfelder 1905 (gemeinfrei)",
    "elb2006": "Elberfelder Bibel, Edition 2006 (lizenzpflichtig, SCM R.Brockhaus)",
}
EXTRA = {}
for _tid in TRANSLATION_META:
    if _tid != "elb1905" and (ROOT_DIR / "data" / f"{_tid}.json").exists():
        with open(ROOT_DIR / "data" / f"{_tid}.json", encoding="utf-8") as _f:
            EXTRA[_tid] = {bk["nr"]: bk for bk in _json.load(_f)["books"]}


@api_router.get("/bible/translations")
async def bible_translations():
    return {"translations": [{"id": t, "name": n, "available": t == "elb1905" or t in EXTRA} for t, n in TRANSLATION_META.items()]}


@api_router.get("/bible/{book}/{chapter}")
async def bible_chapter(book: int, chapter: int, t: str = "elb1905"):
    books = BOOKS if t == "elb1905" else EXTRA.get(t)
    if books is None:
        raise HTTPException(status_code=404, detail=f"Übersetzung '{t}' nicht verfügbar (keine lizenzierten Daten)")
    b = books.get(book)
    if not b or chapter < 1 or chapter > len(b["chapters"]):
        raise HTTPException(status_code=404, detail="Kapitel nicht gefunden")
    return {"book": book, "chapter": chapter, "translation": t, "verses": b["chapters"][chapter - 1]}


@api_router.get("/bible/search")
async def bible_search(q: str = Query(..., min_length=3), limit: int = 60):
    ql = q.lower()
    hits = []
    for nr, b in BOOKS.items():
        for ci, ch in enumerate(b["chapters"]):
            for vi, text in enumerate(ch):
                if ql in text.lower():
                    hits.append({"book": nr, "chapter": ci + 1, "verse": vi + 1, "text": text})
                    if len(hits) >= limit:
                        return {"q": q, "results": hits, "truncated": True}
    return {"q": q, "results": hits, "truncated": False}


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
# ---- Studieninhalte (getrennt von Bibeltext und persönlichen Daten)
with open(ROOT_DIR / "data" / "sources.json", encoding="utf-8") as _f:
    SOURCES = _json.load(_f)
COMMENTARIES = []
for _p in (ROOT_DIR / "data" / "commentaries").glob("*.json"):
    with open(_p, encoding="utf-8") as _f:
        _d = _json.load(_f)
    COMMENTARIES += [{**e, "source": _d["source"]} for e in _d["entries"]]


@api_router.get("/study/sources")
async def study_sources():
    return {"sources": SOURCES}


@api_router.get("/study/commentary/{book}/{chapter}")
async def study_commentary(book: int, chapter: int):
    return {"entries": [e for e in COMMENTARIES if e["book"] == book and e["chapter"] == chapter]}


@api_router.get("/study/xref/{book}/{chapter}")
async def study_xref(book: int, chapter: int):
    p = ROOT_DIR / "data" / "xref" / f"{book}.json"
    if not p.exists():
        return {"refs": []}
    with open(p, encoding="utf-8") as f:
        rows = _json.load(f).get(str(chapter), [])
    return {"refs": rows, "format": "verse,toBook,toCh,toV,toCh2,toV2,votes,versificationUncertain"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
