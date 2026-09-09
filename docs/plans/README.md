# Plan tracker — single source of truth for plan status

**Created:** 2026-08-18 · **Pruned:** 2026-09-05 (owner decision: shipped
history lives on disk under `docs/archive/plans/`, not in this file).
**Status enum:** `proposed | approved | in-progress | shipped | archived`.
The tracker is authoritative when a plan doc's `**Status:**` drifts.

## Rules

1. **One flat namespace.** New top-level plans are
   `docs/plans/YYYY-MM-DD-P<number>-<slug>.md` — the P-number is assigned on
   registration and written into the filename. No letter codes beyond the
   P-number. **Child-plan exception:** child slices / umbrella-internal annexes
   may use parent-derived IDs such as `P23.0`–`P23.9` or `P24A` without
   consuming tracker P-numbers; only top-level roadmap plans appear in Active.
2. **Numbers live in filenames and this tracker.** Sequential P-numbers are
   assigned on registration and never renumbered; execution order is separate.
3. **Dependencies by tracker number**, never by letter family.
4. **Archive on close.** Shipped plan docs move to `docs/archive/plans/`; this
   tracker lists only the 5 most recent archived artifacts.
5. **Re-registration, not re-lettering.** Approved-but-unscheduled work keeps
   content and gains a tracker number; only shipped/superseded docs archive.
6. **Execution order is pinned by dependencies/order contracts, not numbering.**
   Child numeric order is historical naming, not a sequencing guarantee.
7. **No narrative in Active rows.** Keep rows compact; detailed scope lives in
   plan docs.
8. **Collapse on ship.** Archive doc + tracker row update happen together.

## Progressive planning model

Roadmap tiers follow:

```text
umbrella
→ targeted evidence only where needed
→ implementation-ready child plan
→ implementation
```

- Umbrellas own durable WHAT/WHY/BOUNDARIES/ORDER/research gates/high-level acceptance.
- Evidence artifacts inform plans but never silently override product contracts.
- Accepted owner reconciliation is the architecture authority when evidence and
  prior plan text conflict.
- Child plans carry implementation detail and may proceed only when marked
  `implementation-ready`.

Evidence selection: do not reopen broad research when prior discovery/harvests
already answer the relevant questions. Use bounded rechecks only where code has
changed or a concrete implementation uncertainty remains.

Child-plan status vocabulary:

```text
seed — pre-evidence
seed — evidence pending
evidence complete — reconciliation pending
implementation-ready
in progress
shipped / archived
```

Applied: P23 umbrella + implementation-ready P23.0–P23.9 child set, informed by
completed H1/H2/H3/H5 (`H4` remains deferred until offset/trim/curve work is
actually scheduled); P24 umbrella with P24A annex; P25 umbrella awaiting its
own evidence/reconciliation gates.

## Model routing

Per-increment difficulty/model routing lives in [`model-assessment.md`](model-assessment.md).
Policy rules remain:

- DeepSeek V4 Flash substitutes for Luna-tier work while retaining the Luna
  difficulty as the capability reference.
- Never route to Terra or Sol low.
- Escalate by evidence, not habit; pass stronger models the original failure state.
- Margin 0 means escalate on first demonstrated failure rather than pre-paying.

## Active (live work only)

| # | Plan | Status | Depends on | Doc |
|---|------|--------|------------|-----|
| P13 | Sequence stop-at-node playback | proposed — nice-to-have, unscheduled | P12 | [2026-08-27-P13-stop-at-node-playback.md](2026-08-27-P13-stop-at-node-playback.md) |
| P23 | Layout Depth — minimum useful Build set | **approved** — owner-ratified wall-first reconciliation 2026-09-09; H1/H2/H3/H5 complete; next = coupled Foundation Gate `P23.0a → P23.8 → P23.0b`, no new-schema writes before full F0 acceptance | P22 | [umbrella](2026-09-07-P23-layout-depth-minimum-build.md) |
| P24 | Scene / Staging Depth umbrella — P24A asset supply + P24B rich 3D staging | proposed — P24A Phase 2 reviewed + annex registered; P24B current-code/reference studies still required; consumes P23's shipped coordinate/ownership model rather than reasserting room-local storage as a future invariant | P23 | [umbrella](2026-09-08-P24-scene-staging-depth-umbrella.md) |
| P25 | Experience Foundation umbrella | proposed — Phase 5 external research reviewed directionally; E0–E6 reconciliation required before implementation brief | P24 | [umbrella](2026-09-08-P25-experience-foundation-umbrella.md) |
| — | Branch rejoin — experiment, no schedule | proposed | P8 conceptually | [2026-08-21-branch-rejoin-experiment.md](2026-08-21-branch-rejoin-experiment.md) |
| … | future work re-registers here | | | |

## Gate status

- P22 shipped 2026-09-08 with hosted cold-browser acceptance.
- **Next: P23 Foundation Gate F0.** P23 wall-first direction was owner-ratified
  2026-09-09 after H1/H2/H3/H5. F0 is one gate across P23.0 + P23.8:
  schema/compat scaffolding → topology/Room reconciliation → migration/compiler/
  editor-adapter cutover → compatibility acceptance → enable new writers.
- P23 current code remains Room-owned/Room-local until F0 ships; plans/North Star
  describe target direction, while implementation/component docs continue to
  describe current behavior until code changes.
