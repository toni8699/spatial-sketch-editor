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
5. checked-in Phase 2 / Phase 4 research;
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
- Save/Load and P22 visitor consumption of Scene state.

Classify every finding as:

```text
stable across P23
changes in P23 F0
requires post-F0 recheck
irrelevant to P24
```

R0 prevents P24 from freezing around code that P23 is already scheduled to replace.

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

## R2 — P24B B0 capability-maturity baseline

Audit current Stage capabilities end-to-end before deciding depth.

Required matrix:

| Capability | Current Museum behavior | Canonical owner | Proven gap | Evidence needed? | Disposition |
|---|---|---|---|---|---|
| Selection / multi-select | audit | existing selection | TBD | TBD | TBD |
| Transform / pivot | audit | single transform authority | TBD | TBD | TBD |
| Duplicate | audit | existing mutator/history | TBD | TBD | TBD |
| Groups / clusters | audit | existing cluster model | TBD | TBD | TBD |
| Plan Scene staging | audit | Scene entity + derived Plan projection | TBD | TBD | TBD |
| Placement / grounding | audit | existing placement pipeline | TBD | TBD | TBD |
| Snapping / guides | audit | existing Scene/Plan seams | TBD | TBD | TBD |
| Materials | audit | current Scene material model | TBD | TBD | TBD |
| Lights | audit | current Scene light model | TBD | TBD | TBD |
| Environment | audit | renderer/Scene seams | TBD | TBD | TBD |
| Outliner / Inspector | audit | existing editor surfaces | TBD | TBD | TBD |
| History integration | audit | canonical history | TBD | TBD | TBD |

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
- Plan preserves Y/elevation, pitch, roll and scale unless an explicit operation says otherwise;
- Plan placement height = explicit active floor/support elevation + asset grounding offset;
- ambiguous stacked/support surfaces require a choice;
- Plan-ineligible assets remain selectable but do not expose misleading manipulation;
- replacement preserves intended placement through normalized asset metadata;
- one completed placement gesture produces one history result; cancel/no-op produces none;
- no persistent Layout/Scene support dependency is introduced without a separately specified ownership/delete/history contract.

Pascal evidence to reuse here is fixture-level only: same-ID Plan/3D mutation, derived renderer, transient preview patterns, and negative counterexamples around fresh IDs, pitch/roll reset and clamping.

## R4 — B5 cross-view interaction contract, then defer polish freeze

Freeze the **behavioral** B5 contract early:

- committed canonical selection survives Plan ↔ 3D switching;
- a Plan-ineligible selected entity stays selected while losing unsupported handles;
- unfinished placement/transform cancels on view switch with no history result;
- view switching never silently commits;
- PlanProxy/ghost presentation is derived editor state;
- final displayed preview and committed result agree.

Do not freeze the full B5 presentation/polish scope yet. Final visual density, affordances and staging polish should close only after B1–B4 determine what tools actually ship.

Pascal's mounted-pane behavior is a **negative reference** here: its view switch does not provide Museum's required cancel semantics.

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

## R7 — B4 lighting + environment maturity

Audit current Scene lights and renderer/environment seams. Decide the minimum for:

- core authored light types/properties;
- selection/pick proxies and 3D handles;
- Inspector synchronization;
- useful lighting/environment preset(s);
- HDRI/environment consumption from P24A;
- exposure/environment semantics only where the current renderer can own them cleanly;
- visitor parity and editor-only helper isolation.

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
