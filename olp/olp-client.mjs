// Posts RAW frames to /frame (no wrapper). Node 18+ (global fetch).
import fs from "node:fs";
import path from "node:path";

// ↓ For GitHub-only flow, paste your 8088 forwarded URL here after Step 2.
export const OLP_URL = process.env.OLP_URL || "https://<FORWARDED_8088_HOST>/frame";

async function postOnce(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`POST ${url} -> ${r.status}: ${text}`);
  try { return JSON.parse(text); } catch { return text; }
}

export async function sendFrame(frame) {
  return postOnce(OLP_URL, frame); // RAW (no {frame:...})
}

export function minimalFrame({
  claimLabel = "debug",
  deltaScale = 0.0,
  // keep ASCII here for safety on mobile keyboards
  attrs = { asset_class: "equity", cadence_pair: "min-hour" },
} = {}) {
  return {
    nodes: [{ id: "C1", type: "Claim", label: claimLabel, attrs, weight: 0.62 }],
    edges: [],
    morphs: [],
    telem: { delta_scale: deltaScale },
  };
}

export function buildReceipt({ claim, because = [], but = [], so = "",
  telem = {}, threshold = 0.03, model, attrs } = {}) {
  return { claim, because, but, so, telem, threshold, model, attrs };
}

export async function writeReceiptFile(receipt, file = "data/receipt.latest.json") {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(receipt, null, 2));
  return file;
}
