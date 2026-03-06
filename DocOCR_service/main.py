"""
DocOCR_service — Standalone OCR extraction for GramHealth pregnancy documents.
Runs on port 8082, INDEPENDENT of ML_service.

CHW Integration Note (for teammate):
  - Patient submits document via step2 → OCR extracts EDD/LMP → saved to SQLite
  - CHW dashboard reads pregnancy_documents + patient_profiles tables for verification
  - On CHW approval: UPDATE patient_profiles SET verification_status='approved'
  - Pregnancy dashboard auto-activates based on that flag
"""

# ── SSL Fix for macOS Python 3.10 ────────────────────────────────────────────
# Python 3.10 from python.org/Framework installs don't use macOS system certs.
# Point SSL to certifi's up-to-date certificate bundle before any network call.
import ssl
import certifi
import os
os.environ['SSL_CERT_FILE'] = certifi.where()
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()
ssl._create_default_https_context = ssl.create_default_context
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import easyocr
import re
import io
import base64
from PIL import Image
import numpy as np
from datetime import datetime, timedelta
from typing import Optional

app = FastAPI(
    title="GramHealth DocOCR Service",
    description="Standalone OCR for pregnancy documents. Port: 8082",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load EasyOCR reader once at startup
reader = easyocr.Reader(['en'], gpu=False)

# ─── Date Parsing ──────────────────────────────────────────────────────────────

MONTH_MAP = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
}

DATE_PATTERNS = [
    r'\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b',   # DD/MM/YYYY
    r'\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b',   # YYYY-MM-DD
    r'\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{4})\b',
]

EDD_KEYWORDS = ['edd', 'expected delivery', 'due date', 'delivery date', 'expected date']
LMP_KEYWORDS = ['lmp', 'last menstrual', 'last period', 'menstrual date']


def parse_date(text: str) -> Optional[str]:
    for pattern in DATE_PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            g = m.groups()
            try:
                if any(c.isalpha() for c in str(g[1])):
                    day, month, year = int(g[0]), MONTH_MAP.get(g[1][:3].lower(), 0), int(g[2])
                elif len(str(g[0])) == 4:
                    year, month, day = int(g[0]), int(g[1]), int(g[2])
                else:
                    day, month, year = int(g[0]), int(g[1]), int(g[2])
                if 1 <= month <= 12 and 1 <= day <= 31 and 2000 <= year <= 2035:
                    return datetime(year, month, day).strftime('%Y-%m-%d')
            except Exception:
                continue
    return None


def extract_key_dates(lines: list) -> dict:
    raw_text = '\n'.join(lines)
    lower_text = raw_text.lower()
    edd, lmp = None, None

    for kw in EDD_KEYWORDS:
        idx = lower_text.find(kw)
        if idx != -1:
            d = parse_date(raw_text[idx: idx + 100])
            if d:
                edd = d
                break

    for kw in LMP_KEYWORDS:
        idx = lower_text.find(kw)
        if idx != -1:
            d = parse_date(raw_text[idx: idx + 100])
            if d:
                lmp = d
                break

    all_dates = [parse_date(line) for line in lines if parse_date(line)]

    if not edd and all_dates:
        today = datetime.today().strftime('%Y-%m-%d')
        future = sorted([d for d in all_dates if d > today])
        past = sorted([d for d in all_dates if d <= today])
        if future:
            edd = future[0]
        if past:
            lmp = past[-1]

    if lmp and not edd:
        try:
            edd = (datetime.strptime(lmp, '%Y-%m-%d') + timedelta(days=280)).strftime('%Y-%m-%d')
        except Exception:
            pass

    return {"edd": edd, "lmp": lmp, "raw_text": raw_text, "all_dates_found": all_dates}


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "DocOCR Service running", "port": 8082}


@app.post("/extract")
async def extract(file: UploadFile = File(...)):
    """Upload an image file. Returns extracted EDD, LMP and raw OCR text."""
    if not (file.content_type and file.content_type.startswith('image/')):
        raise HTTPException(400, "File must be an image.")
    try:
        contents = await file.read()
        img = np.array(Image.open(io.BytesIO(contents)).convert('RGB'))
        lines = [r[1] for r in reader.readtext(img)]
        result = extract_key_dates(lines)
        return {**result, "confidence": "high" if result["edd"] else "low"}
    except Exception as e:
        raise HTTPException(500, f"OCR failed: {e}")


@app.post("/extract-base64")
async def extract_base64(data: dict):
    """
    Send a base64-encoded image string from SQLite.
    Body: { "image_base64": "...", "doc_type": "USG Report" }
    """
    try:
        b64 = data.get("image_base64", "")
        if b64.startswith("data:image"):
            b64 = b64.split(",", 1)[1]
        img = np.array(Image.open(io.BytesIO(base64.b64decode(b64))).convert('RGB'))
        lines = [r[1] for r in reader.readtext(img)]
        result = extract_key_dates(lines)
        return {
            **result,
            "doc_type": data.get("doc_type", "unknown"),
            "confidence": "high" if result["edd"] else "low"
        }
    except Exception as e:
        raise HTTPException(500, f"OCR failed: {e}")
