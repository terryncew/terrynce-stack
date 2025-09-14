// olp/olp-client.mjs
// Minimal client to POST frames to OpenLine bus and write a tiny receipt JSON.
// Node 18+ required (global fetch). No deps.

import fs from "node:fs";
import path from "node:path";

const OLP_URL =
  process.env.OLP_URL ||
  process.env.VITE_OLP_URL ||
  "http://127.0.0.1:8088/frame";

async function postWithRetry(body, tries = 5, delay = 500) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(OLP_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error(`OLP POST failed after retries: ${last}`);
}

export async function sendFrame({
  nodes = [],
  edges = [],
  telem = {},
  stream = "stack",
  digest = null,
  morphs = [],
} = {}) {
  const payload = {
    stream_id: stream,
    t_logical: Math.floor(Date.now() / 1000),
    gauge: "sym",
    units: "confidence:0..1,cost:tokens",
    nodes,
    edges,
    digest:
      digest || { b0: 1, cycle_plus: 0, x_frontier: 0, s_over_c: 1.0, depth: 0 },
    morphs,
    telem,
    signature: null,
  };
  return postWithRetry(JSON.stringify(payload));
}

export function buildReceipt({
  claim,
  because = [],
  but = [],
  so = "",
  telem = {},
  threshold = 0.03,
  model,
  attrs,
} = {}) {
  return { claim, because, but, so, telem, threshold, model, attrs };
}

export async function writeReceiptFile(
  receipt,
  file = "data/receipt.latest.json"
) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(receipt, null, 2));
  return file;
}
