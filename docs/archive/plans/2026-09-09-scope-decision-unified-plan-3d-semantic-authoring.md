# Scope decision — unified Plan / 3D semantic authoring

**Date:** 2026-09-09  
**Status:** Decision recorded — owner-ratified 2026-09-09  
**Amends:** P23 Layout Depth direction, P24 Scene / Staging Depth direction, and the North Star Spatial authoring model.  
**Does not change tracker status:** P23 remains top-level `approved`; P23 child plans remain `implementation-ready` subject to their dependencies; P24 remains `proposed` / research-reconciliation until its own implementation-ready gate closes.

## Decision

Museum Editor treats **Plan and 3D as complementary authoring lenses over the same canonical Spatial project state**.

> **Plan and 3D have equal access to shared semantic operations where their representation supports those operations truthfully.**

This does **not** mean identical tools or identical authority in both views.

```text
Prefer spatial / visual work?
→ author in 3D

Prefer layout / spacing work?
→ author in Plan

Both
→ invoke the same semantic operation for the same target entity
→ mutate that entity's canonical owning document
```

The target entity's owning document determines the mutation domain, regardless of view, local mode, toolbar label or gesture surface.

Examples:

```text
drag Wall in Plan
→ Layout operation
→ LayoutDocument

drag LayoutObject in Arrange
→ Layout operation
→ LayoutDocument

drag Scene sofa proxy in Arrange
→ Scene operation
→ SceneDocument
```

Plan is a composed authoring surface across existing domains. It is **not** a new persistence domain and must not introduce mirrored Plan-owned copies of Layout or Scene state.

## Current implementation versus ratified target

The wall-first structure below is a **P23 ratified target**, not the shipped Layout structure today:

```text
TARGET AFTER P23 FOUNDATION

LayoutDocument
├─ Floors
│  ├─ Junctions
│  ├─ Walls
│  ├─ Openings → Wall
│  └─ Rooms → persistent semantics over derived enclosed faces
└─ LayoutObjects → document-level / project-world-local

SceneDocument
├─ Scene entities / clusters / materials / lights
└─ Camera-authored records currently persist here
```

Current shipped code remains Room-owned / Room-local where the current architecture/component docs say so until P23 Foundation actually lands.

`Camera` names the semantic subsystem and workspace authority. It does **not** imply a third project document; its current durable authored records live in `SceneDocument`.

## View authority

Plan remains intentionally 2.5D.

### Plan may author where truthful

- X / Z;
- yaw;
- spacing and alignment;
- floor-plane snapping and guides;
- architectural drafting relationships;
- other explicitly defined 2D operations.

### 3D may author where truthful

- Y / elevation;
- pitch / roll;
- full supported spatial placement;
- complex support/surface relationships;
- vertical composition;
- material / lighting judgement.

A Plan operation must preserve transform components it does not own, including Y/elevation, pitch, roll and scale, unless the operation explicitly defines otherwise.

Tilted, wall-mounted, hanging or otherwise unsuitable entities require either a truthful Plan representation or explicit Plan-ineligible treatment. A misleading footprint is not acceptable merely to claim Plan parity.

## Selection and gesture continuity

Committed canonical selection **must survive** Plan ↔ 3D view switching where the selected entity still exists.

An entity that is ineligible for Plan manipulation may lose Plan handles/affordances, but it does **not** lose canonical selection merely because the current view cannot edit it.

Committed project state and history also survive view switching.

Transient gestures are different:

> Switching Plan ↔ 3D while a placement or transform gesture is unfinished cancels that gesture with no history result unless a future explicitly designed cross-view continuation flow says otherwise.

A view switch must never silently commit a placement or transform.

## Scene asset / PlanProxy contract

A Scene entity remains the single placed-asset truth.

```text
AssetDefinition
├─ 3D representation
├─ PlanProxy / AssetFootprint metadata
├─ Plan eligibility
├─ normalized pivot
├─ grounding/contact offset
└─ placement-surface metadata

SceneEntity
├─ asset reference
└─ canonical authored transform
```

Plan derives the 2D representation from the asset definition plus the Scene entity transform. A Scene entity must not persist its own duplicate proxy geometry merely so Plan can render it.

Proxy generation/eligibility remains supply-side asset metadata work. Richer visual proxies may be derived/cacheable, but they do not become another authored object system.

## Plan placement height / support contract

A floor-placeable Scene asset may eventually be created from either Plan or 3D through the same Scene placement semantics.

