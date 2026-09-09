# P23 / P24 addendum — unified Plan / 3D semantic authoring

**Date:** 2026-09-09  
**Status:** ratified directional addendum  
**Applies to:** P23 Layout Depth + P24 Scene / Staging Depth  
**Owner decision:** [`../archive/plans/2026-09-09-scope-decision-unified-plan-3d-semantic-authoring.md`](../archive/plans/2026-09-09-scope-decision-unified-plan-3d-semantic-authoring.md)  
**Pascal harvest brief:** [`../Deep-research/P24-3D-assets-staging/Pascal-editor-harvest-brief.md`](../Deep-research/P24-3D-assets-staging/Pascal-editor-harvest-brief.md)

This addendum is the active planning pointer for the 2026-09-09 unified-view ratification. It does not renumber P23/P24 or change tracker status.

## Ratified cross-cutting rule

> **Plan and 3D are complementary Spatial authoring lenses. They have equal access to shared semantic operations where the representation supports those operations truthfully. The target entity's owning document determines the mutation domain.**

Plan remains intentionally 2.5D. Equal access does not imply identical tools.

Committed canonical selection **must survive** Plan ↔ 3D switching while the selected entity still exists. A Plan-ineligible entity may lose manipulation handles without losing canonical selection.

An unfinished placement/transform gesture cancels on view switch with no history result unless a future explicitly specified cross-view continuation flow exists. View switching never silently commits.

## Target ownership, not current shipped Layout

The following is the **ratified P23 target after the Foundation Gate**, not current shipped Layout structure:

```text
LayoutDocument
├─ Floors
│  ├─ Junctions
│  ├─ Walls
│  ├─ Openings → Wall
│  └─ Rooms → persistent semantics over derived faces
└─ LayoutObjects → document-level / project-world-local

SceneDocument
├─ Scene entities / clusters / materials / lights
└─ Camera-authored records currently persist here
```

Current Room-owned / Room-local behavior remains current implementation until P23 Foundation ships.

`Camera` is a semantic subsystem/workspace authority, not a proposed third document.

## Entity-driven mutation ownership

Examples:

```text
Plan Wall drag
→ target = Wall
→ LayoutDocument operation

Arrange LayoutObject drag
→ target = LayoutObject
→ LayoutDocument operation

Arrange Scene asset drag
→ target = SceneEntity
→ SceneDocument operation
```

Do not derive mutation ownership from `Plan`, `3D`, `Layout`, `Arrange`, `Build`, or `Stage` labels alone.

## P23 implications

P23 remains top-level `approved`; its child plans remain `implementation-ready` subject to their documented dependencies.

P23's wall-first architecture is not reopened by this addendum. The direction instead constrains/refines implementation:

- P23.1 — direct manipulation should be semantic-operation based rather than Plan-only state;
- P23.2 — snapping/guides may extend existing candidate infrastructure where current operations require it; do not build a new generic snap framework for hypothetical future clients;
- P23.3 — Opening operations remain Layout-owned regardless of whether a later affordance exists in Plan or 3D;
- P23.6 — establish one coherent Plan drafting grammar that future Scene proxies can join;
- P23.8/P23.9 — transient previews/commits should remain compatible with a shared semantic-operation model.

The shared Plan substrate should **extend existing infrastructure only under concrete current-operation pressure**. This addendum does not authorize a universal command bus, generic capability registry, mirrored Plan state, or new general framework.

The Pascal harvest may refine P23 implementation choices but is **not a P23 execution gate**.

## P24 implications

P24 remains `proposed` / research-reconciliation; its minimum is still unfrozen.

Conceptually describe P24B's destination as **Rich Scene / Staging Authoring**, with 3D as the richest representation but not the only authoring client.

### P24A direction

P24A owns supply-side Plan representation and eligibility metadata:

```text
AssetDefinition
├─ 3D representation
├─ PlanProxy / AssetFootprint
├─ Plan eligibility
├─ normalized pivot
├─ grounding/contact offset
└─ placement-surface metadata

SceneEntity
├─ asset reference
└─ canonical authored transform
```

PlanProxy belongs to the asset definition. Do not persist a second per-instance proxy copy in `SceneEntity`.

A misleading Plan representation is not acceptable. Tilted, wall-mounted, hanging or otherwise unsuitable assets may be explicitly Plan-ineligible.

### P24B B2 direction

Study/freeze shared Plan/3D placement semantics here:

- both views create the same canonical target Scene entity when placing a Scene asset;
- Plan authors only supported floor-plane components such as X/Z/yaw;
- Plan preserves Y/elevation, pitch, roll and scale unless an explicit operation says otherwise;
- Plan placement height resolves from explicit active floor/support elevation + asset grounding offset;
- ambiguous stacked/support surfaces require a choice; never silently default to world `Y = 0`.

### P24B B5 direction

Study/freeze cross-view interaction presentation here:

- proxy/ghost presentation;
- committed selection continuity;
- Plan-ineligible-but-selected treatment;
- unfinished-gesture cancellation on view switch;
- cross-view discoverability and visual polish.

These are directional ownership assignments, **not automatic P24 minimum ship gates**. B0–B5 reconciliation still decides the minimum.

## Pascal evidence boundary

Use [`Pascal-editor-harvest-brief.md`](../Deep-research/P24-3D-assets-staging/Pascal-editor-harvest-brief.md) as the bounded study contract.

Requirements:

- pin exact Pascal revision;
- verify license at that revision before any `PORT` or `ADAPT` recommendation;
- retain all existing Museum license restrictions;
- classify findings `PORT | ADAPT | STUDY | REJECT`;
- do not import Pascal's scene/node/state/history architecture by default;
- if a real Museum architectural limitation is discovered, stop and raise a separate architecture review/owner decision.

Pascal is evidence for P23 refinement and P24 reconciliation, never planning authority by itself.
