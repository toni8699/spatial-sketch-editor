# P24 — reconciliation sequence

**Date:** 2026-09-09  
**Status:** umbrella-internal reconciliation plan — evidence/planning only, not implementation-ready  
**Parent:** [P24 — Scene / Staging Depth umbrella](2026-09-08-P24-scene-staging-depth-umbrella.md)  
**Cross-view authority:** [Unified Plan / 3D authoring addendum](2026-09-09-P23-P24-unified-plan-3d-authoring-addendum.md)  
**Pascal evidence:** [`Pascal-editor-harvest.md`](../Deep-research/P24-3D-assets-staging/Pascal-editor-harvest.md) — CLOSED at pinned revision `32c3c8a24dae17c55beaabf45029148900a3b409`  
**Tracker:** P24 remains the registered plan number. This file consumes no new P-number and does not change P24's `proposed` status.

## Purpose

Turn the existing P24 research and current Museum implementation into a bounded, implementation-ready minimum without copying external editor feature lists or reopening ratified ownership.

This reconciliation may run **in parallel with P23 implementation**. It does not block P23 and does not authorize P24 implementation before its tracker dependency is satisfied.

```text
P23 implementation
→ proceeds independently through its existing child-plan dependencies

P24 reconciliation
→ may inspect current code + ratified P23 target in parallel
→ freezes implementation only after the required post-P23 seam recheck
```

P24 implementation still depends on the accepted P23 minimum useful Build set. Any P24 decision touching coordinates, placement ownership, selection routing, Plan projection or Scene/Camera migration must consume the coordinate/ownership model actually shipped by P23, not assume today's Room-local baseline remains permanent.

## Authority and evidence order

Read in this order:

1. [P24 umbrella](2026-09-08-P24-scene-staging-depth-umbrella.md);
2. [Unified Plan / 3D addendum](2026-09-09-P23-P24-unified-plan-3d-authoring-addendum.md);
3. [P24A annex](2026-09-08-P24A-asset-supply-canonical-ingest-annex.md);
4. current Museum Editor code and tests for the capability being reconciled;
5. checked-in Phase 2 / Phase 4 research — durable inputs are `../Deep-research/P24-3D-assets-staging/deep-research-exact-asset-compact.md` + `museum-editor-phase2-acquisition-manifest.json` (Phase 2) and `../Deep-research/P24-3D-assets-staging/deep-research-P24-3D-editing-compact.md` (Phase 4). The legacy `museum-editor-phase2-exact-asset-harvest-P24.md` path is absent on disk; the umbrella and P24A annex now use the compact artifact as the durable Phase 2 source. The Phase 4 full source remains absent per the umbrella;
6. completed [Pascal harvest](../Deep-research/P24-3D-assets-staging/Pascal-editor-harvest.md) where relevant;
7. additional direct reference inspection only where a concrete unresolved maturity question remains.

Museum contracts remain authority. External references are evidence only.

## Research rule

Do **not** launch another broad ecosystem survey.

For each unresolved capability:

```text
current Museum behavior
→ concrete maturity gap
→ one or two relevant direct references, if needed
→ exact source / version / license
→ KEEP | POLISH | DEEPEN | FOLLOW-UP | REJECT
```

If current code already answers the question, close it from Museum evidence rather than adding reference work for completeness.

## R-to-B mapping

| R step | Umbrella track |
|---|---|
| R0 | P23 delta map (no B equivalent) |
| R1 | P24A readiness (no B equivalent) |
| R2 | B0 capability-maturity baseline |
| R3 | B2 shared Plan/3D placement |
| R4 | B5 behavioral constraints (not a ship gate; R9/B6 decides inclusion) |
| R5 | B1 transform + arrangement |
| R6 | B3 material |
| R7 | B4 lighting + environment |
| R8 | B5 presentation/polish remainder |
| R9 | B6 minimum freeze / child-plan gate |

## R0 — current-state + P23 delta map

Before freezing P24 scope, produce one concise map of the seams P23 changes underneath Stage authoring.

At minimum inspect:

- Scene entity transform storage and world conversion;
- Scene Plan footprint/proxy projection;
- Plan Scene translate/rotate adapters;
- Scene placement entry points and floor/support assumptions;
- canonical selection identity across Plan/3D;
- Scene history/gesture lifecycle;
- Camera records only where P24 code touches shared Scene persistence/runtime;
- `LayoutDocument` / `SceneDocument` ownership boundary (`LayoutObjects` vs Scene entities) where P24 placement consults Layout geometry;
- Layout compile/query/editor-adapter cutover (`compileLayoutGeometry()`, query, migration) affecting Plan projection and support/surface resolution;
- Save/Load and P22 visitor consumption of Scene state.

