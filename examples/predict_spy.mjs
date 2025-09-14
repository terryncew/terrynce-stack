import { minimalFrame, sendFrame, buildReceipt, writeReceiptFile, OLP_URL } from "../olp/olp-client.mjs";

const claim = "SPY likely up tomorrow";
const deltaScale = 0.028;

console.log("[setup] OLP_URL =", OLP_URL);

try {
  const res = await sendFrame(minimalFrame({ claimLabel: claim, deltaScale }));
  console.log("[post] OK:", res);
} catch (e) {
  console.error("[post] FAIL:", e.message);
}

const receipt = buildReceipt({
  claim,
  because: ["FlowState day decode", "30d minute context"],
  but: [`Scale drift Δ_scale = ${deltaScale.toFixed(3)} (min-hour)`],
  so: deltaScale <= 0.03 ? "Within 3% tolerance — recheck at close" : "Above 3% — needs explanation",
  telem: { delta_scale: deltaScale },
  threshold: 0.03,
  model: "ibm-research/flowstate-r1",
  attrs: { cadence: "day" },
});
await writeReceiptFile(receipt);
console.log("[ok] wrote data/receipt.latest.json");

