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


@api_router.get("/bible/{book}/{chapter}")
async def bible_chapter(book: int, chapter: int):
    b = BOOKS.get(book)
    if not b or chapter < 1 or chapter > len(b["chapters"]):
        raise HTTPException(status_code=404, detail="Kapitel nicht gefunden")
    return {"book": book, "chapter": chapter, "translation": BIBLE["translation"], "verses": b["chapters"][chapter - 1]}


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