Classify every finding as:

```text
stable across P23
changes in P23 F0
requires post-F0 recheck
irrelevant to P24
```

R0 prevents P24 from freezing around code that P23 is already scheduled to replace.

### R0 result — 2026-09-09 audit

R0 audit baseline:
remote parent: `e030038fa3708f578baf97a6bc4f8b6c77b5f689`
local Museum commit: `f0f1f6380a26a535bf3c50b37404fd1ff0bca42e`
P23 F0 scaffolding: uncommitted dirty tree at audit time (no F0 commit to pin).

F0 scaffolding decodes nothing wall-first yet; authoring stays Room-owned/Room-local until the F0 gate.

| Seam | Class |
|---|---|
| Scene transform storage + world conversion (`packages/project-model/src/scene.ts`) | changes in F0 / requires post-F0 recheck (world-local migration is P23.0b) |
| Plan footprint/proxy (`plan-scene-footprint.ts`) | logic stable / requires recheck (`rooms` source becomes wall-first registry) |
| Plan translate/rotate adapters (`plan-scene-transform.ts`) | stable / requires recheck (inverse-resolve disappears under world-local) |
| Placement + floor assumptions (`editor-placement.ts`, `placement-cluster-mutator.svelte.ts`) | stable / requires recheck (no stacked/support choice, no Layout-query lookup) |
| Selection identity (`selection-store.svelte.ts`) | stable / recheck for R4 continuity only |
| History/gesture (`history-controller.svelte.ts`) | stable / recheck operation-owner tags |
| Camera records in Scene | changes in F0 where touching shared resolver; pure tour routing irrelevant |
| Layout/Scene ownership boundary | changes in F0 (Layout side) / recheck — no persistent support dep without contract |
| `compileLayoutGeometry()` / query / editor-adapter | changes in F0 / recheck — support resolution source |
| Save/Load + P22 visitor | stable / recheck after world migration; Project Save/Load codec has no active Scene schema discriminator (package export versioning is a separate seam); `/museum` isolation holds |

## R1 — P24A implementation-readiness reconciliation

Run the bounded readiness pass already required by the P24A annex.

Close the actual current gaps for:

- asset/provenance identity;
- deterministic model normalization;
- PlanProxy / `AssetFootprint` generation and Plan eligibility;
- normalized pivot + grounding/contact metadata;
- canonical GLB/model registry path;
- Save/Load + P22 cold visitor resolution;
- bounded material/HDRI supply;
- license/redistribution evidence.

Use the completed Pascal harvest only as supplemental evidence for the principle that one semantic item can have derived 2D and 3D representations and for Plan-eligibility/fixture ideas. Do not adopt Pascal's generic node registry or per-instance proxy ownership.

**Output:** update the P24A annex from `seed — evidence pending` only when its concrete readiness questions are closed. Do not expand the 32-object acquisition backlog into a ship gate.

### R1 evidence — 2026-09-09 dry-run (branch `p24-reconciliation-evidence`)

- Pinned `@gltf-transform/cli 4.4.1` + embedded validator on `assets-source/models/grand-piano.glb`: validates clean (0 errors, 1 unused-`TEXCOORD_0` info); source bbox uncentered and centimetre-scale, confirming per-asset fudge factors (`defaultScale: 0.032`) instead of baked metres.
- Production `/museum/models/piano/grand-piano.glb` still centimetre-scale (grounded `minY ≈ 0`, `±23 × ±39` XZ) — pivot grounding done ad hoc, unit normalization not baked.
- `generated-obb` spike: `apps/editor/assets-source/plan-proxy/footprint-generator.ts` (pure, dependency-free, disposable pipeline-side evidence — not editor runtime) + 7 unit tests; recovers the hand-authored piano 1.48 × 1.59 box from its outline points, reports canonical X/Z bounds for rotated outlines, rejects non-finite input, and passes the existing `validateAssetFootprint` gate. Not wired to runtime.
- Open before the annex leaves seed: structured provenance/rights gate, deterministic CLI job (hash-in/hash-out + recipe pinning), `gltfpack` KEEP/REJECT measurement, Kenney/SH3F oracle harness, `kind: 'model'` registry + P22 pinning decision, bounded material/HDRI bytes.

Annex stays `seed — evidence pending`.

## R2 — P24B B0 capability-maturity baseline

Audit current Stage capabilities end-to-end before deciding depth.

Required matrix:

