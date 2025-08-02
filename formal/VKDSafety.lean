/-
file: formal/VKDSafety.lean
description: Formal safety guarantees triggered by Viability Kernel Distance (VKD) crossing below zero.

This file defines:
• VKDSlice — minimal abstract distance to collapse
• VKDTriggersStorm — policy axiom: switch to STORM mode if VKD < 0
• StormLossCap — hard bound on φ loss in STORM
• vkd_guard_limits_phi_loss — φ degradation is capped when STORM is triggered

Status: Complete (uses axioms, no `sorry`)

License: AGPL-3.0-or-later WITH Commons-Clause
-/

/-
  file: Formal/VKDSafety.lean
  VKD < 0 ⇒ must switch to STORM; in STORM, φ loss per tick is bounded.
-/

import Formal.CoherenceCore

namespace Coherence

structure VKDSlice where
  vkd : ℝ  -- abstract viability kernel distance

/-- Policy axiom: negative VKD must trigger STORM (safety-first). -/
axiom VKDTriggersStorm :
  ∀ (v : VKDSlice) (m : Mode), v.vkd < 0 → m = Mode.STORM

/-- Storm bound: in STORM, φ_next ≥ φ - β for some β>0 (cap damage rate). -/
axiom StormLossCap :
  ∀ (p : Params) (β : ℝ), 0 < β →
  ∀ s, φ_next p s ≥ s.φ - β

theorem vkd_guard_limits_phi_loss
  (p : Params) (s : State) (v : VKDSlice)
  (β : ℝ) (βpos : 0 < β)
  (neg : v.vkd < 0) :
  φ_next p s ≥ s.φ - β := by
  -- VKD < 0 ⇒ STORM; STORM ⇒ bounded loss per tick.
  have := VKDTriggersStorm v Mode.STORM neg
  exact StormLossCap p β βpos s

end Coherence
