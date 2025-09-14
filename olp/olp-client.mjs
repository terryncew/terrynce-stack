// Robust client: posts to /frame with wrapper fallback + retry, and writes a receipt.
import fs from "node:fs";
import path from "node:path";

const BASE =
  process.env.OLP_BASE ||
  (process.env.OLP_URL ? process.env.OLP_URL.replace(/\/frame$/, "") : "http://127.0.0.1:8000");

export const OLP_URL =
  process.env.OLP_URL || process.env.VITE_OLP_URL || `${BASE}/frame`;

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

async function postWithRetry(bodyObj, tries = 5, delay = 500) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      try { return await postOnce(OLP_URL, { frame: bodyObj }); }
      catch { return await postOnce(OLP_URL, bodyObj); } // fallback
    } catch (e) {
      last = e;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error(`OLP POST failed after retries: ${last}`);
}

export function minimalFrame({ claimLabel, deltaScale = 0.0,
  attrs = { asset_class: "equity", cadence_pair: "min↔hour" } } = {}) {
  return {
    nodes: [{ id: "C1", type: "Claim", label: claimLabel, attrs, weight: 0.62 }],
    edges: [],
    morphs: [],
    telem: { delta_scale: deltaScale },
  };
}

export async function sendFrame({ nodes = [], edges = [], telem = {}, morphs = [], digest = null } = {}) {
  const frame = { nodes, edges, morphs, telem, ...(digest ? { digest } : {}) };
  return postWithRetry(frame);
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