| Capability | Current Museum behavior | Canonical owner | Proven gap | Evidence needed? | Disposition |
|---|---|---|---|---|---|
| Selection / multi-select | room-scoped ordered multi-select (pre-F0) | canonical ordered selection semantics | Room gating is not a future invariant; cross-view continuity open | code for baseline; R4 owns continuity evidence | KEEP selection identity/order; POST-F0 RECHECK room-gate removal + continuity |
| Transform / pivot | one host, bounds-center pivot, world-space; scalar `scale?: number` persisted, per-axis session-only/lossy | single transform authority | no Local/World switch; no authored pivot options | code for baseline; bounded refs in R5 only if an unresolved maturity question remains | KEEP authority; DEPTH DECISION → R5 (Local/World, Selection-Center, scale, snap feedback) |
| Duplicate | clones selection +0.5 XZ, one history entry | existing mutator/history | no collision/bounds/re-ground; partial clusters silently skipped | code for baseline; R5 decides depth | KEEP mechanism; DEPTH DECISION → R5 |
| Groups / clusters | flat same-room cluster with required `roomId` (pre-F0) | flat non-nested grouping concept | Room ownership scheduled to disappear; no group pivot/Inspector | code for baseline; R5 decides UX depth | KEEP flat concept; do not preserve Room ownership; POST-F0 RECHECK before R5 |
| Plan Scene staging | derived footprints, Y discarded, lights skipped | Scene entity + derived Plan projection | no height/support/stacked choice; eligibility implicit | code for baseline; R3 owns contract | KEEP derivation; contract per R3 |
| Placement / grounding | tagged-floor-only, 5-ray, Drop/Keep-on-Floor, `GROUND_EPSILON` no-op guard | existing placement pipeline | single-surface only; no wall/ceiling/surface arming | code for baseline; later tracks decide depth | KEEP pipeline; DEPTH DECISION → later tracks, no persistent links |
| Asset-library placement entry points | click-to-place 3D only; model Place via Inspector; no Plan entry, no drag | existing asset picker → placement pipeline | entry-point gaps only | code for baseline | POLISH entries; no new framework |
| Snapping / guides | room-local steps, Shift-bypass; grid visual-only | existing Scene/Plan seams | no align/distribute; no guides/collision feedback | code for baseline; bounded refs in R5 only if open | KEEP seams; DEPTH DECISION → R5; REJECT generic framework |
| Materials | 6-entry catalogue, single-select, roughness/metalness + one map override | current Scene material model | no tint/PBR-set/scale UI; no multi-apply; no P24A import path | code for baseline; bounded refs in R6 only if open | KEEP model; DEPTH DECISION → R6 |
| Lights | point/spot/directional, 2.5m drop, 0.12m proxy, fixed -Z aim | `SceneLightEntity` authority | no handles; no cone/range viz; no presets | code for baseline; bounded refs in R7 only if open | KEEP authority; DEPTH DECISION → R7; REJECT second gizmo |
| Environment | fixed ambient + directional rig, no authored env (missing/partial confirmed) | renderer/Scene seams | exposure/tonemap/IBL/HDRI absent (greenfield) | code for baseline; bounded refs in R7 only if open | DEPTH DECISION → R7 with renderer ownership + visitor parity |
| Outliner / Inspector | single-select panels; multi has Duplicate/Delete + prefs only | existing editor surfaces | no bulk transform/material edit; commit-only sync by design | code for baseline | POLISH bulk + sync |
| History integration | single stack, 1-gesture-1-entry, `documentsMatch` no-op guard | canonical history | cross-view fixture pins missing | code only | KEEP; fixtures per R3/R4 |
| Editor-only vs visitor + asset-resolution boundary | zero editor imports in `apps/museum`; P20/P22 texture-only; models shipped-catalogue | P20 registry / P22 resolver / visitor isolation | GLB ingest absent (confirmed P24A.4 gap) | code only | KEEP boundary; P24A extends registry |

R2 answers what exists and where the gap is. Exact ship scope is decided in R5/R6/R7 and frozen only in R9/B6.

Do not create a generic Stage command framework merely to organize this matrix.

## R3 — B2 shared Plan / 3D placement contract

Front-load B2 because the cross-view direction is already ratified and the Pascal harvest now closes the main external evidence question.

Freeze the semantic contract for:

```text
Asset Library
├─ Scene → Plan placement
└─ Scene → 3D placement
        ↓
same canonical target Scene entity
```

Required decisions:

