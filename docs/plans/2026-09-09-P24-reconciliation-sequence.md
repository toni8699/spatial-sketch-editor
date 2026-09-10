# P24 — reconciliation sequence

**Date:** 2026-09-09  
**Status:** umbrella-internal reconciliation plan — evidence/planning only, not implementation-ready  
**Parent:** [P24 — Scene / Staging Depth umbrella](2026-09-08-P24-scene-staging-depth-umbrella.md)  
**Cross-view authority:** [Unified Plan / 3D authoring addendum](2026-09-09-P23-P24-unified-plan-3d-authoring-addendum.md)  
**Pascal evidence:** [`Pascal-editor-harvest.md`](../Deep-research/P24-3D-assets-staging/Pascal-editor-harvest.md) — CLOSED at pinned revision `32c3c8a24dae17c55beaabf45029148900a3b409`  
**Three evidence:** [Three r175–r186 harvest](../Deep-research/P24-3D-assets-staging/three-r175-r186-museum-harvest.md) — source audit complete; adoption and runtime acceptance remain conditional.  
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

P24 implementation still depends on the accepted P23 minimum useful Build set. Any P24 decision touching coordinates, placement ownership, selection routing, Plan projection or Scene/Camera migration must consume the coordinate/ownership model accepted through P23, not assume the earlier Room-local baseline remains permanent.

P23.0a → P23.8 → P23.0b implementation has landed, including world-local compatibility/cutover code. P23 F0 closed on 2026-09-10. The R0 post-F0 delta refresh below is complete; selected P24 placement, selection, support-query and capability-specific asset/runtime seams still carry explicit R9 rechecks before the minimum can freeze.

## Authority and evidence order

Read in this order:

1. [P24 umbrella](2026-09-08-P24-scene-staging-depth-umbrella.md);
2. [Unified Plan / 3D addendum](2026-09-09-P23-P24-unified-plan-3d-authoring-addendum.md);
3. [P24A annex](2026-09-08-P24A-asset-supply-canonical-ingest-annex.md);
4. current Museum Editor code and tests for the capability being reconciled;
5. checked-in Phase 2 / Phase 4 research — durable inputs are `../Deep-research/P24-3D-assets-staging/deep-research-exact-asset-compact.md` + `museum-editor-phase2-acquisition-manifest.json` (Phase 2) and `../Deep-research/P24-3D-assets-staging/deep-research-P24-3D-editing-compact.md` (Phase 4). The legacy `museum-editor-phase2-exact-asset-harvest-P24.md` path is absent on disk; the umbrella and P24A annex now use the compact artifact as the durable Phase 2 source. The Phase 4 full source remains absent per the umbrella;
6. completed [Pascal harvest](../Deep-research/P24-3D-assets-staging/Pascal-editor-harvest.md) and [Three r175–r186 harvest](../Deep-research/P24-3D-assets-staging/three-r175-r186-museum-harvest.md) where relevant;
7. additional direct reference inspection only where a concrete unresolved maturity question remains.

Museum contracts remain authority. External references are evidence only.

