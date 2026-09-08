# P24 — Scene / Staging Depth umbrella

**Created:** 2026-09-08 · **Status:** proposed (tracker authoritative)
**Depends on:** P23 minimum useful Build set complete.
**Detail status:** umbrella boundary only. P24A/P24B implementation briefs are TBD
until the owner supplies the dedicated research results described below.

## Outcome

P24 turns Scene authoring into a reusable staging system rather than a collection
of model-placement controls. A creator can bring useful 3D content into the
project, place and revise it precisely, style it with reusable materials and
environments, author lighting, and publish the same canonical Scene state through
the visitor runtime.

P24 remains one registered roadmap tier because all of this is **Stage** work over
one project/Scene system. Internally it is split into two bounded subtracks so
asset-supply work does not get conflated with rich 3D-editor behavior:

```text
P24 — Scene / Staging Depth
├─ P24A — Asset Supply + Canonical Ingest
└─ P24B — Rich 3D Scene / Staging Editor
```

`P24A` and `P24B` are umbrella-internal labels, not new tracker numbers. They do
not consume P25 or relax the tracker rule that registered plans use one flat
P-number namespace.

## Why split

The two subtracks solve different product problems and are informed by different
research:

- **P24A** asks: *What reusable 3D content can enter the product safely and in a
  normalized form?* It is primarily informed by the Phase 2 exact asset/pipeline
  harvest.
- **P24B** asks: *What semantic Scene operations and editor interactions make that
  content genuinely easy to stage and revise?* It is primarily informed by the
  Phase 4 Scene/3D-staging capability harvest.

The split is not a document-ownership split like P23 Layout vs P24 Scene. Both
subtracks ultimately support one Stage vocabulary and must converge on the
existing project asset registry, `SceneDocument`, selection/history, Threlte/Three
render path and P22 visitor-safe publish boundary.

## P24A — Asset Supply + Canonical Ingest

**Research input:** Phase 2 exact repository / asset harvest. Detailed scope TBD
until that research is supplied and reviewed against the live repository.

P24A owns the **supply and normalization side** of staging. Directionally it may
cover:

- a bounded curated starter set of reusable 3D models;
- reusable PBR material/texture assets;
- a bounded HDRI/environment starter set;
- source adapters/import paths where justified;
- canonical asset records and immutable/revisioned asset identity where required;
- normalized scale, pivot/orientation, dimensions and placement metadata;
- thumbnails/previews and web-ready derivatives;
- optimization/validation such as canonical GLB, Meshopt/KTX2 or equivalent only
  where the research and current pipeline justify them;
- provenance, creator, source, license and attribution metadata;
- Plan representation/footprint metadata where an accepted Scene asset is Plan-
  eligible;
- one accepted path from built-in/upload/provider source into the same project
  asset registry and placement flow.

### P24A does not mean “build a giant asset store”

The first gate proves the ingest/normalization/reuse system with enough assets to
stage representative projects. It does **not** wait for hundreds of models, a
marketplace, community catalogue, user-wide My Assets, every provider adapter, or
an exhaustive material/HDRI library.

A larger catalogue remains an evidence-led asset-library backlog after the P24
minimum. Asset count is not itself a P24 acceptance criterion.

### P24A ownership boundary

Assets belong to the project-level asset registry, not to a new Scene-only store.
Once accepted, an asset is consumed through normal Scene operations regardless of
whether it came from Built-in, Upload or Online. Provider/source identity may
survive as provenance but never becomes a second Scene-object system.

P24A may supply materials, textures and HDRIs as reusable project assets, but it
does not by itself define the complete user-facing material or lighting editor.
Those authoring semantics belong to P24B.

## P24B — Rich 3D Scene / Staging Editor

**Research input:** Phase 4 Scene / 3D-staging capability harvest. Detailed scope
TBD until that research is supplied and reviewed against the live repository.

P24B owns the **authoring and revision side** of staging. Directionally the first
useful set is expected to investigate and bound:

- durable asset placement and replacement while preserving intended transform /
  placement state;
- stronger translate/rotate/scale workflows without introducing a second gizmo
  or transform authority;
- duplicate and multi-selection where justified by current Scene selection/history;
- align/distribute/spacing operations;
- floor, wall and support-aware placement/snap behavior;
- material assignment and a bounded useful material-editing surface;
- authored Scene lights such as the core light types justified by research;
- light selection, transforms, targets/gizmos and Inspector behavior where needed;
- environment/HDRI assignment and a bounded exposure/intensity workflow;
- one useful reusable lighting/environment setup or rig;
- 3D-editor visual/interaction polish needed to make selection, placement,
  materials and lighting understandable rather than merely technically present;
- deterministic semantic Scene operations that future agents can invoke through
  the same behavior as human UI.