- P24 follows accepted P23 minimum and must consume the coordinate/ownership
  model actually shipped by P23. Current P24 research references to room-local
  transforms describe the pre-P23 baseline, not a future invariant.
- P25 may follow accepted P23/P24 useful minima before optional depth tails.
- Deferred/non-blocking: P3B.7b (incl. P3.4/P3.5 acceptance tail).
- Proposed/unscheduled: P13, branch rejoin.

## Archived plans (recent 5 only)

- `archived → [2026-09-07-P22-basic-publish-visitor-runtime.md](../archive/plans/2026-09-07-P22-basic-publish-visitor-runtime.md)` (shipped 2026-09-08)
- `archived → [2026-09-04-P21-unified-project-shell-spatial-reconciliation.md](../archive/plans/2026-09-04-P21-unified-project-shell-spatial-reconciliation.md)` (shipped 2026-09-08)
- `archived → [2026-08-19-P20-Project-assets-registry-R2.md](../archive/plans/2026-08-19-P20-Project-assets-registry-R2.md)` (shipped 2026-09-04)
- `archived → [2026-08-30-P19-project-persistence.md](../archive/plans/2026-08-30-P19-project-persistence.md)` (shipped 2026-09-03)
- `archived → [2026-09-06-scope-decision-roadmap-reconciliation.md](../archive/plans/2026-09-06-scope-decision-roadmap-reconciliation.md)` (scope decision; ratified 2026-09-06)

Older history remains under `docs/archive/plans/` and
`docs/archive/plans/pre-h1-letters/` per the pruning rule.

## Long-term roadmap

Direction lives in [`../north-star.md`](../north-star.md); this section records
registered sequencing tiers.

- **P20 — Project Asset Registry + R2.** Shipped 2026-09-04.
- **P21 — Product shell + Project Hub + core editor UX polish.** Shipped
  2026-09-08.
- **P22 — Basic Publish + visitor runtime.** Shipped 2026-09-08. Established the
  reusable cold visitor-safe execution target and immutable publication/version
  boundary.
- **P23 — Layout Depth family (approved, staged).** The minimum is now explicitly
  wall-first: first-class Junctions/Walls/Openings; persistent Rooms reconciled
  over derived boundary-Wall faces; `boundary | partition` Wall semantics;
  deterministic Room identity/history; exact dimensions/snapping/sketching;
  Wall-hosted openings; duplicate/repeat/presets; architectural Plan polish;
  and legacy Save/Publish compatibility. Scene/Camera target project/world-local
  physical transforms, with trusted legacy Room-frame conversion and no implicit
  movement when architecture changes. `LayoutObject[]` stays document-level and
  project/world-local. One `compileLayoutGeometry()` family remains the Plan/3D/
  visitor geometry authority. Optional stairs/railings/richer curves/constraints/
  roof/advanced CAD depth remains evidence-gated later work.
- **P24 — Scene / Staging Depth umbrella (registered, staged).** P24A remains
  Asset Supply + Canonical Ingest; P24B remains Rich 3D Scene/Staging. P24
  preserves `SceneDocument` ownership, one project asset registry, canonical
  selection/history, the existing transform authority, Threlte patterns and
  visitor/editor isolation. Its implementation must consume the spatial
  coordinate model shipped by P23; current room-local code is baseline evidence,
  not a permanent future contract. P24B's exact minimum remains TBD until its
  B0–B6 current-code/reference studies close.
- **P25 — Experience Foundation umbrella.** Remains research/reconciliation until
  E0–E6 close; composes existing Spatial/Camera/Assets meaning and must reuse the
  canonical Camera route/motion system.
- **Bounded agent/reuse proof.** After the first complete P23/P24/P25
  visitor-authoring slice, test a small semantic operation set through the same
  canonical human/agent behavior before broad platform expansion.
- **P26+ — evidence-led platform expansion.** Richer P23/P24/P25 tails,
  templates/kits/provider adapters, richer asset workflows, collaboration,
  Publish/domain/embed depth and eventual runtime SDK/headless runtime are
  separately registered only when justified.
- **Typed DB layer — conditional infrastructure, not a numbered milestone.**
  Revisit only when pressure on raw parameterized SQL justifies it.

## Cross-cutting planning rules

- **Operation-first:** semantic intent → explicit inputs → validation →
  deterministic candidate → transaction/history → rendering/runtime. UI is one
  client, not sole owner of domain behavior.
- **Ownership stays explicit:** Layout and Scene remain separate documents even
  as P23 changes Scene/Camera coordinate storage.
- **Compatibility is a product gate:** new writers do not strand old saved or
  published data. Read-only legacy compatibility may use explicit adapters but
  cannot create a second renderer/compiler truth.
- **Current versus target must be labeled:** planning/North-Star direction does
  not rewrite component docs before implementation lands.
- **Validation/observability grows incrementally:** structured semantic facts and
  deterministic diagnostics first; no giant validator subsystem.

## Current / near-term platform sequence

P19 persistence → P20 assets → P21 shell → P22 publish/visitor are shipped.
Next is P23 wall-first Layout Depth, then P24 Stage minimum, then P25 Experience
foundation, then the bounded agent/reuse proof and evidence-led P26+ expansion.

No Experience implementation ticket is created merely by roadmap direction.
P25 persistence ownership remains unfrozen until its own implementation-ready
gate. P19–P22 remain raw parameterized SQL; typed DB adoption remains conditional
infrastructure rather than a product milestone.
