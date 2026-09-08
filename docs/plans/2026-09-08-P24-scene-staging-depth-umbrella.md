# P24 — Scene / Staging Depth umbrella

**Created:** 2026-09-08 · **Status:** proposed (tracker authoritative)
**Depends on:** P23 minimum useful Build set complete.
**Detail status:** P24A Phase 2 research reviewed and detailed annex registered; P24B remains TBD until Phase 4 Scene / 3D-staging research is supplied and reviewed.

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
  normalized form?* Phase 2 now answers this with an exact acquisition manifest,
  source ranking, materials/HDRIs, PlanProxy fixtures, pipeline references and
  reject list. Its detailed contract is registered in
  [the P24A annex](2026-09-08-P24A-asset-supply-canonical-ingest-annex.md).
- **P24B** asks: *What semantic Scene operations and editor interactions make that
  content genuinely easy to stage and revise?* It remains primarily informed by
  the future Phase 4 Scene/3D-staging capability harvest.

The split is not a document-ownership split like P23 Layout vs P24 Scene. Both
subtracks ultimately support one Stage vocabulary and must converge on the
existing project asset registry, `SceneDocument`, selection/history, Threlte/Three
render path and P22 visitor-safe publish boundary.

## P24A — Asset Supply + Canonical Ingest

**Research reviewed:**

- `docs/Deep-research/P24-3D-assets-staging/museum-editor-phase2-exact-asset-harvest-P24.md`
- `docs/Deep-research/P24-3D-assets-staging/museum-editor-phase2-acquisition-manifest.json`

**Detailed contract:**
[2026-09-08-P24A-asset-supply-canonical-ingest-annex.md](2026-09-08-P24A-asset-supply-canonical-ingest-annex.md)

P24A owns the **supply, normalization, provenance and canonical acceptance side**
of staging. The accepted Phase 2 direction is:

- Wave 1 acquisition source classes: Poly Haven, Kenney Furniture Kit and a small
  attribution-aware Sweet Home 3D subset;
- coherent Poly Haven + ambientCG material supply and bounded Poly Haven HDRIs;
- deterministic glTF normalization using the existing glTF Transform seam first,
  with validator/meshoptimizer/gltfpack work added only where measured useful;
- PlanProxy generation/benchmarking that resolves into the existing
  `AssetFootprint` contract rather than creating another Plan truth;
- a **10–12 asset cross-source proof set** as the P24A minimum evidence, while the
  research JSON's 32-object Wave 1 remains repeatable acquisition backlog;
- explicit acquisition/provenance and rights gates before an asset can become
  Approved;
- an explicit canonical model registry/runtime path because P20/P22 do not yet
  provide generic uploaded GLB ingestion;
- one accepted asset-resolution model across Built-in / Upload / Online sources.

P24A does **not** mean “build a giant asset store.” It does not wait for hundreds
of models, marketplace/community catalogue, user-wide My Assets, every provider
adapter or exhaustive material/HDRI coverage.

### P24A ownership boundary

Assets belong to the project-level asset registry/catalogue boundary, not to a new
Scene-only store. Once accepted, an asset is consumed through normal Scene
operations regardless of source. Provider/source identity may survive as
provenance but never becomes a second Scene-object system.

Acquisition candidates/revisions may carry source hashes, provider IDs, rights
confidence, conversion recipes and review state. Those fields do not automatically
belong in `SceneDocument`.

P24A may supply material, texture and HDRI bytes plus reusable definitions, but it
does not define the complete user-facing material or lighting editor. Those
authoring semantics belong to P24B.

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
material / texture / HDRI bytes + metadata + normalized reusable definition
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

## Research gates

### P24A

**Broad research gate closed.** Phase 2 has been reviewed and the linked P24A
annex is now the planning source. Implementation agents still verify live code
seams, pinned upstream versions and license evidence before each increment; that
is implementation due diligence, not another broad source-discovery pass.

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

P24A's own minimum is now pinned in its annex: provenance/rights contract,
repeatable normalization, the bounded cross-source proof set, canonical
`AssetFootprint` output for eligible assets, model Scene/Save/Load/visitor
resolution, and bounded material/HDRI supply. The remaining Wave 1 catalogue is
not a P25 blocker.

The combined P24 acceptance gate remains final-TBD until Phase 4/P24B review. It
must stay small enough that P24 does not become “finish Blender before
Experience.”

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

P24 remains one registered roadmap tier. `P24A` and `P24B` remain internal scope
labels rather than tracker numbers.

Current detail state:

```text
P24A — Phase 2 research reviewed; detailed annex registered; not implemented
P24B — umbrella direction only; detailed contract awaits Phase 4 research
```

Next planning steps:

1. when P24A becomes active, inspect the exact current asset/registry/runtime code
   before turning annex increments into implementation tickets;
2. review Phase 4 and register the detailed P24B contract;
3. reconcile overlap, especially materials, HDRIs/environments, Plan footprints,
   asset replacement and semantic agent operations;
4. pin whether P24A and P24B execute sequentially or partially in parallel based
   on actual implementation dependencies;
5. define the combined P24 minimum acceptance gate that unlocks P25;
6. keep optional catalogue/DCC depth as separately registered evidence-led
   follow-up work.