- one placement operation/result identity across views;
- Plan authors supported X/Z/yaw only;
- new Plan placement: X/Z/yaw are direct Plan-authored components; Y is semantically resolved from the chosen floor/support elevation + asset grounding/contact offset;
- existing placement edited in Plan: preserve Y/elevation, pitch, roll and scale unless the explicit operation owns one of those components;
- ambiguous stacked/support surfaces require a choice;
- Plan-ineligible assets remain selectable but do not expose misleading manipulation;
- replacement preserves intended placement through normalized asset metadata;
- one completed placement gesture produces one history result; cancel/no-op produces none;
- no persistent Layout/Scene support dependency is introduced without a separately specified ownership/delete/history contract (umbrella invariant: `LayoutDocument`/`SceneDocument` stay separate, P24 placement consults Layout geometry as transient calculation by default; addendum target: `LayoutObjects` vs `SceneEntity`).

Pascal evidence to reuse here is fixture-level only: same-ID Plan/3D mutation, derived renderer, transient preview patterns, and negative counterexamples around fresh IDs, pitch/roll reset and clamping.

**Ratified constraint (2026-09-09 reconciliation):** the decisions above constrain any P24 capability that participates in shared Plan/3D authoring. They do not by themselves require that capability to enter the P24 minimum. R9/B6 decides minimum inclusion. Placement consults Layout geometry as transient calculation by default.

## R4 — B5 cross-view interaction contract, then defer polish freeze

Freeze the **behavioral** B5 contract early:

- committed canonical selection survives Plan ↔ 3D switching;
- a Plan-ineligible selected entity stays selected while losing unsupported handles;
- unfinished placement/transform cancels on view switch with no history result;
- view switching never silently commits;
- PlanProxy/ghost presentation is derived editor state;
- final displayed preview and committed result agree.

Do not freeze the full B5 presentation/polish scope yet. Final visual density, affordances and staging polish should close only after B1–B4 determine what tools actually ship. R4 is the behavioral constraint set; R8 holds the remaining presentation/polish. Only R9/B6 freezes minimum inclusion.

Pascal's mounted-pane behavior is a **negative reference** here: its view switch does not provide Museum's required cancel semantics.

**Ratified constraint (2026-09-09 reconciliation):** the six behaviors above constrain any P24 capability that participates in cross-view interaction. They do not by themselves require that capability to enter the P24 minimum. R9/B6 decides minimum inclusion. Presentation/polish remainder stays in R8.

## R5 — B1 transform + arrangement maturity

Reconcile only proven gaps in the existing transform/arrangement system:

- Local/World gizmo orientation if justified, without changing storage ownership;
- primary/active selection clarity;
- bounded pivot options;
- numeric Inspector ↔ gizmo synchronization;
- snapping/guides feedback;
- alignment/distribute/equal-spacing;
- duplicate productivity;
- group/cluster UX;
- Outliner density/selection coherence;
- cancellation/no-op/history behavior.

Use Pascal only where its completed harvest already provides useful counter-fixtures or lifecycle evidence. Use other mature references only for unresolved concrete questions.

### R5 candidate hypothesis — 2026-09-09 (NOT frozen; depth decision requires the bounded evidence below, frozen only in R9)

Evidence basis: one-host authority + bounds-center pivot + room-local/world conversion (`gizmo/scene-gizmo-adapter.svelte.ts`, `editor-cluster-transform.ts`); v6 scalar-scale loss (`editor-transform.ts`); Pascal lifecycle/counter-fixtures (completed harvest). No new direct-reference study needed unless a concrete interaction question survives the post-F0 recheck.

- Local/World gizmo orientation: ADOPT as orientation-only switch, storage unchanged; default stays World (current behavior).
- Selection-Center pivot alongside Active-Object bounds-center: ADOPT if post-F0 world frame keeps pivot math rigid; no new stored pivot.
- Primary/active selection clarity + numeric Inspector ↔ gizmo sync: POLISH.
- Snap winner feedback: POLISH; no new snap framework.
- Align/distribute/equal-spacing as deterministic Scene ops (one history result each); exact op set frozen in R9.
- Duplicate-then-move: ADOPT with collision/re-ground check (closes the R2 gap).
- Cluster UX without nesting; Room-gate removal rechecked post-F0.
- No second gizmo or transform authority.

## R6 — B3 material maturity

Audit the existing material definition/instance path first. Decide the minimum for:

- discovery/presets;
- shared vs unique semantics;
- base color/tint;
- PBR map support;
- texture scale/physical sizing;
- multi-selection workflows;
- imported P24A materials;
- editor/visitor parity.

Do not replace the existing material model merely because a reference editor has a richer panel.

### R6 candidate hypothesis — 2026-09-09 (NOT frozen; depth decision requires the bounded evidence below, frozen only in R9)

