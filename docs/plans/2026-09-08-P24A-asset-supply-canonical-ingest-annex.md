# P24A — Asset Supply + Canonical Ingest annex

**Created:** 2026-09-08  
**Parent:** [P24 — Scene / Staging Depth umbrella](2026-09-08-P24-scene-staging-depth-umbrella.md)  
**Status:** `seed — evidence pending` — Phase 2 research reviewed; the bounded implementation-readiness reconciliation below has not run, so this is not yet implementation-ready.  
**Tracker:** P24 remains the registered plan number. `P24A` is an umbrella-internal label, not a new tracker number.  
**Planning model:** child seed of the [P24 umbrella](2026-09-08-P24-scene-staging-depth-umbrella.md) — implementation detail preserved here; evidence (Phase 2 research + the readiness reconciliation) informs but never overrides the umbrella contract.

## Research basis

Reviewed against live `main`:

- `docs/Deep-research/P24-3D-assets-staging/museum-editor-phase2-exact-asset-harvest-P24.md`
- `docs/Deep-research/P24-3D-assets-staging/museum-editor-phase2-acquisition-manifest.json`
- shipped P20 project asset registry/R2 contracts;
- current `Asset`, `AssetFootprint`, manifest and placement seams;
- P22 publish/visitor-runtime resource-resolution contract.

Phase 2 is specific enough to stop broad asset-source discovery. It recommends a first acquisition wave from **Poly Haven + Kenney Furniture Kit + a small attribution-aware Sweet Home 3D subset**, with a coherent **Poly Haven + ambientCG material set**, **Poly Haven HDRIs**, glTF normalization around **glTF Transform** plus measured `gltfpack`/meshoptimizer use, and **Kenney + Sweet Home 3D** as the first PlanProxy benchmark corpus.

The research JSON's 32-object Wave 1 is an **acquisition backlog**, not the P24A ship gate.

### Research closure vs implementation readiness

The **broad source-discovery gate is closed**. P24A does not need another general survey of asset sites, model repositories, material libraries or HDRI providers before planning can continue.

That does **not** mean every pipeline choice below is automatically implementation-ready. Before P24A.0–P24A.6 become implementation tickets, run a bounded implementation-readiness reconciliation against the exact current repository and the exact upstream tools/resources selected from Phase 2.

The readiness pass must inspect the current end-to-end asset path, including:

- built-in `Asset` catalogue / manifest behavior and `AssetFootprint` generation/consumption;
- current model loading and Scene asset references;
- P20 project asset registry + R2 ownership/storage boundaries;
- current image/texture registry path and what can genuinely be reused for models;
- P22 release-resource resolution and cold visitor behavior;
- Scene Save/Load model references;
- current material definitions, texture resources and visitor material resolution;
- current Plan footprint/proxy behavior;
- editor/visitor bundle isolation.

It must also verify the exact external tools/sources that would become implementation dependencies or acquisition authorities. For each serious dependency/reference record:

```text
Project / source
Pinned version / commit / dated API or archive
Exact module / CLI / endpoint / file format used
License / redistribution evidence
Current measured behavior in Museum's pipeline
Disposition: KEEP CURRENT | EXTEND | BENCHMARK FIRST | DEFER | REJECT
```

At minimum recheck glTF Transform, Khronos glTF Validator, meshoptimizer/`gltfpack`, the selected Poly Haven/Kenney/Sweet Home 3D acquisition paths, ambientCG material supply and any `pmndrs/assets` packaging pattern actually reused.

The readiness pass is **not another broad ecosystem-research phase**. Its purpose is to prevent the annex from assuming that a research recommendation maps cleanly onto the live P20/P22/Scene runtime, and to benchmark unresolved choices before they become architecture.

The same maturity rule used by P24B applies here:

> Existing asset infrastructure is not automatically product-complete because a registry, loader or catalogue seam has shipped; external tooling is not automatically better because Phase 2 recommends it. Preserve canonical Museum Editor ownership, identify the concrete pipeline gap, then extend only the seam that needs depth.

Until this reconciliation closes, P24A.0–P24A.6 below are the **approved planning direction and acceptance hypotheses**, not permission to blindly implement every named mechanism exactly as written.

## Outcome

P24A proves one deterministic route from external reusable content to canonical Stage supply:

```text
source / provider / pack
        ↓
acquisition candidate + rights evidence
        ↓
validation + normalization
        ↓
canonical web derivative + metrics + preview
        ↓
PlanProxy / AssetFootprint where eligible
        ↓
approved reusable asset identity
        ↓
Scene placement + Save/Load + P22-compatible visitor resolution
```