Plan placement does **not** silently assume world `Y = 0`.

Use an explicit placement basis:

```text
active floor / explicitly chosen support elevation
+
asset grounding/contact offset
→ authored placement height
```

If multiple stacked/support surfaces are plausible, require an explicit floor/support choice or mark the placement unresolved. Do not guess from the first ray/containment/proximity result.

## Shared Plan substrate

P23 may strengthen the existing Plan substrate where current operations require it, so P24 can add richer Scene participation without building a second Plan system.

Useful shared seams include:

- one Plan X/Z world coordinate system after the P23 world-local migration;
- owner-aware Layout vs Scene hit routing;
- canonical selection identity rather than a mirrored Plan selection store;
- renderer-neutral projections;
- reusable snap/guide candidate resolution where existing operations need it;
- transient interaction overlays;
- one coherent drafting visual grammar.

This direction does **not** authorize a new generic Plan framework, universal command bus, generic capability registry or other abstraction merely for future flexibility. Extend existing infrastructure only where current P23/P24 operations create concrete pressure.

## Roadmap ownership

### P23 — Build depth

P23 remains the architectural Build milestone, not "the 2D milestone." Its wall-first architecture stays ratified.

The unified-view direction may refine execution in:

- P23.1 — precision/direct manipulation;
- P23.2 — snapping/guides;
- P23.3 — openings;
- P23.6 — drafting visual grammar;
- P23.8 — topology interaction;
- P23.9 — Wall/Partition sketching.

P23 may expose Layout operations from Plan or 3D where a representation supports them truthfully, but the current child-plan scope is not automatically expanded merely because this direction exists.

P23's top-level tracker status remains `approved`. Its child plans remain `implementation-ready` subject to their documented dependencies.

### P24 — Stage depth

P24's destination is **rich Scene / staging authoring**, with 3D as the richest representation but not the only authoring client.

Directional ownership:

```text
P24A
→ PlanProxy / AssetFootprint generation
→ Plan eligibility
→ normalized pivot / grounding-contact metadata
→ placement-surface metadata

P24B B2
→ shared Plan / 3D placement semantics
→ floor/support elevation resolution
→ placement / replacement operation maturity
→ preservation of transform components outside Plan authority

P24B B5
→ proxy/ghost presentation
→ committed selection continuity across views
→ unfinished-gesture cancellation on view switch
→ cross-view discoverability / staging polish
```

These assignments establish direction only. They do **not** automatically make every listed capability a P24 minimum ship gate. P24's minimum remains unfrozen until its B-studies/reconciliation close.

The P24B label may be described conceptually as **Rich Scene / Staging Authoring** rather than implying that all Stage work must happen in 3D.

## Pascal Editor evidence boundary

`pascalorg/editor` is a useful candidate reference because its public architecture appears to combine semantic entities with both 3D and floorplan representations/affordances. It is **evidence, not architecture authority**.

A bounded Pascal harvest may inform P23 implementation refinement and P24 reconciliation, but:

- it is **not a new P23 execution gate**;
- it does not reopen P23's ratified wall-first direction by default;
- license must be verified at the exact pinned revision before any `PORT` or `ADAPT` classification;
- existing repository/license restrictions on copied/adapted code remain in force;
- UX/architecture can be `STUDY` even where code reuse is prohibited;
- discovering a genuine Museum architectural limitation triggers a separate architecture review and owner decision;
- it does **not** authorize importing Pascal's generic scene/node architecture, state model or history model.

Harvest findings must be classified `PORT | ADAPT | STUDY | REJECT` against Museum's existing ownership, selection/history, Svelte/Threlte and visitor/editor contracts.

## Hard constraints preserved

- `LayoutDocument` and `SceneDocument` remain separate authored owners.
- The target entity's owner, not the view, determines the mutation domain.
- One canonical selection identity/history path per owner remains authoritative.
- One canonical layout compiler remains authoritative.
- One camera graph/route/motion system remains authoritative.
- Camera remains a semantic subsystem whose current durable records live in `SceneDocument`.
- Plan and 3D never persist competing copies of the same authored entity.
- Visitor/editor isolation remains strict.
- One completed semantic gesture produces one logical history result where history applies; cancel/no-op produces none.

## Ratification result

The directional principle is now ratified. Exact P24 mechanisms/minimum remain evidence-led, and Pascal is a bounded reference harvest rather than a planning authority or execution gate.