Evidence basis: 6-entry catalogue + `SceneMaterialInstance` shared/unique + Make Unique flow (`content/materials.ts`, `material-resource-mutator.svelte.ts`, `resolveSceneMaterial`); single-select-only Inspector; P24A import path still absent (R1). No new direct-reference study needed unless a concrete authoring-semantics question survives the post-F0 recheck.

- Keep the `MaterialDefinition` / `SceneMaterialInstance` shared-vs-unique model; no slot/UV/graph scope.
- Minimum: base color/tint override, PBR map set on definitions, physical tile scale where the existing repeat path supports it, Apply-to-multiselection, shared/unique preview feedback, P24A import consumption.
- Editor/visitor parity required per material addition.

## R7 — B4 lighting + environment maturity

Audit current Scene lights and renderer/environment seams. Decide the minimum for:

- core authored light types/properties;
- selection/pick proxies and 3D handles;
- Inspector synchronization;
- useful lighting/environment preset(s);
- HDRI/environment consumption from P24A;
- exposure/environment semantics only where the current renderer can own them cleanly;
- visitor parity and editor-only helper isolation.

### R7 candidate hypothesis — 2026-09-09 (NOT frozen; depth decision requires the bounded evidence below, frozen only in R9)

Evidence basis: `SceneLightEntity` point/spot/directional + fixed -Z aim + 0.12m proxy (`editor-lights.ts`, `EntityLight.svelte`); fixed ambient+directional rig with no authored environment (`MuseumScene.svelte` both apps); P24A HDRI supply still absent (R1). No new direct-reference study needed unless a concrete lighting-interaction question survives the post-F0 recheck.

- Keep `SceneLightEntity` point/spot/directional authority; no second light-gizmo system — handles compose with the existing TransformControls.
- Minimum: range visualization (point), cone/direction handles (spot), pick proxies, degree-presented spot angle (canonical storage unchanged), one gallery preset as ordinary Scene ops (no persistent rig), HDRI consumption only after P24A supply exists.
- Exposure/tonemap/IBL only where the renderer owns them + visitor parity; shadow policy stays system-owned (safe defaults + warnings, no per-light map controls in the minimum).
- Units: raw renderer-relative numbers stand unless new evidence shows authoring harm; color temperature deferred to follow-up.

## R8 — B5 final presentation reconciliation

After B1–B4 scope is known, close the bounded Stage UX pass:

- Plan/3D ghost/proxy treatment;
- manipulation affordance consistency;
- selected-but-ineligible treatment;
- Inspector/Outliner synchronization;
- staging feedback and warnings;
- visual density/readability;
- cross-view discoverability.

Presentation remains derived editor state. Do not persist handles, helper geometry or UI-only state into authored documents.

## R9 — B6 minimum freeze / child-plan gate

Only after R0–R8 have enough evidence:

1. freeze the **minimum useful P24A + P24B capability set**;
2. separate optional depth tails from ship gates;
3. record the final capability maturity matrix;
4. define deterministic operation/history ownership for every included capability;
5. define Plan/3D acceptance where both views participate;
6. define Save/Load + P22 visitor acceptance;
7. run a targeted post-P23-F0 seam recheck for every item R0 marked `requires post-F0 recheck`;
8. then update/write implementation-ready P24 child plans and request owner review.

No implementation-ready P24B brief is created before this gate closes.

## Required acceptance themes for the eventual P24 minimum

Start from Pascal harvest §7 candidate fixtures 1–6 (same-ID Plan/3D mutation with Y/pitch/roll/scale preservation; Plan-ineligible-but-selected; view-switch cancel with no history; preview/state consistency; preview/commit agreement; one-handle-drag-one-history with failure/no-op safety) and rewrite each as a Museum-owned fixture; do not port Pascal machinery.

The final minimum should prove, for the capabilities actually selected:

- one canonical Scene entity identity across Plan and 3D;
- selection continuity across views;
- Plan preserves transform components outside its authority;
- explicit support/floor placement height;
- cancel/no-op has no history result;
- one completed gesture has one deterministic history result;
- PlanProxy/3D representation derive from canonical asset/entity state rather than competing persisted truth;
- Save/Load preserves authored state;
- cold visitor runtime renders the same canonical Scene meaning without editor-only state;
- LayoutDocument/SceneDocument ownership remains separate;
- no second navigation/camera-motion system appears.

## Exit condition

This reconciliation is complete when P24 can answer, with current-code evidence:

> What is the smallest useful Stage capability set worth implementing after P23, which existing Museum systems remain authoritative, exactly what must deepen, and which external patterns are useful only as fixtures or study material?

At that point P24 may move from umbrella/research reconciliation toward implementation-ready child plans. Until then, capability lists remain hypotheses rather than tickets.
