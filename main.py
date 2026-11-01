"""Scam detector API: classifies screenshots of social-media posts with an LLM.

Run:  uvicorn main:app --host 127.0.0.1 --port 8000

Environment (.env supported):
    OPENAI_API_KEY    required
    OPENAI_MODEL      optional, default gpt-4o-mini
    SCAM_API_TOKEN    optional shared secret; when set, requests must send
                      "Authorization: Bearer <token>" (set it in the extension
                      popup). Strongly recommended if the server isn't
                      bound to localhost.
    SCAM_DB_PATH      optional, default background.db
"""

import os
import secrets
import sqlite3
from contextlib import asynccontextmanager, closing
from datetime import datetime

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI, OpenAIError
from pydantic import BaseModel, Field

load_dotenv()

DB_PATH = os.getenv("SCAM_DB_PATH", "background.db")
MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
API_TOKEN = os.getenv("SCAM_API_TOKEN", "")
MAX_IMAGE_CHARS = 8 * 1024 * 1024  # ~6 MB image as base64

PROMPT = (
    "You review screenshots of social-media posts for FINANCIAL scams: fake "
    "giveaways, crypto or investment schemes promising guaranteed returns, "
    "phishing for bank/UPI/card details, fake loans or job offers that ask for "
    "fees, impersonated brands or celebrities. Ordinary ads and posts are not "
    "scams. Answer whether this post is a scam, who it targets (e.g. "
    "'students', 'investors', 'elderly', or 'none'), and a one-sentence reason."
)


def init_db():
    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.execute("CREATE TABLE IF NOT EXISTS scamdata (date text, image text, target text)")
        columns = {row[1] for row in conn.execute("PRAGMA table_info(scamdata)")}
        if "reason" not in columns:
            conn.execute("ALTER TABLE scamdata ADD COLUMN reason text")
        conn.commit()


@asynccontextmanager
async def lifespan(_app):
    init_db()
    yield


app = FastAPI(title="Scam detector", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    # Any Chrome extension origin (unpacked extensions get a per-install ID);
    # use SCAM_API_TOKEN to control who can actually call the API.
    allow_origin_regex=r"chrome-extension://[a-p]{32}",
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

_client = None


def openai_client():
    global _client
    if _client is None:
        _client = OpenAI()
    return _client


def require_token(authorization: str = Header(default="")):
    if API_TOKEN and not secrets.compare_digest(authorization, f"Bearer {API_TOKEN}"):
        raise HTTPException(status_code=401, detail="Invalid or missing API token")


class ImageRequest(BaseModel):
    image_base64: str = Field(max_length=MAX_IMAGE_CHARS)


class Verdict(BaseModel):
    scam: bool
    target: str
    reason: str


@app.get("/health")
def health():
    return {"ok": True, "auth_required": bool(API_TOKEN)}


# A plain `def` endpoint runs in FastAPI's thread pool, so the (blocking)
# OpenAI call no longer stalls every other request.
@app.post("/classify-image", response_model=Verdict, dependencies=[Depends(require_token)])
def classify_image(request: ImageRequest):
    if not request.image_base64.startswith(("data:image/png;base64,", "data:image/jpeg;base64,", "data:image/webp;base64,")):
        raise HTTPException(status_code=422, detail="image_base64 must be a PNG/JPEG/WebP data URL")
    try:
        response = openai_client().chat.completions.parse(
            model=MODEL,
            response_format=Verdict,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": PROMPT},
                    {"type": "image_url", "image_url": {"url": request.image_base64, "detail": "low"}},
                ],
            }],
        )
    except OpenAIError as error:
        raise HTTPException(status_code=502, detail="Classification service unavailable") from error

    verdict = response.choices[0].message.parsed
    if verdict is None:
        raise HTTPException(status_code=502, detail="The model refused to classify this image")
    if verdict.scam:
        with closing(sqlite3.connect(DB_PATH)) as conn:
            conn.execute(
                "INSERT INTO scamdata (date, image, target, reason) VALUES (?, ?, ?, ?)",
                (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), request.image_base64, verdict.target, verdict.reason),
            )
            conn.commit()
    return verdict


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
