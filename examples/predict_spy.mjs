// examples/predict_spy.mjs
// Demo: send 3 frames and write a receipt file you can fetch in the UI.
import { sendFrame, buildReceipt, writeReceiptFile } from "../olp/olp-client.mjs";

// --- SYNC (declare the claim)
await sendFrame({
  nodes: [
    {
      id: "C1",
      type: "Claim",
      label: "SPY likely up tomorrow",
      attrs: { asset_class: "equity", cadence_pair: "min↔hour" },
      weight: 0.62, // your “So:” confidence if you want to use it later
    },
  ],
});

// --- MEASURE (telemetry; pretend we computed Δ_scale)
const deltaScale = 0.028;
await sendFrame({
  nodes: [{ id: "E1", type: "Evidence", label: "FlowState day decode + 30d 1m ctx" }],
  edges: [{ src: "E1", dst: "C1", rel: "supports", weight: 0.9 }],
  telem: { delta_scale: deltaScale },
});

// --- STITCH (realized outcome lands later — demo uses +0.5%)
const realized = { ret: 0.005 };
await sendFrame({
  nodes: [{ id: "O1", type: "Outcome", label: "Realized +0.5%" }],
  edges: [{ src: "O1", dst: "C1", rel: "updates", weight: 1.0 }],
  telem: { delta_scale: deltaScale },
});

// --- Write a tiny receipt JSON for the UI
const receipt = buildReceipt({
  claim: "SPY likely up tomorrow",
  because: ["FlowState day decode", "30d minute context"],
  but: [`Scale drift Δ_scale = ${deltaScale.toFixed(3)} (min↔hour)`],
  so: "Within 3% tolerance — recheck at close",
  telem: { delta_scale: deltaScale },
  threshold: 0.03,
  model: "ibm-research/flowstate-r1",
  attrs: { cadence: "day" },
});

const file = await writeReceiptFile(receipt);
console.log("[ok] wrote", file);