Furniture/models remain Scene assets. Downloadable doors, windows, stairs and other structural meshes do not become Scene-library architecture merely because they exist; structural meaning remains `LayoutDocument`-owned or procedural where appropriate.

## Hard ownership rules

- `SceneDocument` owns placed Scene semantics, not acquisition workflow state.
- Project asset registry owns durable project asset identity/provenance/storage metadata.
- R2 owns bytes, never semantic project structure.
- Built-in/upload/provider sources converge on one accepted asset-resolution model; source identity remains provenance.
- Do not persist Three.js objects, GPU resources, provider URLs, signed URLs, R2 keys or conversion-session handles as authored truth.
- Do not turn the current `Asset` catalogue type into a dump of registry/database/acquisition state.
- Preserve visitor/editor isolation and P22 cold-runtime resolution.
- Preserve current room-local transforms, Scene selection/history, Threlte patterns and one transform authority.

## P24A.0 — Acquisition and provenance contract

Define a pipeline-owned lifecycle separate from placed Scene truth. Exact type names are implementation details, but the boundary should resemble:

```text
AcquisitionCandidate
  ↓ validate / normalize / review
NormalizedAssetRevision
  ↓ approve
AssetDefinition / project asset identity
  ↓ place
SceneObject
```

Acquisition metadata may include provider, pack, source asset ID, source URL, source/content hashes, creator, source license, rights confidence, attribution requirements, acquisition date, conversion recipe and import status.

Use the research rights gate:

```text
A — explicit rights, low ambiguity
B — usable with explicit conditions/attribution
C — manual/legal review required
D — not suitable for bundled standard library
```

Unknown/unresolved rights cannot silently promote to Approved. Repository code licenses do not prove rights for bundled media. Retain dated source/terms evidence where it materially establishes redistribution rights.

## P24A.1 — Deterministic normalization pipeline

Build a repeatable CLI/job, not a per-asset manual Blender ritual.

Required stages:

```text
acquire + hash
→ validate
→ normalize units to metres
→ normalize +Y/up + canonical orientation policy
→ normalize pivot / ground contact by placement semantics
→ preserve physical dimensions
→ prune/deduplicate only where safe
→ optimize mesh/textures where measured useful
→ emit canonical GLB/web derivative
→ collect metrics
→ generate thumbnail/preview
→ generate/validate PlanProxy when eligible
→ write provenance + conversion metadata
→ promote only after acceptance
```

Primary public references agents may inspect:

- glTF Transform / existing `@gltf-transform/cli` for deterministic glTF processing;
- Khronos glTF Validator + Sample Assets for validation/QA fixtures;
- meshoptimizer / `gltfpack` for measured Meshopt/KTX2/optimization value;
- `pmndrs/assets` for browser packaging/derivative-size patterns only;
- Objaverse-XL processing scripts for batch validation/rendering patterns, not dataset harvesting.

Do **not** normalize every object to a unit box. Real scale is part of placement semantics and future agent vocabulary.

## P24A.2 — PlanProxy pipeline

Phase 2 proxy labels are pipeline strategies, not new runtime Plan entity types:

```text
generated-obb
generated-silhouette
existing-topdown
existing-planIcon
manual-review
```

Accepted Plan-eligible assets must resolve to the existing canonical footprint contract:

```text
source model / metadata / planIcon / top-down oracle
        ↓
proxy generation + simplification + review
        ↓
AssetFootprint { width, depth, outline? }
        ↓
existing Scene Plan / Arrange rendering
```

Use the Kenney + Sweet Home 3D benchmark corpus for thin-leg, round, irregular, storage and authored-plan-icon cases. Raster/top-down assets may be reference or source hints, but do not become a parallel persistent Plan truth.

Wall art and ceiling/hanging assets may remain Plan-ineligible when a floor footprint would mislead.

## P24A.3 — Cross-source proof set

Before catalog expansion, prove the same pipeline on roughly **10–12 representative assets**:

- multiple Poly Haven GLB/glTF items;
- multiple Kenney GLBs after one verified package-level scale/orientation calibration;
- a small Sweet Home 3D subset exercising SH3F metadata and attribution;
- round + irregular/non-rectangular shapes;
- an item with existing top-down/`planIcon` reference;
- at least one attribution-required asset.

Acceptance:

- source and rights evidence retained;
- source/content hashes deterministic;
- physical scale correct within explicit tolerance;
- pivot/orientation correct for declared placement surface;
- canonical derivative validates and renders through the existing Threlte/Three path;
- metrics + preview generated;
- Plan-eligible items resolve to valid `AssetFootprint`;
- attribution survives catalogue/registry use;
- failed import cannot leave half-approved state;
- rerunning the same pinned input/recipe cannot silently change semantic output.

