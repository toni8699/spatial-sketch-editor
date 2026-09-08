# Phase 2 — Exact Repository / Asset Harvest for Museum Editor

**Research date:** 2026-09-07  
**Purpose:** operational acquisition plan for the first normalized, legally reusable Museum Editor asset library.

## Decision in one paragraph

Build Wave 1 from **Poly Haven + Kenney Furniture Kit + a small attribution-aware Sweet Home 3D Kator subset**, while separately ingesting a coherent **Poly Haven + ambientCG material set** and **Poly Haven HDRIs**. In parallel, implement the ingest pipeline around **glTF Transform + gltfpack/meshoptimizer**, and use **Sweet Home 3D + Kenney top-down renders** as the first PlanProxy benchmark corpus. Do **not** spend the first implementation cycle on FreeCAD conversions, Smithsonian scans, huge plant meshes, or hidden assets copied from arbitrary open-source repos. Those are Wave 2/3 once provenance, conversion, and PlanProxy gates exist.

This recommendation preserves Museum Editor's architecture: furniture/models remain reusable Scene assets; doors/windows/stairs/structural elements should normally become semantic `LayoutDocument` features or procedural references rather than static Scene meshes.

---

## Evidence standard and license confidence

- **A — explicit rights, low ambiguity:** suitable for bundled library.
- **B — usable with clear conditions/attribution:** suitable once attribution/provenance is automated.
- **C — ambiguity requires manual/legal review:** do not ship in standard library yet.
- **D — unsuitable for bundled library:** connector/reference only or reject.

A source can permit **commercial use** but still forbid **standalone redistribution**. Those are not the same permission.

A GitHub repository's MIT/GPL license does not automatically cover files under `assets/`. Every harvested source retains a rights record containing source URL, author, asset/pack license, terms URL where relevant, acquisition date, and immutable source/content hashes.

---


## A. Top 15 sources to inspect / clone first

| Rank | Source | Exact repo/download | Why | Asset folder / endpoint | License | Disposition | Priority | Metadata |
|---|---|---|---|---|---|---|---|---|
| 1 | Poly Haven | https://polyhaven.com/ · https://api.polyhaven.com/ | Best clean CC0 source for realistic models, materials, and HDRIs; rich dimensions/polycount/tags and current commercial API. | API asset IDs; GET /assets, /info/{id}, /files/{id} | Assets CC0. Live API currently permits commercial use; clear Poly Haven credit + unique User-Agent required. | Bundle / Harvest | P0 | 5/5 |
| 2 | Sweet Home 3D furniture libraries | https://www.sweethome3d.com/importModels.jsp · https://sourceforge.net/projects/sweethome3d/files/SweetHome3D-models/ | Best spatial-editor metadata source: dimensions, elevation, rotation, creator/license, planIcon, deformability/texturability, shelf metadata. | SH3F ZIP root: PluginFurnitureCatalog.properties + model/icon/texture members | Official libraries include CC0/Public Domain, CC-BY, Free Art; preserve per-pack/per-item author/license. | Bundle / Harvest | P0 | 5/5 |
| 3 | Kenney Furniture Kit | https://kenney.nl/assets/furniture-kit | Tiny CC0 low-poly models, broad furniture coverage, plus 2D top-down/isometric renders useful for PlanProxy benchmarking. | Official archive; mirrored package verifies Models/GLTF format/*.glb and top-down/isometric render families. | CC0 | Bundle / Harvest | P0 | 2/5 |
| 4 | ambientCG | https://ambientcg.com/ | CC0 material source complementary to Poly Haven, especially marble, leather, linen, paper, and some woods. | Asset IDs / ZIP derivatives; API metadata where available | CC0 assets | Bundle / Harvest | P0 | 4/5 |
| 5 | pmndrs/assets | https://github.com/pmndrs/assets | Not a furniture catalogue; excellent browser-asset packaging reference using glTF Transform, resized WebP, tiny HDRI derivatives, npm exports. | src/models, src/hdri, src/textures, Makefile, bin | CC0 | Study / Pipeline + fixtures | P0 | 2/5 |
| 6 | glTF Transform | https://github.com/donmccurdy/glTF-Transform | Canonical TypeScript/Node normalization layer for deterministic glTF processing. | packages/functions/src, packages/cli/src | MIT | Reuse code | P0 | n/a |
| 7 | meshoptimizer / gltfpack | https://github.com/zeux/meshoptimizer | Production mesh optimization, simplification, Meshopt compression, KTX2/WebP conversion, instancing. | gltf/, src/, gltfpack CLI | MIT | Reuse tool | P0 | n/a |
| 8 | FreeCAD Parts Library | https://github.com/FreeCAD/FreeCAD-library | Furniture fixtures plus valuable parametric architecture references; explicit content-vs-code license split. | Architectural Parts/Living room, Lighting, Doors, Doors_Windows, Kitchen, Bathroom | Repository CONTENT CC-BY-3.0; authors per git history/FCStd metadata. Code separately licensed. | Harvest selected furniture / Study Layout concepts | P1 | 4/5 |
| 9 | Smithsonian Open Access 3D | https://www.si.edu/openaccess · https://3d.si.edu/ | High-value exhibition hero objects; item/media rights must be checked separately. | Per-record 3D media/downloads | Only specific CC0/Public Domain media enters bundled library. | Bundle selected hero assets | P2 | 5/5 |
| 10 | Quaternius explicit CC0 packs | https://quaternius.com/packs/furniture.html · https://quaternius.com/packs/ultimatefurniture.html · https://quaternius.com/packs/ultimatehomeinterior.html | Compact coherent furniture/interior packs with current official pages explicitly stating CC0. | Downloaded pack archives; FBX/OBJ/Blend | CC0 on the named pack pages; retain page snapshot with acquired archive. | Bundle / Harvest | P1 | 2/5 |
| 11 | primitive-assets-library | https://github.com/pesaksintondji/primitive-assets-library | Small CC0 Blender asset library with tagged previews and parametric Geometry Nodes, including stairs. | assets/primitives.blend, scripts/, metadata/thumbnails | CC0 | Study / Reimplement semantic primitives | P1 | 3/5 |
| 12 | Objaverse-XL processing scripts | https://github.com/allenai/objaverse-xl | Useful large-scale Blender import, validation, metadata extraction, bounds, missing-texture detection, and deterministic render patterns. | scripts/rendering/blender_script.py | Code Apache-2.0. Dataset/object rights are separate and not accepted wholesale. | Study / Pipeline | P1 | 5/5 |
| 13 | Khronos glTF Sample Assets | https://github.com/KhronosGroup/glTF-Sample-Assets | Excellent pipeline/renderer fixtures and extension coverage. Licenses are model-specific and documented per model directory. | Models/<model>/README.md and LICENSE.md where present | Per-model; some CC0/CC-BY, some testing-only restrictions. | QA fixtures / selective harvest only | P1 | 5/5 |
| 14 | Blender Geometry Node French Houses | https://github.com/IRCSS/Blender-Geometry-Node-French-Houses | Strong reference for foundation-driven buildings, rails, terraces, stairs, walls/gates, towers. | GeometryNodesFrenchHous.blend, Demo-MagicSchoolV2.blend, documentation/ | MIT | Study / Reimplement Layout concepts | P2 | 3/5 |
| 15 | Blender Stairs | https://github.com/blackears/blenderStairs | Focused staircase parameter/algorithm reference without adopting a full CAD kernel. | src/ and addon/operator modules; makeDeploy.py | Apache-2.0 | Study / optionally reuse algorithm | P2 | 2/5 |


### Important source-level findings