The final P24B minimum is **not yet approved by this umbrella list**. Phase 4 must
compare public/open-source 3D editors, scene editors and DCC interaction patterns
against the actual Museum Editor Scene seams before the detailed brief is written.

### P24B ownership boundary

Durable staged objects, authored materials/overrides, lights and other Scene
properties remain `SceneDocument`-owned according to the existing project model.
`LayoutDocument` architecture does not migrate into Scene because P24 gains richer
3D controls. Scene Plan Arrange may remain a 2D client of eligible Scene behavior,
but owner routing remains explicit and no mixed Layout/Scene transaction is
introduced casually.

Lighting remains authored Scene truth, not shell/global configuration. Material
and environment state must likewise resolve through canonical project/Scene
semantics rather than live only inside Threlte components, Three objects or UI
stores.

## Material/environment boundary between A and B

The split is intentionally:

```text
P24A
material / texture / HDRI bytes + metadata + normalized reusable asset
        ↓
P24B
assign / edit / override / light / environment semantic Scene operations
        ↓
SceneDocument + project asset references
        ↓
visitor-safe runtime
```

P24A can therefore continue expanding the catalogue after P24B begins. P24B must
not depend on harvesting the entire Phase 2 inventory before useful staging can
ship.

## Research gates before detailed briefs

### Before P24A detailed planning

Review Phase 2 against at least:

- the current P20 project asset registry/R2 contracts;
- P22 published asset resolution and visitor-runtime boundaries;
- current asset manifest/codec/placement seams;
- Scene Plan footprint/PlanProxy behavior;
- legal/provenance requirements for any bundled or provider-imported content.

The detailed brief should select a **small Wave 1** starter inventory and the
minimum ingest/normalization pipeline needed for it. Research recommendations are
not dependencies until verified against current code and upstream licenses.

### Before P24B detailed planning

Review Phase 4 against at least:

- current `SceneDocument` and scene codec/types;
- canonical selection and one chronological history model;
- existing TransformControls/gizmo ownership and room-local transforms;
- Scene Plan Arrange owner routing;
- Threlte/Three rendering patterns;
- current material/light representation, if any;
- P22 visitor-runtime serialization/resolution;
- editor/visitor bundle isolation.

The brief should identify the smallest coherent set of semantic Stage operations,
then map UI/gizmos/Inspector affordances onto them. Do not invent a universal
command bus or a second transform/material/light state model.

## Minimum gate before P25

P25 Experience Foundation should wait for the **useful minimum from both P24A and
P24B**, not their optional depth tails.

Directionally that means enough P24A to supply/resolve representative reusable
assets/materials/environments, and enough P24B to place/revise those assets,
materially differentiate scenes, author core lighting/environment intent and
publish the result through normal project truth.

The exact acceptance gate is TBD after Phase 2 + Phase 4 review. It must be small
enough that P24 does not become “finish Blender before Experience.”

Optional tails such as a much larger catalogue, marketplace/store workflows,
advanced grouping/components, broad surface-placement tooling, shader graphs, UV
editing, advanced PBR workflows, IES/baked/volumetric lighting, large lighting-rig
catalogues, animation/rigging, mesh topology editing or other DCC-class depth do
not silently gate P25.

## Shared architecture invariants

Both P24A and P24B must preserve:

- frozen visitor/editor isolation and P22 cold-visitor bundle boundaries;
- one project asset registry and one asset-resolution path;
- separate `LayoutDocument` and `SceneDocument` ownership;
- room-local Scene transforms where currently authoritative;
- deterministic selection and one chronological history model;
- one existing transform/gizmo authority rather than a parallel staging gizmo;
- one camera graph/navigation/motion system, untouched by staging depth;
- Svelte 5 runes and current Threlte patterns;
- authored project state as serializable semantic data, never persisted Three
  objects, GPU resources, DOM nodes, Svelte component state or generated runtime
  handles.

## Planning / registration rule

This umbrella is intentionally **not implementation-ready**. Do not turn the
above directional bullets into tickets merely because they are listed here.

After the owner supplies research:

1. review Phase 2 and amend/register the detailed P24A contract inside this
   umbrella or a linked annex;
2. review Phase 4 and amend/register the detailed P24B contract inside this
   umbrella or a linked annex;
3. reconcile overlap, especially materials, HDRIs/environments, Plan footprints,
   asset replacement and semantic agent operations;
4. pin whether P24A and P24B execute sequentially or partially in parallel based
   on the actual implementation dependencies discovered;
5. define the combined P24 minimum acceptance gate that unlocks P25;
6. keep all optional catalogue/DCC depth as separately registered evidence-led
   follow-up work.

Until those research reviews happen, the tracker owns only the P24 umbrella
status and dependency. `P24A` / `P24B` are scope partitions, not claims that
detailed implementation plans have been approved.
