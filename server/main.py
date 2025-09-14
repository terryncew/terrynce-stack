# server/main.py
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json, time

app = FastAPI(title="terrynce-stack receipt API")

# CORS open for demo convenience
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

RECEIPT = Path("data/receipt.latest.json")

@app.get("/health")
def health():
    return {"ok": True, "time": int(time.time())}

@app.get("/receipt/latest")
def receipt_latest():
    if not RECEIPT.exists():
        return {"error": "no receipt yet"}
    try:
        data = json.loads(RECEIPT.read_text(encoding="utf-8"))
        return Response(
            content=json.dumps(data),
            media_type="application/json",
            headers={"Cache-Control": "no-store"},   # always fresh
        )
    except Exception as e:
        return {"error": f"bad receipt: {e}"}

# Built-in demo page so you don't worry about mixed content
@app.get("/demo")
def demo():
    html = """
<!doctype html><meta charset="utf-8"><title>Receipt Demo</title>
<script type="module" src="https://rawcdn.githack.com/terryncew/openline-core/main/receipts-kit/openline-card.js"></script>
<h3>Live Receipt</h3>
<openline-card mode="compact" src="/receipt/latest"></openline-card>
"""
    return Response(content=html, media_type="text/html", headers={"Cache-Control": "no-store"})