The Three harvest closes source-capability questions, not runtime compatibility,
performance or R9 inclusion. Translate ADOPT to candidate KEEP/POLISH/DEEPEN
implementation choices for selected capabilities; BENCHMARK/SPIKE remains optional
evidence work; FOLLOW-UP/REJECT stays outside the minimum. **Exception: harvest
finding 06 (`Object3D.dispose()`) is downgraded from ADOPT to conditional
implementation recheck** because of Threlte disposal interaction and the relevant
post-r186 point-shadow disposal fix (`02198fbc4b`, #34522). Preserve scoped caches,
reference counts, clone ownership and asynchronous cancellation; do not infer
recursive resource disposal or delete ownership logic. The Three version is a
conditional dependency baseline selected at implementation freeze, not a pin to r186.

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

### R0 result — 2026-09-09 audit (historical)

R0 audit baseline:
remote parent: `e030038fa3708f578baf97a6bc4f8b6c77b5f689`
local Museum commit: `f0f1f6380a26a535bf3c50b37404fd1ff0bca42e`
P23 F0 scaffolding: uncommitted dirty tree at audit time (no F0 commit to pin).

At that audit baseline, F0 scaffolding decoded nothing wall-first and authoring
remained Room-owned/Room-local. The table below is historical evidence, not a claim
about today's implementation.

**Superseded qualification (2026-09-09):** the first audit ran before F0 acceptance and writer enablement. Its observations remain useful only as the pre-F0 delta baseline. Do not use its required-room assumptions or `requires post-F0 recheck` labels as current conclusions; the 2026-09-10 refresh below supersedes them.

| Seam | Historical class |
|---|---|
| Scene transform storage + world conversion (`packages/project-model/src/scene.ts`) | changes in F0 / required post-F0 recheck (world-local migration was P23.0b) |
| Plan footprint/proxy (`plan-scene-footprint.ts`) | logic stable / required recheck (`rooms` source changed under F0) |
| Plan translate/rotate adapters (`plan-scene-transform.ts`) | stable / required recheck (world-local identity-frame behavior not yet accepted) |
| Placement + floor assumptions (`editor-placement.ts`, `placement-cluster-mutator.svelte.ts`) | stable / required recheck (no stacked/support choice, no Layout-query lookup) |
| Selection identity (`selection-store.svelte.ts`) | stable / required R4 continuity recheck |
| History/gesture (`history-controller.svelte.ts`) | stable / required operation-owner recheck |
| Camera records in Scene | changes in F0 where touching shared resolver; pure tour routing irrelevant |
| Layout/Scene ownership boundary | changes in F0 (Layout side) / required recheck — no persistent support dep without contract |
| `compileLayoutGeometry()` / query / editor-adapter | changes in F0 / required recheck — support resolution source |
| Save/Load + P22 visitor | required recheck after world migration; package export versioning remained a separate seam |

### R0 post-F0 delta refresh — 2026-09-10

**Accepted baseline:** P23 Foundation Gate F0 is closed on `main` through PR #7 (`32b2e8f`), including the stage-6 wall-first writer flip (`455f587`), cross-format transaction-invariant restoration (`93111a2`), and final proof tightening (`79b3551`). Earlier F0 stages established the shared compatible Preview/visitor runtime (`2c9b04d`) and the no-second-transform / standalone Scene import proofs (`0d66aed`).

F0 closes the coordinate-meaning ambiguity. Canonical new Scene state is now **project/world-space** with `formatVersion: 1`; entities, clusters, navigation nodes, path anchors/waypoints and view keyframes must not carry `roomId`. Legacy room-local Scene remains an explicit compatibility input only. Successful legacy migration resolves physical values exactly once through the trusted legacy Room registry, removes `roomId`, and writes world-local meaning. A wall-first Layout paired with a legacy room-local Scene is rejected when the source Room frames are no longer available; the runtime never guesses them.

The refresh also exposes a narrower truth than “F0 made Stage world-local”: the canonical project/runtime model is world-local, but several live **editor authoring** paths still carry legacy Room context. P24 must not freeze those paths as future semantics.

| Seam | F0 delta / live code | Post-F0 status | Later P24 recheck |
|---|---|---|---|
| Scene transform storage + world conversion (`scene.ts`, `scene-format.ts`, `scene-world-conversion.ts`, `project-compat.ts`) | `formatVersion: 1` explicitly identifies project/world Scene; canonical world-local records forbid `roomId`; legacy conversion resolves position/target and full rotation once against trusted legacy frames, then strips room ownership | **STABLE F0 contract** | No semantic redecision. Keep legacy compatibility branch while old inputs remain supported; stale room-local comments may be cleaned separately |
| `LayoutDocument` / `SceneDocument` ownership boundary | F0 changes Layout's canonical generation to wall-first and Scene coordinates to project/world; it does **not** merge document ownership. Layout structure stays Layout-owned; staged models/primitives/lights/materials/cameras stay Scene-owned | **STABLE ownership** | Support/floor lookup stays a transient Layout-geometry calculation by default. Any future persistent support reference needs its own ownership/delete/history contract |
| Room resolver / coordinate adapter (`project-layout-semantics.ts`) | `pointInFrame` / `localPointInFrame` resolve a present legacy `roomId`; absent `roomId` is identity. Wall-first/world-local runtime uses an empty registry whose undefined-frame helpers are identity and whose named-room lookups fail closed | **STABLE compatibility seam** | Do not remove inverse/frame adapters merely because canonical Scene is world-local; legacy-compatible input still needs them |
| Scene Plan footprint/proxy (`plan-scene-footprint.ts`) | Projection accepts optional legacy `roomId`; world-local entities pass through identity frame after scale/yaw/translation. Y still drops only at Plan projection; lights remain non-footprinted | **STABLE projection math** | R3/R4 acceptance still must pin same-ID Plan/3D continuity, Plan eligibility and preservation of Y/pitch/roll/scale on canonical world-local entities |
| Plan Scene translate/rotate (`plan-scene-transform.ts`) | Baselines carry optional `roomId`; world pivot and inverse write use identity frame for world-local Scene, legacy frame conversion for compatibility input | **STABLE adapter math** | Recheck only integration/fixtures when P24 shared placement uses canonical world-local Scene. “Remove inverse-resolve” is no longer a requirement |
| Scene placement / grounding (`editor-placement.ts`, `placement-cluster-mutator.svelte.ts`) | Grounding remains rendered tagged-floor / 5-ray based and does not consume compiled Layout query geometry. More importantly, placement creation still accepts/writes `roomId`, and selectability still depends on selected Room context | **NOT CLOSED for canonical world-local authoring** | Before a P24 child freeze: decouple canonical placement/selectability from Room ownership; resolve floor/support Y from an explicit surface source; decide stacked-surface choice; keep persistent cross-document support links out unless separately designed; recheck duplicate re-ground |
| Selection identity / cross-view selection (`selection-store.svelte.ts`, `editor-types.ts`, `selection-actions.svelte.ts`) | Entity IDs and the existing workspace/navigation reducer remain canonical. Selection actions contain a world-local branch, but `WorkspaceSelection` still requires `roomId` and the placement selectability host remains Room-gated | **IDENTITY STABLE; ROOM CONTEXT NOT CLOSED** | Remove Room ownership as a requirement for world-local Scene selection without creating a second selection store; pin R4 Plan↔3D continuity and Plan-ineligible-selected behavior |
| Scene history / gesture lifecycle (`history-controller.svelte.ts`, format policy) | One chronological stack still tags `scene` vs `layout`; one Scene transaction validates/commits one document result, no-op commits none. F0 adds fail-closed format dispatch and cross-format transaction invariants rather than a new history model | **STABLE history architecture** | R9 still names operation owner/history behavior for each selected P24 op. No mixed Layout/Scene transaction or hidden support-side write without an explicit atomic contract |
| Layout compiler + query geometry (`layout-geometry.ts`, `layout-geometry-types.ts`, `plan-hit.ts`) | Legacy and wall-first compiler entries converge through the shared compiler core. `CompiledLayoutGeometry.queries` remains the render-neutral point/span/polygon/AABB query contract; wall-first physical-wall identity comes from canonical wall-first inputs | **STABLE compiler/query core** | P24 support placement must consume this seam rather than create another geometry/query system. Recheck exact floor/wall/support metadata needed by selected placement operations because current Stage placement does not use it yet |
| Camera records inside Scene | Nodes, path anchors/waypoints and view keyframes participate in the same one-time world-local conversion; runtime graph builds after compatible preparation | **STABLE for P24** | Pure topology/Sequence/motion stays outside P24. Do not introduce a second route or motion system; only recheck if a selected P24 capability directly touches shared Scene persistence |
| Canonical project writer / compatible decode (`wall-first-project.ts`, `project-compat.ts`) | F0 now has a canonical wall-first + world-local project writer and explicit compatible decode/migration matrix | **STABLE library boundary** | P24 persistence must use this meaning; no fallback to guessed Room frames |
| Live editor cloud Save/Load (`EditorApp.svelte`, `project-codec.ts`) | At the R0 audit baseline, live `captureValidatedSaveSnapshot()` and `loadProject()` called `validateProject` while that strict codec did not yet accept wall-first Layout | **SUPERSEDED BY P23.1** | P23.1 widened the shared codec to accept explicit wall-first Layout + world-local Scene; live Save/Load already uses that shared codec. Basic format persistence is no longer a P24A blocker; real capability round-trip acceptance remains required |
| Preview + P22 cold visitor (`compat-runtime.ts`, `preview-coordinator.ts`, `visitor-cold-runtime.ts`) | Both now open through shared `prepareCompatibleRuntime()`: decode compatibly, compile through the single shared geometry core, resolve legacy frames at most once, then operate on one runtime/world representation. F0 parity tests pin wall-first Preview/cold-visitor equality | **STABLE coordinate/runtime seam** | Only capability-specific P24 parity remains: model registry/retention, added materials/lights/environment and asset resolution if selected. No coordinate migration re-open |
| Visitor/editor isolation | Shared compatibility work lives in visitor-safe project/runtime packages; Preview and cold visitor consume canonical data/runtime meaning rather than editor selection/history/gizmo/session state | **STABLE boundary** | P24 helpers, proxies, selection, gizmos and acquisition UI remain editor-only; verify new selected capabilities do not leak them into cold visitor bundles |

**R0 conclusion:** F0 has stabilized the canonical coordinate model, Layout/Scene ownership, shared compiler/query core, Plan transform/projection math, history architecture, and Preview/cold-visitor coordinate/runtime preparation. P23.1 subsequently closed the basic strict-codec wall-first/world-local Save/Load format-acceptance gap. The remaining post-F0 blockers are narrower and concrete:

1. **Stage authoring Room coupling:** placement/selectability and workspace-selection context still assume Room ownership even though canonical world-local Scene forbids `roomId`.
2. **Support/surface integration:** the compiled Layout query core is stable, but current Scene grounding/placement still uses rendered tagged floors and has no explicit stacked/support resolver.
3. **Capability-specific asset/runtime parity:** P24A static-model source authority and any selected material/light/environment additions still need real Save/Load + cold-visitor acceptance, without reopening the now-stable coordinate runtime.

These are R9 inputs, not authorization to implement them in R0. R2/R5–R8 remain dated pre-F0 evidence where labeled; when they conflict with this refresh or the P23.1 addendum above, the newer evidence wins.

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

### R1 evidence — 2026-09-09 dry-run + finish pass (branch `p24-reconciliation-evidence`)

Closed now (pipeline-side evidence, no runtime changes):

- Deterministic normalization job: `apps/editor/assets-source/pipeline/normalize-asset.sh` wraps `@gltf-transform/cli` (version asserted at run, mismatch fails) with hash-in/hash-out + validation + metrics + provenance JSON (`toolVersionActual`, `recipe furniture-floor v1` + recipe hash, `sourceUnitPolicy: recorded-not-baked` + explicit `unitScaleToMeters`). All files stage in a same-filesystem temp sibling dir and install via rename-with-rollback (previous good output restored if replacement fails) — failed runs never lose a good destination. Piano fixture: reruns → identical content `c8669154…b60b` from source `09627e34…6778` (matches the recorded license evidence); 1,180,076 → 1,164,508 bytes, grounded bbox, cm-scale recorded not rescaled. Covered by `normalize-asset.test.ts` (determinism + rejection + failure atomicity; skips where the toolchain is absent).
- Rights gate: `assets-source/pipeline/provenance.ts` (`classifyRights` A/B/C/D + `gateApproved`; unknown never Approved — derivatives and acquisition date included, since the pipeline itself creates derivatives) + 8 tests.
- `generated-obb`: recovers the piano 1.48 × 1.59 box, reports canonical X/Z bounds for rotated outlines, rejects non-finite input, ~50ms on a 100k-point cloud; round + thin-leg oracle archetypes benchmarked (real Kenney/SH3F corpus acquisition is P24A.3 execution, not readiness).
- Proof set frozen (12, from the manifest — rest is backlog): Poly `ArmChair_01`, `round_wooden_table_01`, `Shelf_01`, `painted_wooden_table`, `folding_wooden_stool`; Kenney `chair`, `loungeDesignChair`, `table`, `cabinetBedDrawer`; SH3D `Mid-century-chair`, `Cafe-table`, `Futon-couch` (attribution-survival proof). Covers round + irregular, top-down oracle, planIcon, OBB + silhouette, CC0 + CC-BY-3.0.
- Supply pointers (no new survey): 42 material rows + 9 HDRI rows in `museum-editor-phase2-acquisition-manifest.json`, all CC0 with source URLs; bytes acquired at P24A.3+ execution.
- Registry decision: Wave-1 remains static-only through the append-only shipped-static compatibility path first. Dynamic project/upload/provider GLB support through P20/R2 + P22 release pinning is a deferred depth path, not the P24A minimum. The remaining static runtime gap is narrower: visitor model loading must take its production source from shipped-static authority rather than validating there and then resolving from the mutable live catalogue.
- `gltfpack` disposition: **DEFER** — Meshopt decode already runs at runtime (`useMeshopt`); encode-side size wins are unmeasured and unnecessary for the minimum. Revisit as **BENCHMARK FIRST during P24A.3** if derivative sizes demand it. `meshoptimizer` stays transitively available; no new dependency.

### R1 post-F0 closeout — 2026-09-10

**R1 COMPLETE.** The P24A annex advances to `evidence complete — reconciliation pending`; R9 still owns minimum freeze and implementation-ready child-plan creation.

Closed architecture/readiness decisions:

- `SceneModelEntity.assetId` remains the authored model identity; PlanProxy/`AssetFootprint` remains asset-definition metadata, never a second per-placement record;
- canonical world-local Plan projection already uses the identity frame when `roomId` is absent; legacy Room transforms remain compatibility-only;
- the `furniture-floor` normalization recipe establishes a zero floor-contact offset for that normalized recipe only; broader wall/ceiling/stacked support metadata is not inferred;
- static-first is the P24A minimum: accepted Wave-1 GLBs use stable shipped-static identities + retention; generic project/upload/provider GLB ingestion is deferred unless R9 explicitly promotes it;
- P23.1 closes basic wall-first/world-local project format acceptance in the shared codec used by live cloud Save/Load; no model-specific serializer or separate P24A persistence system is needed;
- future dynamic models, if later selected, must extend the existing P20/R2 + P22 release path with model kind/MIME/validation/hash-pinning rather than create a parallel registry;
- normalization, rights gate, proof-set selection, material/HDRI supply pointers and `gltfpack` benchmark-first disposition remain accepted from the dry run.

Remaining implementation/reconciliation blockers before implementation-ready P24A children freeze:

1. shared Stage placement/selectability must stop requiring legacy Room ownership for canonical world-local Scene entities;
2. cold static-model rendering must resolve the production source from shipped-static compatibility authority rather than the mutable live catalogue;
3. selected floor/support placement still needs the shared Layout-query Y/ambiguity contract; normalized floor pivot metadata does not replace support resolution;
4. P24A.3–P24A.6 execution must run the frozen corpus and bounded material/HDRI supply through real Save/Load + cold-visitor acceptance.

No broad research remains for R1. Dynamic uploaded/provider GLB support does **not** block the static-first P24A minimum.

### Three conformance additions — conditional on the selected runtime/corpus

Retain glTF Transform normalization and the existing Meshopt runtime seam. Define
conformance fixtures for formats/extensions actually accepted by the selected
runtime: EXT/KHR Meshopt as applicable, rotated texture transforms and imported
instancing where present in the proof corpus. KHR Meshopt requires a compatible
baseline. Draco/KTX2, broader HDR formats, simplification and LOD remain
benchmark-first additions, not mandatory supply formats. Record deployed
decoder/transcoder resources and publication retention/resolution of every accepted
asset dependency; acquisition URLs must not become runtime dependencies.

Keep static-first Wave 1 and the benchmark-first gltfpack disposition. This does
not force uploaded-model support into Wave 1, replace the normalization/rights
pipeline or turn every harvest loader into a required fixture.

## R2 — P24B B0 capability-maturity baseline

Audit current Stage capabilities end-to-end before deciding depth.

Dated pre-F0 baseline matrix (coordinate/room observations require the current-state qualification in R0 and a post-F0 refresh):

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
| Environment | fixed ambient + directional rig; Threlte AgX + sRGB; no authored exposure/HDRI/IBL state | Scene intent + renderer resources | asset resolution, semantic mapping, lifecycle and parity remain; native Three environment/PMREM primitives exist | Three harvest + R7 | Global architecture ratified conditionally; minimum inclusion R9, schema/runtime gate still open |
| Outliner / Inspector | single-select panels; multi has Duplicate/Delete + prefs only | existing editor surfaces | no bulk transform/material edit; commit-only sync by design | code for baseline | POLISH bulk + sync |
| History integration | single stack, 1-gesture-1-entry, `documentsMatch` no-op guard | canonical history | cross-view fixture pins missing | code only | KEEP; fixtures per R3/R4 |
| Editor-only vs visitor + asset-resolution boundary | zero editor imports in `apps/museum`; P20 project bytes remain image/procedural-only; built-in models use shipped-static compatibility | P20 registry / P22 resolver / visitor isolation | cold static-model loading still resolves its URL through live catalogue; dynamic GLB ingest absent | code only | KEEP boundary; DEEPEN shipped-static model source authority; dynamic project GLB FOLLOW-UP |

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

- Local/World gizmo orientation: WIRE the existing toolbar switch (`EditorViewportToolbar` Local/World → `interactionStore.toggleSpace`) through to the scene gizmo policy, orientation-only, storage unchanged; default stays World. The switch UI exists but the scene/camera gizmo policies currently hardcode world with no reader of `interactionStore.space`. Single-selection Local uses the selected object's orientation; the multi-selection Local frame (primary-object orientation vs another derived frame) must be resolved before R9 — do not create stored pivot/orientation state.
- Selection-Center pivot alongside Active-Object bounds-center: ADOPT if post-F0 world frame keeps pivot math rigid; no new stored pivot.
- Primary/active selection clarity + numeric Inspector ↔ gizmo sync: POLISH.
- Snap winner feedback: POLISH; no new snap framework.
- Align/distribute/equal-spacing as deterministic Scene ops (one history result each); exact op set frozen in R9.
- Duplicate-then-move: ADOPT with collision/re-ground check (closes the R2 gap).
- Cluster UX without nesting; Room-gate removal rechecked post-F0.
- No second gizmo or transform authority.

Code-verified on main: one-host authority + bounds-center pivot (`editor-cluster-transform.ts:15-32`, `scene-gizmo-adapter.svelte.ts:162-164`); v6 scalar scale, per-axis session-only (`editor-transform.ts:24-41`); duplicate +0.5 XZ, one history entry, no re-ground, partial clusters silently skipped (`placement-cluster-mutator.svelte.ts:639-669`); flat same-room clusters (`:486-508`); snap room-local + Shift-bypass, no winner feedback.

### Preferred implementation primitives — no independent minimum expansion

For already-selected capabilities, prefer public TransformControls `setColors`
and plane/rotation visibility APIs when supported by the baseline selected at
freeze. Replace private palette traversal where equivalent; preserve
`SCENE_PALETTE`, the host, adapters, cancellation, snapping and history.
`applyEditorGizmoSingleEnding`, multi-selection pivot math and gesture lifecycle
have no proven drop-in replacement. Native Object3D pivot remains an optional
implementation experiment, not a new authored pivot schema.

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
- Editor/visitor parity required per material addition, including roughness/metalness, mapped PBR, alpha and transmission fixtures as applicable. If the renderer baseline changes, review BRDF/PMREM differences separately from material retuning. No node-material graph, retroreflectivity UI or arbitrary GLB slot-editing expansion follows from the harvest.

Code-verified on main: 6-entry catalogue (`materials.ts:3-63`); shared/unique + Make Unique (`material-resource-mutator.svelte.ts:193-231`); single-select Inspector (`EditorMaterialInspector.svelte:19-24`); no tint override; roughness/metalness + one map override only; repeat path read-only (`materials.ts:79-86`, `defaultTileSizeMeters`); resolver copies currently byte-identical (`scene-instance-material.ts:65` editor + museum); parity remains an acceptance requirement.

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
- Candidate minimum, inclusion still R9: range visualization (point), cone/direction handles (spot), pick proxies, explicitly labeled degree-presented spot angle (canonical radians), one gallery preset as ordinary Scene ops (no persistent rig). HDRI/environment inclusion additionally requires P24A supply and runtime readiness.
- Per-light `castShadow` remains authored Scene state; shadow-map resolution/bias/quality policy remains renderer/system-owned with safe defaults and warnings. No per-light shadow-map tuning in the minimum. Environment intent and tone-mapping ownership follow the ratified boundary below.
- Units: preserve existing intensity values and direct renderer mapping; document actual units per light (point/spot: candela). Accurate labels do not require lumen conversion, a photometric authoring system or color temperature; those remain follow-up.
- Canonical spot angle is the renderer's half-angle in radians. Degree presentation must distinguish half-angle from full aperture. Current Inspector/mutator/codec validation accepts up to π; reconcile with Three's supported maximum half-angle of π/2, with explicit treatment of existing out-of-range values. Never silently reinterpret or clamp saved data; this is an existing mismatch, not an upgrade regression.
- Native light-helper geometry is a preferred implementation primitive for already-selected capabilities; it does not independently expand the minimum. Helpers remain editor-only, with handles using Museum's existing operations/gizmo/history. PointLightHelper is not a range volume; unlimited Spot lights need bounded editor presentation.

Code-verified on main: 3 light kinds, fixed -Z aim, 0.12m proxy (`EntityLight.svelte:17-54`); 2.5m drop (`editor-lights.ts:23`); radian-only angle UI (`EditorLightInspector.svelte:140-146`); fixed ambient+directional environment rig in both `MuseumScene.svelte` copies (authored `SceneLightEntity` lights render in addition). Refinements: per-light `castShadow` already exists (`editor-lights.ts:91`) — only map-level controls are absent; existing lighting presets are session viewport-only (`editor-store.svelte.ts:181-197`), not Scene ops.

### Ratified global environment architecture — inclusion remains R9

If authored environment enters the P24 minimum, its semantic model is global Scene-level intent: asset reference, lighting intensity, Y rotation, background mode and optionally authored exposure.

Native Scene environment/background controls and PMREM provide the rendering
primitives. Threlte already supplies AgX tone mapping and sRGB output; tone-mapping
choice stays system-owned, initially preserving AgX. Per-room environment blending
remains follow-up. This closes architecture, not minimum inclusion or schema.

Asset identity/bytes remain registry-owned, authored intent Scene-owned, and PMREM
or future GI caches renderer-derived. Exact schema, optional authored exposure,
asset resolution, lifecycle and Preview/Publish parity require joint reconciliation.
Object3D disposal remains the conditional implementation recheck above; scoped
caches/refcounts/async cancellation are not replaced.

A selected gallery preset must define interaction with the fixed ambient/directional
baseline and editor assist lighting, avoiding hidden extra lighting. Preserve legacy
appearance through an explicit compatibility policy. Presets create/update ordinary
authored Scene lights and any selected environment state, never a persistent rig.

## R8 — B5 final presentation reconciliation — EXECUTED pre-F0 (rules closed; minimum inclusion still R9)

### Decided presentation rules (code-verified on main)

- Derived ghost/proxy only: Plan footprints (`plan-scene-footprint.ts:53`, live `$derived` in `LayoutPlanViewport.svelte:234-250`), 3D placement ghosts (`placement-ghost.ts/svelte`, `userData.role='placement-ghost'`, `raycast=()=>null`, disposed never serialized), Plan overlays (`plan-overlays.ts:20-25` transient), and gizmo pivots/proxies (per-mount, disposed) are never written to the document; Scene schema + canonical serializer carry authored leaves only (`scene.ts:400-414`, `scene-codec/canonical.ts:137-228`). Restated invariant: no handle/helper/ghost/preview state persists.
- Selected-but-ineligible: entity stays selected, loses unsupported handles, with reason shown (`stagingSelectionMessage` + `role=status` warning in Plan viewport and Inspector badge `Plan transform/Read-only`; context-menu and delete routers carry the same reason). This extends the ratified R3/R4 constraints.
- Handle vocabulary: Plan stages X/Z/yaw only (adapters preserve Y/pitch/roll/scale; `plan-scene-transform.ts:56-124`); 3D keeps full translate/rotate/scale. Divergence is an intentional subset, not inconsistency.
- Preview/commit agreement: pending placement, Plan staging gestures (`previewSceneGesture`/`commitSceneGesture`/`cancelSceneGesture` with immutable baselines), and gizmo drags (transient preview, single-history commit, cancel rollback) all keep preview distinct from committed state. Final displayed preview and committed result must agree (R4).
- Inspector/Outliner sync: shared selection identity, commit-only numerics (`EditorNumberField` draft/commit/Escape), single-select panels; multi-select shows Duplicate/Delete + session placement only.
- Feedback baseline: no-floor-below, ineligible/cluster staging, geometry warnings (`role=alert`), and blocked deletes already surface with reasons. Density/readability treatment exists (group headers, filters, empty states, sectioned Inspector).
- Discoverability rule: disabling a control without a reason is a defect. Known uneven spots (toolbar `toolDisabled`, inert outliner rows) are polish backlog for the R9 inclusion decision, not new-framework work.
- Experience rule/event/reference diagnostics belong to P25 authoring test lenses (E5), not P24. Scene/asset integrity diagnostics are a separate optional R9 choice below; legacy `roomId` diagnostics wait for the post-F0 recheck.

### Fixed pre-F0: silent-skip → warn

Partial drop-to-floor (warns only when `groundedCount===0`), partial cluster duplicate (`continue` with no status), and selection-blocked Plan clicks (reason only in context-menu path) must produce a status/warning instead of failing silently. Footprint-builder skips for intentionally non-projected entities (lights) stay silent by design. Scene/asset integrity diagnostics (dangling `assetId`) are an R9 inclusion decision; legacy `roomId` diagnostics wait for the post-F0 recheck.

### Left for R9 (not F0-dependent)

Bulk transform/material multi-edit, Scene/asset integrity diagnostics surface, and the disabled-without-reason polish backlog: include in minimum or defer as depth tail.

## Pre-F0 R9 freeze packet — DRAFT (not a freeze; R9 stays open until the post-F0 recheck)

### A. Product choices resolved pre-F0 (no F0-dependent seam; R9 only decides minimum inclusion)

- R5: one-host/no-second-gizmo authority; Inspector↔gizmo commit sync polish; snap-winner feedback polish (no new framework); flat non-nested cluster concept; duplicate collision/bounds check + silent-skip→warn; align/distribute semantic direction (exact op set + frames at R9/post-F0); Local/World wire direction with no stored state.
- R6: shared/unique model, no slot/UV/graph; tint override; PBR map set on definitions; physical tile scale via existing repeat path; Apply-to-multiselection; shared/unique preview feedback; per-addition editor/visitor parity as acceptance requirement.
- R7: `SceneLightEntity` authority, no second light gizmo; range/cone/pick feedback candidates use native helper geometry only as a preferred primitive for selected capabilities; explicit spot half-angle/degree semantics and out-of-range compatibility decision; existing intensity values retained with accurate units; `castShadow` authored, map policy system-owned; temperature deferred. Global Scene environment architecture is ratified conditionally; inclusion and optional authored exposure remain R9. Tone mapper system-owned, initially AgX; preset baseline/legacy behavior must be explicit.
- R8: all presentation rules above; silent-skip→warn fixes.

### B. Decisions pending post-F0 recheck (decided at R9, after R0 gate item 7)

- Selection-Center pivot rigidity in the project/world frame; multi-selection Local frame semantics.
- Align/distribute reference-frame behavior; duplicate re-ground support source; cluster/workspace Room-context removal for canonical world-local Scene.
- Plan projection/transform integration with the world-local identity-frame path; retain inverse-resolve only for explicit legacy compatibility rather than treating its removal as a goal.
- Canonical Scene placement/selectability against wall-first Layout support/surface queries; no persistent Layout/Scene support dependency by default.
- P24A import consumption; cold static-model source authority; selected-capability cold-visitor parity (R1). P23.1 shared project codec now accepts wall-first/world-local, so there is no separate P24A persistence-format cutover blocker.

### C. R9 inclusion decisions (not F0-dependent; include-in-minimum vs depth tail at freeze)

- Bulk transform/material multi-edit; Scene/asset integrity diagnostics surface; disabled-without-reason polish backlog.
- Exact align/distribute op set beyond the R8 rules.
- Authored environment inclusion and optional authored exposure; global Scene architecture is ratified, schema/runtime readiness remains open.

### Three experiments / depth tails — not minimum prerequisites

| Disposition | Candidates |
|---|---|
| Non-blocking P24 experiments | WebGL LightProbeGrid; SunLight only with a relevant sunlight fixture; native pivot |
| Benchmark only for a demonstrated need | Compression, simplification/LOD, batching, GTAO, integrated WebGL effects |
| Follow-up | Area lights, broader HDR formats, IES |
| Post-P25 renderer/asset platform | WebGPU migration, clustered lighting, SSGI/VXGI, Gaussian splats, progressive streaming |
| Excluded from P24 minimum | Node-material authoring, Three scene persistence, replacement navigation/selection systems |

None becomes a P25 prerequisite. HTMLTexture does not change the accepted semantic
DOM Info Panel direction. Harvest §G supplies bounded experiment proposals, not an
instruction to run them all or automatically adopt its numerical budgets.

### D. Remaining R9 gate checklist status

1. Minimum P24A+P24B set — open (packet A is input, not the freeze).
2. Depth tails separated — open.
3. Final maturity matrix — R2 baseline done; final pass at freeze.
4. Operation/history ownership per capability — open.
5. Plan/3D acceptance — themes + R3/R4/R8 rules done; fixtures at freeze.
6. Save/Load + P22 acceptance — open as capability acceptance; basic wall-first/world-local format persistence is closed by P23.1, while static-model source authority and selected material/light/environment parity still need proof.
7. Post-F0 seam recheck — **R0 delta refresh complete 2026-09-10; R1 complete 2026-09-10**; selected P24 placement/selection/support-query integration checks remain named blockers before R9 freeze.
8. Renderer/dependency baseline + acceptance definition — open; conditional upgrade comparison, no r186 pin.
9. Child plans + owner review — last.

## R9 pre-freeze closeout — DRAFT (not a freeze; no child plans; no schema/API/code changes)

Consolidates the pre-F0 packet into freeze-ready input. Legend: [F0-FREE] resolved pre-F0 · [POST-F0 RECHECK] blocked on F0 seam recheck · [R9-PICK] F0-independent inclusion call at freeze.

### 1. Final capability maturity matrix (draft; dated baseline, affected rows require post-F0 refresh)

| Capability | Verified behavior + owner | Disposition | Sensitivity |
|---|---|---|---|
| Selection / multi-select | Room-scoped ordered multi-select; canonical ordered selection; R4 continuity ratified | KEEP; room-gate removal rechecked | [POST-F0 RECHECK] |
| Transform / pivot | One host, bounds-center pivot, scalar v6 scale; Local/World wire direction, no stored state | POLISH wire + Inspector sync + snap-winner feedback | [F0-FREE] direction; pivot rigidity + multi-select Local frame [POST-F0 RECHECK] |
| Align / distribute | Absent (only CSS/triangle-align matches); deterministic Scene ops direction | DEEPEN direction | [F0-FREE]; exact op set [R9-PICK], frames [POST-F0 RECHECK] |
| Duplicate | +0.5 XZ clone, one history entry, no collision/re-ground, partial clusters silently skipped (`placement-cluster-mutator.svelte.ts:639-669`) | Duplicate-then-move + collision/bounds + warn fix | [F0-FREE]; re-ground support source [POST-F0 RECHECK] |
| Groups / clusters | Flat same-room, required `roomId` (`:486-508`) | KEEP flat, no nesting | [F0-FREE]; Room-gate removal [POST-F0 RECHECK] |
| Box selection | Absent (only camera-plan rubber band) | FOLLOW-UP | [F0-FREE] |
| Visibility / lock | Absent from Scene schema | FOLLOW-UP | [F0-FREE] |
| Placement / grounding | Tagged-floor-only 5-ray Drop/Keep-on-Floor; no stacked/support choice, no Layout-query lookup | KEEP pipeline; wall/support direction one-time-placement-first | [F0-FREE]; support source + stacked choice [POST-F0 RECHECK] |
| Replacement | No replace-asset path found | New op preserving placement via normalized metadata | [F0-FREE] direction; bounds/pivot variance [POST-F0 RECHECK] |
| Placement entry points | Click-to-place 3D only; model Place via Inspector; no Plan entry/drag | POLISH entries, no new framework | [F0-FREE] |
| Snapping | Room-local steps + Shift-bypass; no winner feedback | KEEP seams; winner feedback | [F0-FREE]; snap frame/application [POST-F0 RECHECK] |
| Materials | 6-entry catalogue; shared/unique + Make Unique; single-select Inspector; roughness/metalness + one map override; read-only repeat path | KEEP model; tint + PBR set + tile scale + multi-apply + preview feedback | [F0-FREE]; import consumption [POST-F0 RECHECK / R1] |
| Lights | Point/spot/directional + 0.12m proxy, -Z aim, radian UI, authored `castShadow`; current angle validation exceeds renderer limit | KEEP authority; accurate units without rescaling; explicit half-angle + compatibility handling; native helpers preferred only for selected feedback/handle capabilities; preset baseline policy | Direction [F0-FREE]; minimum inclusion R9; compatibility fixture required |
| Environment | Fixed ambient+directional rig; Threlte AgX/sRGB; no authored environment; native backend primitives available | Global Scene intent ratified if included; tone mapper system-owned; caches derived; per-room blending follow-up | Inclusion + optional exposure [R9-PICK]; schema/registry/runtime [POST-F0 RECHECK / R1] |
| Outliner / Inspector | Shared selection, commit-only numerics, single-select panels, existing density treatment | KEEP + POLISH; bulk edit | [F0-FREE]; bulk edit [R9-PICK] |
| History | Single stack (`HISTORY_LIMIT=100`), 1-gesture-1-entry, `begin/commit/cancelDocumentTransaction` (`editor-store.svelte.ts:2813-2867`) | KEEP; cross-view fixture pins at freeze | [F0-FREE]; operation-owner tags [POST-F0 RECHECK] |
| Editor / visitor boundary | Visitor runtime excludes editor stores/history/gizmos; P20 dynamic bytes remain image/procedural-only; static models have shipped-static validation/retention | KEEP boundary; DEEPEN static model loading authority | static source resolver + capability parity [R1]; dynamic GLB FOLLOW-UP |
| P24A supply | Proven normalization/rights/OBB evidence, frozen 12-object proof set, static-first registry direction; `gltfpack` deferred | Evidence complete; static-first minimum direction closed; dynamic GLB deferred | static-model source authority + corpus/runtime acceptance [R1]; no project-codec blocker |

No broad direct-reference survey is needed. The dated R0–R8 baseline plus completed Three harvest inform these dispositions; refresh affected code evidence after F0 and run only the bounded compatibility/implementation checks required by the selected capabilities and dependency baseline.

### 2. Deterministic operation / history ownership matrix (draft)

One completed gesture = one history entry; cancel/no-op = none. All Scene ops target `SceneDocument`; acquisition workflow state never enters `SceneDocument` or editor undo.

| Semantic operation / current seam | Owner | Inputs | History | Sensitivity |
|---|---|---|---|---|
| Place asset [conceptual]; current `beginAssetPlacement` / `createPendingPlacementAt` seam | Placement pipeline (`pendingPlacement*` → commit) | asset id + pose intent | One entry on commit | Support/Y resolution [POST-F0 RECHECK] |
| Scene transform gesture → gizmo/Plan adapter → begin transaction → transient preview → `updatePlacementTransform*` at commit → one `commitDocumentTransaction` | Scene 3D gizmo adapter + Scene Plan gesture adapter + `editor-store` transaction | entity ids + owned components | One entry; no-op none | Frames [POST-F0 RECHECK] |
| Inspector transform edit → `commitPlacementTransform(id, transform)` | `editor-store.commitPlacementTransform` | single entity id + transform | One entry | Sync [F0-FREE] |
| `duplicateSelection` | `placement-cluster-mutator` | selection set | One entry; partial warns (fix directed) | Re-ground [POST-F0 RECHECK] |
| `createCluster(name?)` / `deleteCluster` | `placement-cluster-mutator` on `SceneDocument.clusters` | member ids + optional name; dated pre-F0 baseline derived/validated common room internally; recheck world-local compatibility/cutover behavior | One entry | Room constraint [POST-F0 RECHECK] |
| Align / distribute (new) | Deterministic Scene ops | entity set + mode | One entry each | Exact set [R9-PICK]; frames [POST-F0 RECHECK] |
| `replaceSceneAsset` (new, no current seam) | Scene op via normalized metadata | entity id + asset id | One entry | Bounds behavior [POST-F0 RECHECK] |
| `applyMaterialPatch` / `makeMaterialInstanceUnique` | `material-resource-mutator` via `store.requestMaterialEdit` | entity/material ids + patch | One entry (confirm at freeze) | [F0-FREE] |
| Light authoring [conceptual]; current `beginLightPlacement` / `createPendingLightAt` / `updateLightFields` seam + gallery preset op | Light mutators (`editor-lights.ts`, preset as ordinary Scene ops) | kind + props | One entry | [F0-FREE] |
| Environment edit / selected gallery preset [conditional; conceptual, no API/schema freeze] | Scene semantic operations; registry owns referenced asset bytes | Global environment intent + optional exposure only if selected | One entry per logical authored edit/preset; cache generation/update produces none | Inclusion [R9-PICK]; schema/runtime [POST-F0 RECHECK / R1] |
| P24A acquire / normalize / approve | Pipeline-owned lifecycle, not editor undo | source + recipe + rights evidence | Promotion gated by acceptance, never half-approved | static registry/runtime acceptance [R1]; no editor history |

No mixed Layout/Scene transaction and no persistent cross-document support reference without a separately specified ownership/delete/history contract (umbrella invariant; addendum entity-ownership rule).

### 3. Museum-owned acceptance fixtures (draft)

- F1 same-ID Plan/3D mutation: place in 3D → move X/Z + yaw in Plan → Y/pitch/roll/scale preserved; one entity identity throughout. [POST-F0 RECHECK projection source]
- F2 Plan-ineligible-but-selected: select a light in 3D or Outliner → switch to Plan → selection persists, no transform handles, `Not editable in Plan` reason shown in viewport + Inspector badge.
- F3 view-switch cancel: mid-drag placement/transform + switch view → gesture cancelled, no history result, committed state untouched.
- F4 preview/state consistency: ghost/proxy/overlay treatment never appears in serialized `SceneDocument`.
- F5 preview/commit agreement: final displayed preview equals committed result for one staging gesture.
- F6 one-handle-drag-one-history: single yaw-handle drag → exactly one history entry; failed/no-op drag → none.
- F7 duplicate-then-move: +0.5 XZ clone, collision/bounds checked, one entry; partial-cluster duplicate warns. [re-ground POST-F0 RECHECK]
- F8 material assign + Make Unique: shared edit prompts choice; unique clone `-copy`; editor authored output, Preview and Publish resolve materials consistently on the selected renderer baseline. Review expected BRDF/PMREM differences separately if the baseline changes.
- F9 light authoring: create point/spot → Inspector sync (explicit half-angle/degree semantics, supported range and existing out-of-range policy, `castShadow`) → visitor renders same lights with no helpers. Verify finite/unlimited range feedback and no second gizmo authority.
- F10 Save/Load + cold visitor: staged Scene/materials/lights and, if selected, global environment/optional exposure survive round-trip; referenced assets remain retained/resolvable. Cold visitor and Preview consume the same canonical meaning with no editor-only state. [asset resolution + selected-capability parity]
- F11 gallery preset: one preset op yields ordinary authored Scene light/environment state selected by the preset, with one history result and no persistent rig. Verify explicit baseline/assist-light interaction and legacy appearance policy; environment remains conditional on R9 inclusion.
- F12 explicit support choice: ambiguous stacked surface forces a visible choice; never silent `Y = 0`. [POST-F0 RECHECK]

- F13 renderer/dependency acceptance [baseline selected at freeze; additional comparisons if upgraded]: use harvest §F dimensions for package/types/Threlte compatibility, editor gestures, material/light/shadow output, accepted assets/decoders, context recovery, visitor isolation, disposal and performance. Test only selected capabilities/formats; calibrate proposed numeric thresholds on named devices/fixtures before ratifying them. Include PCFSoft→PCF behavior, BRDF/PMREM/environment rotation changes and Object3D/Threlte disposal interaction as applicable. Explicitly investigate the post-r186 point-shadow disposal fix on the exact candidate baseline; later fixes cannot be assumed present. Failure requires a verified compatible baseline/fix or deferral, not an automatic r186 upgrade.

## R9 — B6 minimum freeze / child-plan gate

Only after R0–R8 have enough evidence:

1. freeze the **minimum useful P24A + P24B capability set**;
2. separate optional depth tails from ship gates;
3. record the final capability maturity matrix;
4. define deterministic operation/history ownership for every included capability;
5. define Plan/3D acceptance where both views participate;
6. define Save/Load + P22 visitor acceptance;
7. consume the completed R0/R1 post-F0 refresh and close the named capability-specific placement/selection/support-query rechecks before freezing any affected child plan;
8. select the conditional Three/types/Threlte renderer/dependency baseline and define its acceptance gate (F13); an upgrade is separately scoped, not implied by the harvest or required for already-available capabilities. Record required compatibility/visual/lifetime/performance proof as an implementation ship gate; no changed baseline enters production until it passes;
9. then update/write implementation-ready P24 child plans and request owner review.

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