**Poly Haven.** Assets are CC0. Its July 2026 API policy now explicitly permits commercial API use, requires a unique `User-Agent`, and asks products using the live API to visibly identify Poly Haven as the source. The API provides IDs, taxonomy, tags, dimensions, polycount/texel density where relevant, authors, file hashes, file dependencies, URLs and sizes. Preserve a snapshot of the API terms when building the adapter.  
Sources: [current API policy](https://polyhaven.com/our-api), [Public API repository](https://github.com/Poly-Haven/Public-API).

**Sweet Home 3D.** This is the highest-value metadata reference. Official furniture libraries can include commercial-redistributable Public Domain/CC0, CC-BY, and Free Art content, but third-party-source restrictions still matter. SH3F is a ZIP-like library package built around `PluginFurnitureCatalog.properties`. Its metadata can carry `model`, `planIcon`, dimensions, elevation, rotation, creator/license, deformability/texturability, and storage/shelf placement fields.  
Sources: [official model libraries](https://www.sweethome3d.com/importModels.jsp), [SourceForge packs](https://sourceforge.net/projects/sweethome3d/files/SweetHome3D-models/), [Sweet Home 3D rights/legal](https://www.sweethome3d.com/legal.jsp).

**Kenney Furniture Kit.** Current official pack: **140 files, CC0**. It is unusually valuable because the distribution also has 2D top-down/isometric render families in addition to low-poly 3D content. Use the official Kenney archive as the acquisition authority. Paths below were cross-checked against mirrors only to identify package filenames; do not acquire the standard library from a random mirror.  
Source: [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit).

**FreeCAD Parts Library.** `LICENSE-Assets` explicitly says repository content — FCStd, STEP, BREP, STL, DXF, WRL, screenshots/thumbnails — is CC-BY-3.0, while source code has a separate license. Each part has its own author and must be attributed. Prefer sparse checkout because the repository is roughly 5 GB.  
Source: [LICENSE-Assets](https://github.com/FreeCAD/FreeCAD-library/blob/master/LICENSE-Assets).

**Quaternius.** Do not infer rights from reputation. The exact official pages for `Furniture Pack` (23 models, Oct 2017), `Ultimate Furniture Pack` (20 models, Mar 2019), and `Ultimate House Interior Pack` (123 models, Jun 2020) currently say **CC0** and personal/commercial use. Save the page/rights snapshot together with the downloaded archive.  
Sources: [Furniture Pack](https://quaternius.com/packs/furniture.html), [Ultimate Furniture Pack](https://quaternius.com/packs/ultimatefurniture.html), [Ultimate House Interior Pack](https://quaternius.com/packs/ultimatehomeinterior.html).

**Khronos samples.** Treat each model separately. Khronos explicitly says the detailed license lives in the model directory, and the repository contains some testing-only assets whose license forbids commercial deployment. Use these primarily as validation/extension fixtures.  
Source: [glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets).


## B. Clone / download sheet

| Repository | Clone URL | Default branch | License | Snapshot inspected | Inspect first | Ignore / warning |
|---|---|---|---|---|---|---|
| pmndrs/assets | https://github.com/pmndrs/assets.git | main | CC0 | Live main inspected 2026-09-07; immutable commit not pinned by retrieval | src/models; src/hdri; src/textures; Makefile; package.json | fonts unless needed; model files as production furniture |
| pmndrs/market | https://github.com/pmndrs/market.git | main | MIT app | Live main inspected 2026-09-07 | README.md; License.md; server; API/CDN/minifier code | do not infer CDN asset rights from MIT app |
| donmccurdy/glTF-Transform | https://github.com/donmccurdy/glTF-Transform.git | main | MIT | Search result pinned files at commit 01cad7b8e516b334bb2ac3e7e662231ba017352b; re-pin current commit on integration | packages/functions/src; packages/cli/src; README.md | docs site build unless needed |
| zeux/meshoptimizer | https://github.com/zeux/meshoptimizer.git | master | MIT | Current repository inspected; v1.1 release Apr 2 2026 surfaced, master header already reports 1.2 so pin tested release/commit | gltf; src; gltfpack docs | experimental APIs unless benchmark requires |
| FreeCAD/FreeCAD-library | https://github.com/FreeCAD/FreeCAD-library.git | master | Assets CC-BY-3.0; code separate | Live master inspected 2026-09-07 | LICENSE-Assets; Architectural Parts/Living room; Lighting; Doors; Doors_Windows | clone whole 5GB repo only if needed; prefer sparse checkout |
| KhronosGroup/glTF-Sample-Assets | https://github.com/KhronosGroup/glTF-Sample-Assets.git | main | Per-model | Live main inspected 2026-09-07 | Models/Models.md; Models/<name>/README.md; LICENSES | testing-only or issue-tagged models for bundled library |
| allenai/objaverse-xl | https://github.com/allenai/objaverse-xl.git | repository default branch | Apache-2.0 code | Live repository inspected 2026-09-07 | scripts/rendering/blender_script.py; objaverse; tests | dataset harvesting without per-object rights filter |
| pesaksintondji/primitive-assets-library | https://github.com/pesaksintondji/primitive-assets-library.git | repository default branch | CC0 | Live repository inspected 2026-09-07 | assets/primitives.blend; scripts; docs | Bean rigged asset; unrelated primitive duplication |
| IRCSS/Blender-Geometry-Node-French-Houses | https://github.com/IRCSS/Blender-Geometry-Node-French-Houses.git | repository default branch | MIT | Live repository inspected 2026-09-07 | GeometryNodesFrenchHous.blend; documentation; Demo-MagicSchoolV2.blend | directly importing generated houses as Layout truth |
| blackears/blenderStairs | https://github.com/blackears/blenderStairs.git | repository default branch | Apache-2.0 | Live repository inspected 2026-09-07 | src; makeDeploy.py; addon operator modules | Blender UI plumbing; keep only algorithm/parameter lessons |


### Non-Git acquisition sheet

#### Poly Haven

```text
Catalogue:
  GET https://api.polyhaven.com/assets

Metadata:
  GET /info/{assetId}

Files:
  GET /files/{assetId}

Required:
  User-Agent: MuseumEditorAssetPipeline/<version>
```

During acquisition persist:

```text
assetId
files_hash
authors
dimensions
polycount
texel_density
tags
category
source file URL
source file size/hash
API policy snapshot
acquiredAt
```

For the **bundled standard library**, prefer a build-time snapshot and your own normalized derivatives rather than making published experiences depend on live Poly Haven URLs.

#### Sweet Home 3D

Download and inspect these first:

```text
3DModels-BlendSwap-CC-0-1.9.3.zip   # 175 public-domain/CC0 models
3DModels-KatorLegaz-1.9.3.zip       # 90 CC-BY models
3DModels-Scopia-1.9.3.zip           # 500 CC-BY models, Wave 2
```

The current 1.9.3 library archives were released 2024-08-21.

Unpack each `.sh3f` and parse the root `PluginFurnitureCatalog.properties`.

**Do not invent member paths.** This research pass could verify the SH3F schema and official pack metadata but could not directly enumerate the current SourceForge SH3F archive members. The implementation task should produce a machine-generated inventory before importing anything:

```text
index
id
name
category
model path
icon path
planIcon path
width/depth/height
elevation
modelRotation
creator
license
resizable/deformable/texturable
shelfElevations
shelfBoxes
dropOnTopElevation
```

#### Kenney

Acquire from:

```text
https://kenney.nl/assets/furniture-kit
```

After downloading:

```text
1. Hash original archive.
2. Retain CC0 evidence/page snapshot.
3. Inventory `Models/GLTF format/`.
4. Pair models with top-down render family where present.
5. Measure one known object to resolve package unit scale.
6. Apply one canonical package-level unit conversion if consistent.
```

#### Quaternius

Acquire only from the named official CC0 pack pages. Before conversion, inventory archive members. Do not assume model filenames from screenshots or third-party mirrors.

#### Smithsonian

Acquire only when the **specific media file** is CC0/Public Domain. Record metadata-level rights and media-level rights independently.


## C. Exact asset acquisition manifest — Wave 1

**Wave 1 count: 32 assets.** These are intentionally biased toward clean rights, low ingest cost, and broad composition value. Lighting fixture meshes and plants are not forced into this wave; Museum Editor already has semantic lights, while foliage needs a deliberate alpha/LOD policy.

| Source | Pack | Asset ID | Exact file/path | Category | Style | Dimensions? | Native | PBR | Approx tris | License | Rights | Redistribute | Attribution | Effort | PlanProxy | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Poly Haven | Poly Haven Models | ArmChair_01 | Resolve from source metadata/archive | Furniture/Seating/Armchair | Victorian/vintage | ~1.1 m tall | glTF/GLB available | Yes | ~6K | CC0 | A | Yes | None for asset; credit required only if using live API | 1 | generated-silhouette | harvest |
| Poly Haven | Poly Haven Models | gallinera_chair | Resolve from source metadata/archive | Furniture/Seating/Chair | Antique Filipino | ~1.0 m tall | glTF/GLB available | Yes | ~12K | CC0 | A | Yes | None for asset | 1 | generated-silhouette | harvest |
| Poly Haven | Poly Haven Models | folding_wooden_stool | Resolve from source metadata/archive | Furniture/Seating/Stool | Utility wood/metal | ~0.5 m wide | glTF/GLB available | Yes | ~6K | CC0 | A | Yes | None | 1 | generated-silhouette | harvest |
| Poly Haven | Poly Haven Models | painted_wooden_stool | Resolve from source metadata/archive | Furniture/Seating/Stool | Painted rustic | ~0.6 m tall | glTF/GLB available | Yes | ~676 | CC0 | A | Yes | None | 1 | generated-silhouette | harvest |
| Poly Haven | Poly Haven Models | Sofa_01 | Resolve from source metadata/archive | Furniture/Seating/Sofa | Victorian/vintage | ~1.6 m wide | glTF/GLB available | Yes | ~4K | CC0 | A | Yes | None | 1 | generated-silhouette | harvest |
| Poly Haven | Poly Haven Models | painted_wooden_table | Resolve from source metadata/archive | Furniture/Tables/Dining | Farmhouse/rustic | ~2.4 m wide | glTF/GLB available | Yes | ~600 | CC0 | A | Yes | None | 1 | generated-silhouette | harvest |
| Poly Haven | Poly Haven Models | round_wooden_table_01 | Resolve from source metadata/archive | Furniture/Tables/Round | Wood | ~1.4 m wide | glTF/GLB available | Yes | ~9K | CC0 | A | Yes | None | 1 | generated-silhouette | harvest |
| Poly Haven | Poly Haven Models | wooden_table_02 | Resolve from source metadata/archive | Furniture/Tables/Small | Simple wood | ~1.1 m wide | glTF/GLB available | Yes | ~196 | CC0 | A | Yes | None | 0 | generated-silhouette | harvest |
| Poly Haven | Poly Haven Models | side_table_01 | Resolve from source metadata/archive | Furniture/Tables/Side | Modern/minimal | ~0.6 m tall | glTF/GLB available | Yes | ~3K | CC0 | A | Yes | None | 1 | generated-silhouette | harvest |
| Poly Haven | Poly Haven Models | Shelf_01 | Resolve from source metadata/archive | Furniture/Storage/Shelf | Simple shelf | ~2.1 m tall | glTF/GLB available | Yes | ~182 | CC0 | A | Yes | None | 0 | generated-obb | harvest |
| Poly Haven | Poly Haven Models | steel_frame_shelves_01 | Resolve from source metadata/archive | Furniture/Storage/Shelf | Industrial | ~2.1 m tall | glTF/GLB available | Yes | ~4K | CC0 | A | Yes | None | 1 | generated-silhouette | harvest |
| Poly Haven | Poly Haven Models | painted_wooden_cabinet | Resolve from source metadata/archive | Furniture/Storage/Cabinet | Painted vintage | ~1.2 m wide | glTF/GLB available | Yes | ~2K | CC0 | A | Yes | None | 1 | generated-silhouette | harvest |
| Kenney | Furniture Kit | chair | Models/GLTF format/chair.glb | Furniture/Seating/Chair | Stylized low-poly | Not embedded reliably; normalize/measure | GLB | Shared/simple material | Low-poly | CC0 | A | Yes | None | 1 | existing-topdown + generated-silhouette | harvest |
| Kenney | Furniture Kit | loungeChair | Models/GLTF format/loungeChair.glb | Furniture/Seating/Lounge | Stylized low-poly | Measure | GLB | Shared/simple material | Low-poly | CC0 | A | Yes | None | 1 | existing-topdown + generated-silhouette | harvest |
| Kenney | Furniture Kit | loungeDesignChair | Models/GLTF format/loungeDesignChair.glb | Furniture/Seating/Lounge | Stylized design | Measure | GLB | Shared/simple material | Low-poly | CC0 | A | Yes | None | 1 | existing-topdown + generated-silhouette | harvest |
| Kenney | Furniture Kit | loungeSofa | Models/GLTF format/loungeSofa.glb | Furniture/Seating/Sofa | Stylized low-poly | Measure | GLB | Shared/simple material | Low-poly | CC0 | A | Yes | None | 1 | existing-topdown + generated-silhouette | harvest |
| Kenney | Furniture Kit | loungeDesignSofa | Models/GLTF format/loungeDesignSofa.glb | Furniture/Seating/Sofa | Stylized design | Measure | GLB | Shared/simple material | Low-poly | CC0 | A | Yes | None | 1 | existing-topdown + generated-silhouette | harvest |
| Kenney | Furniture Kit | table | Models/GLTF format/table.glb | Furniture/Tables/Dining | Stylized low-poly | Measure | GLB | Shared/simple material | Low-poly | CC0 | A | Yes | None | 1 | existing-topdown + generated-silhouette | harvest |
| Kenney | Furniture Kit | sideTable | Models/GLTF format/sideTable.glb | Furniture/Tables/Side | Stylized low-poly | Measure | GLB | Shared/simple material | Low-poly | CC0 | A | Yes | None | 1 | existing-topdown + generated-silhouette | harvest |
| Kenney | Furniture Kit | cabinetBedDrawer | Models/GLTF format/cabinetBedDrawer.glb | Furniture/Storage/Cabinet | Stylized low-poly | Measure | GLB | Shared/simple material | Low-poly | CC0 | A | Yes | None | 1 | existing-topdown + generated-obb | harvest |
| Kenney | Furniture Kit | bathroomCabinet | Models/GLTF format/bathroomCabinet.glb | Furniture/Storage/Cabinet | Stylized low-poly | Measure | GLB | Shared/simple material | Low-poly | CC0 | A | Yes | None | 1 | existing-topdown + generated-obb | harvest |
| Sweet Home 3D | 3DModels-KatorLegaz-1.9.3.zip | Futon-couch | Resolve from source metadata/archive | Furniture/Seating/Sofa | Contemporary | In SH3F metadata | OBJ/MTL in SH3F | No; legacy material/texture | Low-poly target | CC-BY-3.0 | B | Yes | Kator Legaz; preserve exact SH3F creator/license | 2 | existing-planIcon if present, else generated-silhouette | harvest |
| Sweet Home 3D | 3DModels-KatorLegaz-1.9.3.zip | Mid-century-bench-sofa | Resolve from source metadata/archive | Furniture/Seating/Bench | Mid-century | In SH3F metadata | OBJ/MTL | No | Low-poly target | CC-BY-3.0 | B | Yes | Kator Legaz | 2 | existing-planIcon if present, else generated-silhouette | harvest |
| Sweet Home 3D | 3DModels-KatorLegaz-1.9.3.zip | Mid-century-sofa | Resolve from source metadata/archive | Furniture/Seating/Sofa | Mid-century | In SH3F metadata | OBJ/MTL | No | Low-poly target | CC-BY-3.0 | B | Yes | Kator Legaz | 2 | existing-planIcon if present, else generated-silhouette | harvest |
| Sweet Home 3D | 3DModels-KatorLegaz-1.9.3.zip | Mid-century-chair | Resolve from source metadata/archive | Furniture/Seating/Chair | Mid-century | In SH3F metadata | OBJ/MTL | No | Low-poly target | CC-BY-3.0 | B | Yes | Kator Legaz | 2 | existing-planIcon if present, else generated-silhouette | harvest |
| Sweet Home 3D | 3DModels-KatorLegaz-1.9.3.zip | Chair-ottoman | Resolve from source metadata/archive | Furniture/Seating/Lounge | Contemporary | In SH3F metadata | OBJ/MTL | No | Low-poly target | CC-BY-3.0 | B | Yes | Kator Legaz | 2 | existing-planIcon if present, else generated-silhouette | harvest |
| Sweet Home 3D | 3DModels-KatorLegaz-1.9.3.zip | Bar-stool | Resolve from source metadata/archive | Furniture/Seating/Stool | Contemporary | In SH3F metadata | OBJ/MTL | No | Low-poly target | CC-BY-3.0 | B | Yes | Kator Legaz | 2 | existing-planIcon if present, else generated-silhouette | harvest |
| Sweet Home 3D | 3DModels-KatorLegaz-1.9.3.zip | Dining-chair | Resolve from source metadata/archive | Furniture/Seating/Chair | Dining | In SH3F metadata | OBJ/MTL | No | Low-poly target | CC-BY-3.0 | B | Yes | Kator Legaz | 2 | existing-planIcon if present, else generated-silhouette | harvest |
| Sweet Home 3D | 3DModels-KatorLegaz-1.9.3.zip | Bench | Resolve from source metadata/archive | Furniture/Seating/Bench | Generic | In SH3F metadata | OBJ/MTL | No | Low-poly target | CC-BY-3.0 | B | Yes | Kator Legaz | 2 | existing-planIcon if present, else generated-silhouette | harvest |
| Sweet Home 3D | 3DModels-KatorLegaz-1.9.3.zip | Cafe-chair | Resolve from source metadata/archive | Furniture/Seating/Chair | Cafe | In SH3F metadata | OBJ/MTL | No | Low-poly target | CC-BY-3.0 | B | Yes | Kator Legaz | 2 | existing-planIcon if present, else generated-silhouette | harvest |
| Sweet Home 3D | 3DModels-KatorLegaz-1.9.3.zip | Cafe-table | Resolve from source metadata/archive | Furniture/Tables/Cafe | Cafe | In SH3F metadata | OBJ/MTL | No | Low-poly target | CC-BY-3.0 | B | Yes | Kator Legaz | 2 | existing-planIcon if present, else generated-silhouette | harvest |
| Sweet Home 3D | 3DModels-KatorLegaz-1.9.3.zip | Folding-table | Resolve from source metadata/archive | Furniture/Tables/Utility | Utility | In SH3F metadata | OBJ/MTL | No | Low-poly target | CC-BY-3.0 | B | Yes | Kator Legaz | 2 | existing-planIcon if present, else generated-silhouette | harvest |


### Wave 1 execution order

#### 1. Poly Haven first

These are already closest to the desired target:

```text
source model
→ choose low-resolution source derivative
→ glTF validation
→ preserve metadata
→ pivot/ground check
→ KTX2
→ Meshopt
→ generated Plan silhouette/OBB
→ thumbnail
→ registry
```

Most should score **0–1/5** ingestion effort.

#### 2. Kenney second

Kenney is extremely cheap geometrically, but treat package units as untrusted until measured. Community evidence suggests this kit is often imported at roughly half expected physical scale in engines, so resolve the scale **once at pack level**, not asset by asset. Preserve the official archive hash and CC0 page snapshot.

Kenney's existing top-down images should be retained as **test-oracle media**, not serialized as canonical Plan truth.

#### 3. Sweet Home 3D Kator subset third

These are intentionally included even with attribution because they test whether the registry can correctly handle **B-grade rights** from day one.

```text
SH3F
→ parse dimensions/creator/license/planIcon
→ OBJ/MTL
→ GLB
→ cm → m
→ map source orientation
→ ground pivot
→ optimize texture
→ compare generated PlanProxy against planIcon
→ attach attribution
```

Most are **2/5** effort.

### Wave 1 automatic/manual estimate

| Source | Automatic | Manual review |
|---|---:|---|
| Poly Haven | ~95% | aesthetic curation + pivot sanity |
| Kenney | ~95% after pack-scale rule | one pack-scale/orientation calibration + visual curation |
| Sweet Home 3D | ~85–90% | rights/author verification + conversion QA + proxy comparison |

The first implementation cycle should therefore validate the pipeline on **different source classes**, not only one perfectly clean GLB source.



## Wave 2 — broader coverage

Wave 2 should add roughly **40–70 more assets**, drawn from:

1. `3DModels-BlendSwap-CC-0-1.9.3.zip` — select 15–25 useful furniture/lighting/plant assets after generating the archive inventory.
2. `3DModels-Scopia-1.9.3.zip` — select 10–20 higher-quality CC-BY items; attribution automation must already be working.
3. Quaternius `Furniture Pack` + `Ultimate Furniture Pack` — select 10–20 non-duplicate props after exact archive member inventory.
4. Kenney Nature Kit — only lightweight plants/planters appropriate for indoor scenes.
5. Poly Haven — add `wooden_display_shelves_01`, `modern_wooden_cabinet`, `drawer_cabinet`, `gothic_cabinet_01`, `wooden_stool_01`, `metal_stool_01`, and a small plant only after a foliage budget exists.
6. FreeCAD Living-room parts — only when a specific FCStd object adds useful coverage and attribution is worth conversion cost.

Do not use Wave 2 to add dozens of near-identical chairs.

### Coverage gaps to fill in Wave 2

```text
Lighting
  4–6 floor/table fixtures
  4–6 wall fixtures
  3–4 pendants

Plants
  6–8 lightweight indoor plants

Storage
  3–5 additional cabinets/shelves

Desks / consoles
  4–6

Decor / signage
  6–10
```

Built-in `PointLight`, `SpotLight`, `DirectionalLight`, etc. remain semantic Scene entities. Decorative fixture meshes may reference or own lights later; do not encode illumination solely into an imported lamp GLB.


## Wave 3 — hero / specialty objects

Smithsonian objects belong here: high exhibition value, higher mesh/texture cleanup cost, and stricter per-media rights inspection.

| Smithsonian ID | Title | Type | Rights accepted | Wave | Effort |
|---|---|---|---|---|---|
| 2632d078-a354-412c-825e-e70d2f546793 | Armchair with slip seat | Furniture | CC0/Public Domain media | Wave 3 | 2–3 |
| ff607e3c-3d88-4422-a246-3976aa4839dc | Side Chair | Furniture, 1750–60 | CC0 | Wave 3 | 2–3 |
| 57d30b85-3549-40dc-99c3-255249867462 | Side Chair | Ornate chair, ca. 1785 | CC0 | Wave 3 | 2–3 |
| 8edffe56-c358-4c3a-a61f-019f615ccef0 | Model of the Greek Slave | Plaster sculpture | CC0 | Wave 3 | 3 |
| 0dc68216-3651-44c7-99cf-18e5d4d1eb9f | Kneeling winged monster | Limestone sculpture | CC0 | Wave 3 | 3 |
| 082c87e9-1fe0-4772-b4c6-fe6d59bd6e74 | Old Arrow Maker | Marble figure group | CC0 | Wave 3 | 3 |
| ff28cb3a-ad00-43b3-a928-fa61ab0a288f | George Washington | Plaster bust | CC0 | Wave 3 | 2–3 |
| 2b4a081a-9ea1-4b0c-b1c3-6f5389da3244 | Abraham Lincoln | Plaster portrait object | CC0 | Wave 3 | 2–3 |
| 476ad7f6-6add-448d-af7f-9f2ca9ba9cb6 | Gathering of Buddhas and Bodhisattvas | Large limestone relief | CC0 | Wave 3 / wall-only | 3 |
| d8c62f94-4ebc-11ea-b77f-2e728ce88125 | Ritual wine container (fangyi) | Bronze vessel | CC0; low-res GLB/OBJ previously verified | Wave 3 | 2 |

For each Smithsonian candidate, acquisition must verify the downloadable 3D-media entry itself before copying bytes. A CC0 metadata record is not enough. Keep suggested Smithsonian attribution even where CC0 does not legally require it, but distinguish `suggestedAttribution` from `requiredAttribution`.

**Explicit reject example:** `Uneasy Lies the Head that Wears the Crown (Prototype)` is not acceptable for the bundled standard library because its actual object/media rights are restricted despite broader Open Access metadata around the record.


## D. Material starter manifest

| Provider | Asset ID | Class | Physical scale | Maps | Recommended resolution | KTX2 strategy | Use | License | Role |
|---|---|---|---|---|---|---|---|---|---|
| Poly Haven | white_plaster_02 | Wall / plaster | 1 m | AO/ARM/Bump/Diffuse/Displacement/Normal/Rough/Spec | 1K default; 2K quality | ETC1S base color; UASTC normal/ARM | Clean gallery wall | CC0 | Core |
| Poly Haven | white_plaster_rough_01 | Wall / plaster | 1 m | Full PBR | 1K | KTX2 | Aged plaster variant | CC0 | Variant |
| Poly Haven | white_rough_plaster | Wall / plaster | 1 m | Full PBR | 1K | KTX2 | Rough/damaged plaster | CC0 | Variant |
| ambientCG | Plaster001 | Wall / plaster | provider metadata | PBR set | 1K | KTX2 | Neutral plaster alternative | CC0 | Complement |
| ambientCG | Plaster002 | Wall / plaster | provider metadata | PBR set | 1K | KTX2 | Secondary plaster | CC0 | Complement |
| ambientCG | Plaster003 | Wall / plaster | provider metadata | PBR set | 1K | KTX2 | Textured plaster | CC0 | Complement |
| Poly Haven | concrete | Concrete wall | 4 m | AO/ARM/Bump/Diffuse/Disp/Normal/Rough/Spec | 1K/2K | KTX2 | Board-form/panel wall | CC0 | Core |
| Poly Haven | rough_concrete | Concrete wall | 1.2 m | AO/ARM/Diffuse/Disp/Normal/Rough | 1K | KTX2 | Clean coarse concrete | CC0 | Core |
| Poly Haven | smooth_concrete_floor | Concrete floor | 2 m | Full PBR | 1K/2K | KTX2 | Interior worn concrete | CC0 | Core |
| Poly Haven | brushed_concrete | Concrete floor | 2.5 m | Full PBR | 1K | KTX2 | Brushed/worn floor | CC0 | Variant |
| Poly Haven | concrete_layers | Concrete wall | 1.5 m | Full PBR | 1K | KTX2 | Weathered layered wall | CC0 | Variant |
| Poly Haven | wood_floor | Wood flooring | 1.7 m | Full PBR + glTF/MaterialX | 1K/2K | KTX2 | General wood floor | CC0 | Core |
| Poly Haven | oak_wood_planks | Wood flooring | 1.2 m | Full PBR | 1K/2K | KTX2 | Oak floor/planks | CC0 | Core |
| Poly Haven | old_wood_floor | Wood flooring | 3 m | Full PBR | 1K | KTX2 | Aged/historic floor | CC0 | Variant |
| Poly Haven | wood_floor_worn | Wood flooring | 2 m | Full PBR | 1K | KTX2 | Worn pine floor | CC0 | Variant |
| Poly Haven | diagonal_parquet | Wood flooring | provider physical scale | Full PBR | 1K/2K | KTX2 | Gallery/residential parquet | CC0 | Feature |
| ambientCG | WoodFloor064 | Wood flooring | provider metadata | PBR set | 1K/2K | KTX2 | Natural oak complement | CC0 | Complement |
| Poly Haven | oak_veneer_01 | Wood furniture | 1.8 m | Full PBR | 1K/2K | KTX2 | Oak furniture panels | CC0 | Core |
| Poly Haven | white_oak_veneer | Wood furniture | 0.5 m | Full PBR | 1K/2K | KTX2 | Light modern oak | CC0 | Core |
| Poly Haven | teak_veneer | Wood furniture | provider scale | Full PBR | 1K/2K | KTX2 | Warm teak furniture | CC0 | Core |
| Poly Haven | sapele_veneer | Wood furniture | provider scale | Full PBR | 1K/2K | KTX2 | Dark/red furniture wood | CC0 | Variant |
| Poly Haven | plywood | Wood furniture | provider scale | Full PBR | 1K | KTX2 | Utility/display construction | CC0 | Core |
| ambientCG | WoodFloor043 | Wood furniture/floor | provider metadata | PBR set | 1K | KTX2 | Walnut complement | CC0 | Complement |
| Poly Haven | stone_tiles_02 | Stone | 2 m | Full PBR | 1K/2K | KTX2 | General stone tile | CC0 | Core |
| Poly Haven | granite_tile | Stone | 2.3 m | Full PBR | 1K/2K | KTX2 | Granite | CC0 | Core |
| Poly Haven | marble_tiles | Stone | 2 m | Full PBR | 1K/2K | KTX2 | Marble floor | CC0 | Core |
| ambientCG | Marble012 | Stone | provider metadata | PBR set | 1K/2K | KTX2 | Carrara marble | CC0 | Complement |
| ambientCG | Marble016 | Stone | provider metadata | PBR set | 1K/2K | KTX2 | Calacatta marble | CC0 | Complement |
| Poly Haven | interior_tiles | Tile | provider scale | Full PBR | 1K/2K | KTX2 | Neutral ceramic interior tile | CC0 | Core |
| Poly Haven | terrazzo_tiles | Tile | 2 m | Full PBR | 1K/2K | KTX2 | Terrazzo floor | CC0 | Core |
| Poly Haven | floor_tiles_02 | Tile | provider scale | Full PBR | 1K/2K | KTX2 | Marble tile variant | CC0 | Variant |
| Poly Haven | concrete_tiles | Tile / paving | 1.9 m | Full PBR | 1K | KTX2 | Concrete tile / utility | CC0 | Variant |
| Poly Haven | rough_linen | Fabric | provider scale | Full textile maps | 1K/2K | KTX2 | Upholstery/curtain linen | CC0 | Core |
| Poly Haven | fabric_leather_01 | Leather | 0.4 m | Full PBR | 1K/2K | KTX2 | Aged leather upholstery | CC0 | Core |
| Poly Haven | fabric_pattern_05 | Fabric | 0.5 m | Full PBR | 1K | KTX2 | Patterned cotton accent | CC0 | Variant |
| ambientCG | Fabric061 | Fabric | provider metadata | PBR set | 1K | KTX2 | Natural linen complement | CC0 | Complement |
| ambientCG | Leather037 | Leather | provider metadata | PBR set | 1K | KTX2 | Clean black leather | CC0 | Complement |
| Poly Haven | book_pattern | Canvas / paper | provider scale | PBR | 1K | KTX2 | Woven book-cover / canvas-like surface | CC0 | Core |
| ambientCG | Paper001 | Canvas / paper | provider metadata | PBR set | 1K | KTX2 | Paper | CC0 | Core |
| ambientCG | Paper002 | Canvas / paper | provider metadata | PBR set | 1K | KTX2 | Paper variant | CC0 | Variant |
| Poly Haven | metal_plate | Metal | 0.5 m | Metallic PBR | 1K | KTX2 | Worn diamond plate | CC0 | Specialty |
| Poly Haven | blue_metal_plate | Metal | 2.5 m | Metallic PBR | 1K | KTX2 | Painted steel specialty | CC0 | Specialty |

### Material policy

The standard library should ship roughly **40 named material definitions**, but not necessarily 40 full original texture downloads. Store only the web derivatives needed by the editor/runtime.

Default policy:

```text
Base color:
  ETC1S where visual quality is acceptable

Normal:
  UASTC

Occlusion / roughness / metallic:
  UASTC or packed ORM texture

Height/displacement:
  keep only when editor/runtime actually uses it

Default resolution:
  1K

Quality derivative:
  2K

4K+:
  optional hero/project import, not standard runtime default
```

For plain glass, clean painted metal, clean plastic, matte white, black, and simple metallic colors, use **procedural PBR presets** instead of downloaded texture sets.


## E. HDRI starter set

| Asset ID | Role | Source resolution | Dynamic range / character | License | Editor derivative | Published derivative |
|---|---|---|---|---|---|---|
| studio_small_08 | Neutral studio | 16K source | ~17 EV | CC0 | 512–1024px EXR/DWAB or PMREM | 1K–2K HDR/EXR or baked PMREM |
| white_studio_06 | Bright clean studio | 20K source | ~12 EV | CC0 | 512–1024px | 1K–2K |
| poly_haven_studio | Mixed office/studio | 24K source | ~12 EV | CC0 | 512–1024px | 1K–2K |
| entrance_hall | Warm interior | 16K source | ~15 EV | CC0 | 512–1024px | 1K–2K |
| events_hall_interior | Gallery/event hall neutral | 20K source | ~12 EV | CC0 | 512–1024px | 1K–2K |
| urban_courtyard_02 | Overcast urban daylight | 16K source | Soft overcast | CC0 | 512–1024px | 1K–2K |
| nqweba_dawn | Nature / cool dawn | 24K source | ~12 EV | CC0 | 512–1024px | 1K–2K |
| twilight_sunset | Warm urban dusk | 20K source | ~12 EV | CC0 | 512–1024px | 1K–2K |
| studio_small_04 | Dramatic high-contrast studio | 16K source | ~12 EV | CC0 | 512–1024px | 1K–2K |

All selected HDRIs are Poly Haven CC0 assets. The original 16K–24K files are **source masters**, not runtime defaults.

Recommended pipeline:

```text
source HDR/EXR
→ retain source metadata/hash
→ 512–1024 preview environment for editor
→ 1K/2K publication derivative
→ prefiltered PMREM/cache where runtime architecture supports it
```

The tiny-HDRI pattern in `pmndrs/assets` is a good editor-preview reference: it converts HDR to compressed EXR and resizes to 512×512. Do not copy its exact base64-JS packaging for Museum Editor's larger registry.


## F. PlanProxy benchmark set

| Fixture | Shape class | Existing 2D oracle | Why it matters | Expected Museum Editor proxy |
|---|---|---|---|---|
| Kenney chair.glb | Four-leg chair | Kenney Furniture Kit top-down render family | Tests thin legs and seat/back collapse | generated silhouette compared with authored raster oracle |
| Kenney loungeDesignChair.glb | Armchair/lounge | Kenney top-down render | Tests arm geometry and irregular seat outline | generated silhouette |
| Kenney table.glb | Rectangular table | Kenney top-down render | Tests tabletop vs thin-leg contact geometry | generated silhouette |
| Poly Haven round_wooden_table_01 | Round table | None known | Tests circular top and pedestal/legs | generated silhouette |
| Poly Haven Shelf_01 | Shelf | None known | Tests thin long rectangular footprint | generated OBB then silhouette |
| Kenney loungeSofa.glb | Sofa | Kenney top-down render | Tests large soft rectangular outline | generated silhouette |
| Poly Haven potted_plant_01 | Plant / heavy foliage | None known | Tests whether proxy should use pot/base rather than canopy | semantic proxy likely |
| Sweet Home 3D planIcon fixture | Floor lamp / small-base object | SH3F planIcon where present | Tests semantic icon vs tiny contact geometry | existing authored proxy as oracle |
| Smithsonian Kneeling winged monster | Irregular sculpture | No authored plan proxy | Tests concave irregular sculpture | generated silhouette |
| primitive-assets-library Stairs | Stairs | Parametric source | Tests why stairs should not be generic mesh silhouette | semantic Layout proxy |
| Smithsonian Gathering of Buddhas and Bodhisattvas | Wall-mounted relief | No floor proxy | Tests omission of wall-mounted asset from floor hit set | not Plan eligible |
| Hanging-light fixture from future Wave 2 | Ceiling/hanging object | No fixture pinned in this pass | Tests deliberate absence of floor footprint | not Plan eligible |

### Sweet Home 3D as PlanProxy oracle

A verified SH3F catalogue entry can look conceptually like:

```properties
id#1=...
name#1=...
category#1=...
icon#1=/...
planIcon#1=/...
model#1=/...
width#1=...
depth#1=...
height#1=...
creator#1=...
```

Newer libraries may add richer fields including license and shelf/storage metadata.

Recommended benchmark harness:

```text
SH3F model + dimensions + optional planIcon
                ↓
         source-normalize mesh
                ↓
        generate candidate proxy
          ├─ OBB
          ├─ silhouette
          └─ semantic fallback
                ↓
     compare against planIcon bounds
                ↓
       human quality classification
```

Do **not** write `planIcon.png` into project truth. It is source/fixture media. The resulting reusable asset definition should contain renderer-neutral Plan geometry or a semantic proxy descriptor, from which Svelte/SVG derives presentation.

### Recommended generated proxy tiers

```text
Tier 1: generated OBB
  cabinet, shelf, simple bench

Tier 2: generated projected silhouette
  chair, table, sofa, sculpture

Tier 3: semantic proxy
  stairs, floor lamp, plant, special fixtures

None:
  wall art, ceiling/hanging objects when floor footprint would mislead
```


## G. Procedural-reference manifest

| Component | Project | Exact file/module | Algorithm / metadata | License | Reuse code? | Museum Editor destination |
|---|---|---|---|---|---|---|
| Stairs | primitive-assets-library | assets/primitives.blend (Stairs Geometry Nodes asset) | Parameterized width/depth/height/steps; repeat-zone style step generation | CC0 | Study/reuse assets possible | Reimplement as LayoutDocument semantic stair primitive |
| Stairs | blackears/blenderStairs | src/ + staircase addon/operator modules; makeDeploy.py | Straight/curved stair mesh generation from user parameters | Apache-2.0 | Code reuse legally possible | Prefer TypeScript/geometry-compiler reimplementation |
| Doors / windows | FreeCAD Parts Library | Architectural Parts/Doors; Architectural Parts/Doors_Windows | Parametric openings/window presets, dimensions and shape-driven geometry | CC-BY-3.0 assets | Do not copy FCStd as runtime architecture | Study parameters; implement in LayoutDocument |
| Doors / windows | Sweet Home 3D SH3F schema | PluginFurnitureCatalog.properties door/window fields | Wall thickness/cutout/sash swing semantic metadata | Per-library asset license | Schema reference only | Use semantic opening fields in LayoutDocument |
| Rails / terraces / stairs | Blender Geometry Node French Houses | GeometryNodesFrenchHous.blend | Foundation/profile-driven procedural architecture and reusable GN groups | MIT | Study algorithm; Blend file reusable under MIT | Reimplement needed subsets in single layout compiler |
| Shelves / cabinets | Sweet Home 3D SH3F schema | shelfElevations, shelfBoxes, dropOnTopElevation | Storage surfaces and drop zones encoded semantically | Schema/code reference | Study | Scene procedural asset / placement metadata |
| Display case / plinth | Museum Editor native | No external implementation selected | Box/profile dimensions, glass/frame/plinth parameters | First-party | Build directly | Scene procedural asset generator, not Layout architecture |
| Frames | Museum Editor native | No external implementation selected | Width/height/depth/border profile; media plane child | First-party | Build directly | Scene procedural asset generator |
| Lighting tracks | Museum Editor native | No external implementation selected | Rail path + repeated fixtures + light instances | First-party | Build directly | Scene procedural system; architecture only supplies mounting context |

### Architecture boundary

The following should normally **not** enter the Scene asset library as primary authoring objects:

```text
wall
room
opening
door
window
stairs
structural column
architectural partition
architectural frame
```

A source repository may still provide useful visual reference or parameter vocabulary.

The correct destination remains:

```text
LayoutDocument semantic primitive
        ↓
single compileLayoutGeometry() path
        ↓
Plan + 3D
```

By contrast, these are good Scene procedural generators:

```text
plinth
pedestal
display case
picture frame
shelf/cabinet family
lighting track + fixture arrangement
```

They remain reusable asset definitions or Scene-generation operations, not Layout architecture unless a later ownership decision explicitly says otherwise.


## H. Pipeline-reference manifest

| Need | Repository | Exact module/file | What to adapt |
|---|---|---|---|
| glTF validation | Khronos glTF Validator | Validator CLI/library | Hard validation + stats before registry promotion |
| Deduplicate data | glTF Transform | packages/functions/src/dedup.ts | Deduplicate accessors/meshes/textures/materials/skins; preserve meaningful unique names |
| Texture resize/compress | glTF Transform | packages/functions/src/texture-compress.ts | Resize/convert textures; choose normal-map-safe settings |
| Mesh quantization | glTF Transform | packages/functions/src/quantize.ts | KHR_mesh_quantization with explicit precision policy |
| Vertex welding | glTF Transform | packages/functions/src/weld.ts | Weld identical vertices before/around simplification when safe |
| GPU instancing | glTF Transform | packages/functions/src/instance.ts | Convert repeated static meshes to EXT_mesh_gpu_instancing where appropriate |
| KTX2 | glTF Transform CLI | packages/cli/src/cli.ts | UASTC for normal/ORM; ETC1S-style path for color textures |
| Mesh compression / simplification | meshoptimizer/gltfpack | gltfpack CLI | Use -cc; add -tc for KTX2; preserve names/materials/extras with -kn -km -ke; use -si only after visual budget check |
| Batch Blender import | Objaverse-XL | scripts/rendering/blender_script.py | Importer map, scene reset, mesh stats, bounds, linked-file and missing-texture detection, robust failures |
| Deterministic previews | Objaverse-XL | scripts/rendering/blender_script.py | Standardized framing/render metadata; adapt but preserve real-world scale rather than unit-box normalization |
| Browser asset packaging | pmndrs/assets | Makefile + src/ tree | Source→dist processing pattern, dynamic package exports; adapt without base64-embedding large Museum Editor assets |
| Provenance manifests | Museum Editor adaptation | new ingestion manifest | Content hash + source URL + immutable rights evidence + acquiredAt + author + transforms + derivative hashes |

### `pmndrs/assets` exact pattern

The current repository has:

```text
src/
  fonts/
  hdri/
  matcaps/
  models/
  normals/
  textures/

Makefile
bin/
package.json
```

At inspection time `/src/models` contains only:

```text
bunny.glb   ~136 KB
pmndrs.glb  ~184 KB
suzi.glb    ~355 KB
```

So this is **not** a furniture harvest source.

Its Makefile pattern is the valuable part:

```text
HDR  → resized compressed EXR
PNG/JPG/WebP → 512 WebP
JSON → minified JSON
GLB → gltf-transform optimize
glTF → GLB
processed payload → package export
```

Museum Editor adaptation:

```text
source asset
→ immutable source record
→ normalized file in object storage / project asset store
→ manifest entry
→ lazy URL fetch
```

Do not base64-embed normal Museum Editor GLBs into JavaScript modules.

### glTF Transform operations to adopt

Primary repository: [https://github.com/donmccurdy/glTF-Transform](https://github.com/donmccurdy/glTF-Transform)

Use at least:

```text
dedup
prune
weld where safe
quantize
textureCompress / resize
KTX2 CLI path
meshopt/draco extension support
instance only for repeated static meshes
```

Important exact modules already inspected:

```text
packages/functions/src/dedup.ts
packages/functions/src/texture-compress.ts
packages/functions/src/quantize.ts
packages/functions/src/weld.ts
packages/functions/src/instance.ts
packages/cli/src/cli.ts
```

### `gltfpack` baseline

Repository: [https://github.com/zeux/meshoptimizer](https://github.com/zeux/meshoptimizer)

Recommended conservative editor-asset baseline:

```bash
gltfpack   -i input.glb   -o output.glb   -cc   -tc   -kn   -km   -ke
```

Meaning:

```text
-cc  EXT_meshopt_compression
-tc  texture conversion to KTX2
-kn  keep named nodes/meshes
-km  keep named materials
-ke  keep extras
```

Then add simplification only after category-specific visual QA:

```bash
-si <ratio>
```

Do not maximize stripping. Node names, material names, animation names, and `extras` may become future semantic/interaction anchors.

### Objaverse script lesson

Adapt:

```text
multi-format Blender importer map
scene reset
polygon/vertex/material/object/animation counts
bounds
linked-file inspection
missing-texture detection
deterministic preview camera/render
explicit exception/error output
```

Do **not** adopt its “normalize everything to unit box” behavior. Museum Editor needs physical dimensions to survive ingestion.


## I. Reject / connector-only list

| Source | Class | Reason |
|---|---|---|
| ShapeNet | D | Noncommercial/research-oriented dataset rights; not a bundled commercial library source. |
| 3D-FRONT / 3D-FUTURE | D | Research-focused licensing; useful layout research only. |
| HM3D / Matterport | D | Academic/noncommercial terms. |
| Sketchfab bulk mirror | D for bundle / B connector | Per-item licensing and platform terms; use user-driven connector/import with rights capture instead. |
| BlenderKit / Blendkit mirror | D for bundle / B connector | Commercial use can be allowed while standalone asset redistribution remains restricted. |
| ShareTextures bulk harvest | D | Asset license claims do not remove site/API/bulk/plugin restrictions; do not scrape/mirror. |
| Poly Pizza bulk harvest | D for mirror | Per-asset/platform terms and anti-scraping concerns; connector/import only if compliant. |
| Sweet Home 3D third-party 3D Warehouse-derived assets | D | Sweet Home 3D rights page explicitly warns third-party source terms can prohibit aggregation. |
| Smithsonian: Uneasy Lies the Head that Wears the Crown (Prototype) | D | Record metadata may be CC0, but actual object/media is third-party copyrighted and 3D scan use is restricted/noncommercial. |
| Amazon Berkeley Objects | C | Conflicting public license evidence historically surfaced; do not bundle until exact downloaded snapshot license is resolved. |
| pmndrs/market raw assets | C | MIT app license does not by itself prove rights of every raw CDN/database asset; current raw asset backend was not fully inspectable in this pass. |
| Khronos sample assets with testing-only licenses | D | Some test assets explicitly forbid deployment in commercial apps; inspect every model README/LICENSE. |
| Poly Haven potted_plant_01 / potted_plant_02 in Wave 1 | A rights / defer | CC0 but extremely heavy geometry/textures; defer until LOD/foliage policy exists. |
| FreeCAD static door/window models as Scene assets | Reject by architecture | Rights are usable with attribution, but these belong as semantic Layout entities/openings, not Scene-library clutter. |


## Metadata harvesting priority

| Source | Richness | Preserve automatically |
|---|---:|---|
| Sweet Home 3D | **5/5** | dimensions, elevation, model rotation, creator, license, category, icon/planIcon, resizable/deformable/texturable, shelf/drop metadata |
| Poly Haven | **5/5** | asset ID, taxonomy, tags, dimensions, polycount, texel density, authors, file hashes/sizes/dependencies |
| Smithsonian | **5/5** | object ID, title, culture/date/materials, physical dimensions, rights, media rights, source institution |
| ambientCG | **4/5** | asset ID, category/tags, physical dimensions where present, map types, resolution/download metadata |
| FreeCAD Parts Library | **4/5** | filename/category, dimensions/parameters inside FCStd, author via git/file metadata, CC-BY rights |
| Kenney | **2/5** | pack provenance + filename/category inference; most semantic metadata must be generated |
| Quaternius | **2/5** | pack/version/license + filenames after unpack; manual taxonomy mapping |
| pmndrs/assets | **2/5** | simple filenames/package structure; mainly pipeline reference |

### Museum Editor taxonomy

Keep it compact:

```text
Furniture
  Seating
    Chair
    Stool
    Bench
    Lounge
    Sofa
  Tables
    Dining
    Side
    Coffee
    Console
    Desk
  Storage
    Shelf
    Cabinet
    Drawer
  Display
    Pedestal
    Case

Lighting
  Floor
  Table
  Wall
  Pendant

Decor
  Plants
  Sculpture
  Vessel
  Props
  Signage

Equipment
  Electronics
```

`Architectural reference` may exist as an ingestion/research tag, but walls/doors/windows/stairs should not be normal Scene-asset browse categories when their canonical authoring representation is `LayoutDocument`.

Source taxonomy mapping should be automatic where obvious, but use a small explicit mapping table rather than preserving dozens of provider-specific category names.



# Implementation cycle recommendation

## Cycle outcome

One focused cycle should produce:

```text
32 Wave-1 Scene assets
~40 normalized material presets
9 HDRIs
12 PlanProxy benchmark fixtures
source/license evidence records
repeatable import CLI/job
asset thumbnails
first semantic taxonomy
```

### Suggested implementation tasks

#### P-A1 — provenance manifest

Before importing actual library content:

```ts
type RightsEvidence = {
  sourceUrl: string;
  sourceProvider: string;
  assetOrPackId: string;
  licenseId: string;
  licenseUrl?: string;
  author?: string[];
  commercialUse: boolean | 'unknown';
  derivatives: boolean | 'unknown';
  redistribution: boolean | 'unknown';
  attributionRequired: boolean | 'unknown';
  attributionText?: string;
  termsUrl?: string;
  acquiredAt: string;
  sourceHash?: string;
  evidenceSnapshotHash?: string;
};
```

Unknown rights block promotion into `Approved`.

#### P-A2 — acquisition source adapter

Start with:

```text
polyhaven
local-archive
sweet-home-3d-sh3f
```

Kenney and Quaternius can initially use `local-archive` with explicit provenance manifests.

#### P-A3 — normalize model

```text
input
→ glTF validator
→ convert GLB
→ meter units
→ +Y up
→ canonical forward metadata
→ floor grounding / semantic pivot
→ preserve names + extras
→ texture budget
→ Meshopt
→ bounds/stats
→ output hash
```

#### P-A4 — PlanProxy

```text
if authored semantic proxy
  use semantic proxy
else if clean box-like shape
  OBB
else
  projected silhouette
```

Use the Kenney and SH3D oracle corpus to measure quality.

#### P-A5 — material/HDRI derivatives

Do not place 8K/16K masters in visitor builds.

#### P-A6 — curator gate

Each candidate becomes:

```text
Testing
→ automated checks
→ visual check
→ license check
→ Approved
```

This matches the existing editor asset curation model instead of inventing another status system.

---

# Exact answer: what should be harvested first?

If work starts tomorrow, acquire these in this order:

```text
1. Poly Haven
   ArmChair_01
   gallinera_chair
   folding_wooden_stool
   painted_wooden_stool
   Sofa_01
   painted_wooden_table
   round_wooden_table_01
   wooden_table_02
   side_table_01
   Shelf_01
   steel_frame_shelves_01
   painted_wooden_cabinet

2. Kenney Furniture Kit official archive
   chair.glb
   loungeChair.glb
   loungeDesignChair.glb
   loungeSofa.glb
   loungeDesignSofa.glb
   table.glb
   sideTable.glb
   cabinetBedDrawer.glb
   bathroomCabinet.glb

3. Sweet Home 3D Kator Legaz 1.9.3
   Futon-couch
   Mid-century-bench-sofa
   Mid-century-sofa
   Mid-century-chair
   Chair-ottoman
   Bar-stool
   Dining-chair
   Bench
   Cafe-chair
   Cafe-table
   Folding-table
```

This yields **32 immediate candidates** from three intentionally different ingestion profiles:

```text
Poly Haven
  realistic, PBR, rich metadata, web-friendly source

Kenney
  CC0, tiny, stylized, 3D + top-view benchmark

Sweet Home 3D
  semantic dimensions + plan metadata + attribution-aware legacy OBJ pipeline
```

Then add Quaternius and the Sweet Home 3D CC0 BlendSwap library only **after the archive inventory tool exists**, because this report does not invent member filenames that were not directly inspectable.

Do not count procedural architecture in the 32. Doors, windows, stairs, partitions, architectural columns, etc. should be evaluated as `LayoutDocument` semantic primitives or references, not used to inflate the Scene asset count.

The key Phase-2 result is therefore not “download thousands of files.” It is:

```text
three source adapters
+ one rights gate
+ one normalization pipeline
+ one PlanProxy benchmark
+ 32 high-leverage first objects
+ coherent materials/HDRIs
```

That is enough to begin implementation without another broad discovery pass.

---

# Source index

Primary/high-authority sources used heavily in this report:

- Poly Haven API: https://polyhaven.com/our-api
- Poly Haven Public API repo: https://github.com/Poly-Haven/Public-API
- Poly Haven assets: https://polyhaven.com/
- Sweet Home 3D model import/libraries: https://www.sweethome3d.com/importModels.jsp
- Sweet Home 3D SourceForge model archives: https://sourceforge.net/projects/sweethome3d/files/SweetHome3D-models/
- Sweet Home 3D rights/legal: https://www.sweethome3d.com/legal.jsp
- Kenney Furniture Kit: https://kenney.nl/assets/furniture-kit
- ambientCG: https://ambientcg.com/
- FreeCAD Parts Library: https://github.com/FreeCAD/FreeCAD-library
- FreeCAD asset license: https://github.com/FreeCAD/FreeCAD-library/blob/master/LICENSE-Assets
- Smithsonian Open Access: https://www.si.edu/openaccess
- Smithsonian 3D: https://3d.si.edu/
- Quaternius Furniture Pack: https://quaternius.com/packs/furniture.html
- Quaternius Ultimate Furniture Pack: https://quaternius.com/packs/ultimatefurniture.html
- Quaternius Ultimate House Interior Pack: https://quaternius.com/packs/ultimatehomeinterior.html
- pmndrs/assets: https://github.com/pmndrs/assets
- pmndrs/market: https://github.com/pmndrs/market
- glTF Transform: https://github.com/donmccurdy/glTF-Transform
- meshoptimizer/gltfpack: https://github.com/zeux/meshoptimizer
- Khronos glTF Sample Assets: https://github.com/KhronosGroup/glTF-Sample-Assets
- Objaverse-XL processing code: https://github.com/allenai/objaverse-xl
- Primitive Assets Library: https://github.com/pesaksintondji/primitive-assets-library
- Blender Geometry Node French Houses: https://github.com/IRCSS/Blender-Geometry-Node-French-Houses
- Blender Stairs: https://github.com/blackears/blenderStairs

## Material source pages

Poly Haven material IDs use:

```text
https://polyhaven.com/a/<asset-id>
```

ambientCG IDs use the provider's asset/view endpoint and should be resolved through the current catalogue/API at acquisition time.

## Caveats / unresolved exactness

1. Current Sweet Home 3D 1.9.3 SH3F archive member filenames were not directly enumerable in this research session. Pack names, counts, licenses, schema, and catalogue asset names were verified; generate the member inventory after download instead of guessing.
2. Kenney exact GLB filenames were cross-checked through repositories that mirror the official pack. Acquisition authority remains the official Kenney archive.
3. Poly Haven current web/API documentation says commercial live API access is permitted, but retain a dated terms snapshot because older repository ToS text has historically lagged policy changes.
4. Smithsonian rights must be evaluated at the **3D media** level for every item; metadata-level Open Access status alone is insufficient.
5. Khronos sample asset licenses are per-model. Never bulk-copy the `Models/` tree.
6. Repository branches listed as “repository default branch” were not independently pinned by the retrieval response. Pin a commit SHA during implementation and record it in provenance.