Where research marks exact archive members unresolved, implementation must enumerate the acquired archive. Do not invent SH3F member paths or use mirrors as acquisition authority.

## P24A.4 — Canonical model registry/runtime path

This is the main repository-specific gap.

P20 shipped durable registry/R2 support around images/textures and explicitly recorded that no viable generic client GLB import/placement path existed. P22 also excludes uploaded model ingestion. P24A must therefore establish the canonical model path rather than assuming normalized GLBs already flow through the durable project/runtime boundary.

Required direction:

```text
accepted model identity
   ↓
project/catalogue asset resolution
   ↓
Scene asset reference + placement
   ↓
Save / Load
   ↓
P22-compatible release resource identity
   ↓
cold visitor runtime
```

Implementation may stage this:

1. prove bundled/static Wave 1 resources through P22's shipped-resource compatibility path;
2. when upload/provider model ingestion is introduced, extend the P20 registry/R2 + P22 resolver to canonical GLB bytes.

End state: one authored asset-resolution model, not separate placement systems for Built-in, Upload and Online.

## P24A.5 — Materials + HDRIs supply

Use the exact Phase 2 material/HDRI manifests as the supply-side source of truth.

P24A may provide:

- bounded Poly Haven + ambientCG PBR starter materials;
- physical-scale texture metadata where available;
- KTX2/web derivatives where measured useful;
- bounded Poly Haven HDRIs with smaller editor derivatives and higher-quality runtime derivatives;
- procedural simple PBR presets for plain glass, painted metal/plastic, matte colors and other cases where downloaded textures add little value.

Boundary:

```text
P24A: bytes + metadata + provenance + reusable definitions
P24B: assign / edit / override / environment / lighting semantics
```

P24A does not define the final material editor, light gizmos, exposure UX or lighting rigs.

## P24A.6 — Wave 1 catalogue expansion

After P24A.0–P24A.5 are green, run the remaining approved entries from the 32-object Phase 2 Wave 1 manifest through the same pipeline.

This is catalogue execution, not another architecture slice. Any item requiring bespoke unsupported runtime semantics, unresolved rights or one-off conversion behavior falls out for explicit review rather than weakening the canonical pipeline.

Deferred until later evidence/gates:

- broader FreeCAD conversions;
- Smithsonian hero scans beyond per-file verified items;
- heavy foliage before an LOD/alpha policy;
- large provider connectors;
- arbitrary assets hidden in open-source repos;
- static door/window meshes as substitutes for Layout semantics.

## Non-authoritative public references

Agents may access and study these directly:

| Concern | Reference | Use |
|---|---|---|
| Realistic models/materials/HDRIs | Poly Haven | P0 acquisition + metadata/API reference |
| Low-poly models + top-down oracles | Kenney Furniture Kit | P0 acquisition + PlanProxy benchmark |
| Spatial metadata / `planIcon` | Sweet Home 3D SH3F | P0 schema/source reference, attribution-aware |
| Materials | ambientCG | P0 complementary CC0 source |
| glTF normalization | glTF Transform | reuse current tooling where appropriate |
| Optimization | meshoptimizer / `gltfpack` | benchmark/reuse if justified |
| Validation | Khronos glTF Validator | hard validation + fixture coverage |
| Packaging patterns | `pmndrs/assets` | study only |
| Batch processing patterns | Objaverse-XL scripts | study code only, dataset rights separate |
| Later coherent packs | Quaternius named CC0 packs | P1 catalogue expansion |
| Selected parts/reference | FreeCAD Parts Library | P1 selected assets + architecture reference |
| Cultural hero objects | Smithsonian Open Access 3D | P2, per-media rights verification |

These sources never override Museum Editor ownership, project model, visitor isolation or licensing gates.

## P24A acceptance gate

P24A minimum is complete when:

1. acquisition/provenance contract blocks unresolved rights;
2. repeatable normalization produces validated web assets with real dimensions, orientation/pivot policy, metrics and previews;
3. 10–12 cross-source proof assets pass one pipeline;
4. Plan-eligible proof assets compile to existing `AssetFootprint` and pass the Phase 2 proxy fixtures;
5. an attribution-required item proves provenance survives use;
6. accepted model identity has an explicit Scene placement + Save/Load + P22 visitor delivery path, with no live-provider/editor-warmed dependency;
7. a bounded material/HDRI set is available for P24B;
8. the rest of the 32-object manifest is demonstrably repeatable backlog work and does not gate P24B or P25.

## Deferred scope

P24A minimum does not include marketplace/community catalogue, user-wide My Assets, arbitrary remote import, full asset search/discovery platform, foliage/LOD system, every provider adapter, giant asset counts, material-editing UX, lighting authoring, shader graphs, UV editing, animation/rigging or mesh topology editing.
