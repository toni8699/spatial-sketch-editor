Yes. Research point to one strong path: **do not build giant asset dump. Build normalization + provenance + semantic asset layer. Then feed it from clean open sources, procedural primitives, external connectors, and AI generation.**That layer become leverage.

Your current architecture already give right base: reusable assets stay separate from placed instances, `LayoutDocument` stays architecture truth, `SceneDocument` stays scene-object truth, Plan derives representation instead of owning separate geometry, and AI must go through same semantic project systems. architecture.mdMD Shell-scene-workspaces.mdMD north-star.mdMD

# A. Executive summary

### 1. Best bootstrap source not one giant dataset

Me recommend four source classes:

**Tier 1 — bundle freely**

- Poly Haven
- ambientCG
- Kenney
- carefully selected Smithsonian Open Access
- `pmndrs/assets`
- legacy Quaternius packs only where pack itself explicitly says CC0
- some Blender demo assets where individual file license is CC0

These give cleanest legal base. Poly Haven became especially interesting in July 2026: assets remain CC0 and its API now officially permits commercial use, with provider attribution requested when using live API. 

**Tier 2 — ingest with attribution**

- Sweet Home 3D furniture libraries
- FreeCAD Parts Library
- selected CC-BY Objaverse
- Babylon sample assets
- buildingSMART community IFC samples
- selected Sketchfab CC assets

**Tier 3 — connector, not mirror**

- Sketchfab
- BlenderKit/Blendkit
- Poly Pizza
- current Quaternius QAL packs
- ShareTextures

Their usage may be fine inside projects, but asset-store redistribution or automated harvesting carries terms problems.

**Tier 4 — research only**

- ShapeNet
- 3D-FRONT / 3D-FUTURE
- HM3D / Matterport
- parts of Objaverse-XL
- other academic indoor datasets with research-only agreements.

ShapeNet explicitly restricts database use to noncommercial research/education. HM3D explicitly says academic, noncommercial. 3D-FRONT-derived distributions preserve research-only terms. 

---

### 2. Biggest hidden opportunity: Sweet Home 3D

This may be more useful to your editor than many flashy 3D datasets.

Sweet Home 3D already treats furniture as **spatial-editor assets**, not random meshes. Its model metadata includes width, depth, height, elevation, model rotation, tags, creator, resizability, texturability, shelf data, and even a dedicated `PLAN_ICON`. 

That is very close to what you need.

Do not copy its architecture wholesale. Study its **asset semantic contract**.

---

### 3. Yes, 3D → Plan footprint can mostly automate

For ordinary floor furniture, one GLB import can generate usable Plan representation automatically.

Me recommend:

```
Tier 0   explicit authored proxy
Tier 1   OBB rectangle
Tier 2   generated projected silhouette
Tier 3   curated semantic proxy
```

Browser-side geometry pieces already exist: Concaveman for concave hull, polygon-clipping for robust union/difference, Simplify.js for contour reduction, and `three-mesh-bvh` for efficient mesh spatial queries. 

**Important:** every Plan-eligible asset should have a resolved Plan proxy. It does **not** mean every proxy hand-drawn.

---

### 4. Best 2026 web-asset AI option may be Tripo P2, not highest-fidelity model

Tripo quietly changed equation in August 2026.

`P2-20260801` supports:

- 48–50k triangle limit
- 48–25k quad limit
- PBR
- controlled UV export
- optional real-world auto sizing
- Meshopt compression
- GLB workflow
- deterministic geometry/texture seeds.

That maps unusually well to browser asset production. 

For **web-editor assets**, me rank this higher than models that make prettier 2-million-face sculptures.

---

### 5. TRELLIS.2 strongest open foundation found

Microsoft TRELLIS.2 is MIT and explicitly produces high-resolution meshes with complex topology and full PBR materials. Official stack also includes CuMesh for post-processing, remeshing, decimation, and UV work. 

Official hardware target remains high. Community work in 2026 has pushed it down toward 6–11 GB VRAM, but those are unofficial modifications and slower paths. 

So:

**internal/batch generation:** strong.

**browser user presses Generate and instantly gets asset locally:** not yet normal path.

---

### 6. Hunyuan3D 2.1 poor default foundation for global product

Quality can be good. License makes it awkward.

Official Hunyuan 3D 2.1 license excludes EU, UK, and South Korea from territory. It also restricts use/display of outputs outside permitted territory and has additional conditions above one million MAU. 

For globally hosted editor: **do not make this canonical generator**.

---

### 7. AI asset generation should be fallback, not basic supply

Bad use:

> generate another generic chair every time.

Good use:

> no suitable low Victorian display cabinet exists; create one.

Curated known assets remain cheaper, deterministic, searchable, reusable, and easier to optimize.

AI fills long tail.

---

### 8. Materials much easier than models

You can bootstrap excellent material library now from clean CC0 sources.

Poly Haven, ambientCG, cgbookcase, TextureCan, 3DTextures.me, and Texture Ninja already cover most architectural materials.

This means **do not spend roadmap time building procedural marble/concrete/wood library manually** except for useful parameter variations.

---

### 9. No equally strong open ecosystem exists for Plan symbols

This is key.

There is no obvious “Poly Haven of architectural top-view SVG”.

Strong references exist:

- Sweet Home 3D `PLAN_ICON`
- easy-floorplan JSON furniture glyphs
- QCAD parts
- FreeCAD symbols
- LibreCAD resources

But ecosystem far weaker and licensing more fragmented.

Thus your own **small canonical PlanProxy schema** has more value than harvesting thousands of SVGs.

---

### 10. Do not adopt full CAD editor

Your current Plan architecture says Svelte + SVG and one renderer-neutral layout compiler. That still looks correct. Design-specs.mdMD

Add focused geometry capability:

- `@flatten-js/core`
- polygon-clipping
- Concaveman
- maybe Clipper2/WASM later
- Maker.js where useful
- `web-ifc` at import/export edge
- OpenCascade.js only when true solid CAD operations justify it.

Do not make LibreCAD/QCAD/etc become second editor kernel.

---

### 11. Procedural beats static assets for architectural families

Walls, rooms, doors, windows, stairs, shelving, cabinets, partitions, plinths, display cases, rails, frames, lighting tracks should become semantic parameters.

This matches your North Star: richer CAD capability extends `LayoutDocument` and the one layout compiler rather than introducing another modeling system. north-star.mdMD

---

### 12. Asset registry more important than asset count

A 100-model library with:

```
known dimensions
known pivot
known scale
known license
known placement
good Plan proxy
thumbnail
LOD/web budget
semantic tags
```

is much more valuable to AI than 50,000 anonymous meshes.

---

### 13. AI scene generation should output commands, not scene blob

Holodeck, ProcTHOR, CAD-Recode, DeepCAD, Text2CAD, and related work all point toward a useful idea: generation becomes more useful when output has structure, commands, objects, constraints, or scene relationships instead of only raster/mesh appearance. 

For your product:

```
prompt
→ spatial plan
→ semantic editor commands
→ deterministic validation
→ render
→ critique
→ revise
```

not:

```
prompt
→ mysterious GLB scene
```

---

### 14. License metadata must become infrastructure

Need distinguish:

```
code license
asset license
dataset license
model-weight license
generated-output terms
source-site ToS
```

They are separate.

A repo having MIT does not mean its `assets/` folder may be redistributed.

HM3D demonstrates this perfectly: research code is MIT; dataset remains noncommercial. 

---

### 15. Your moat is normalization + semantics + executable spatial authoring

Blender has much deeper creation.

You should not fight there.

Your leverage can become:

> **Give agent useful spatial vocabulary plus ready assets plus deterministic commands plus web publishing target.**

That is closer to “runtime/compiler for spatial experiences” than “small Blender”.

---

# B. Best 3D asset sources

| SourceWhat usefulLicense realityWeb readinessBundle?Automated harvestVerdict |                                                        |                                                                        |         |                                |                                  |                                              |
| ---------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- | ------- | ------------------------------ | -------------------------------- | -------------------------------------------- |
| [Poly Haven](https://polyhaven.com/?utm_source=chatgpt.com)                  | models, HDRIs, PBR                                     | CC0                                                                    | 5/5     | **Yes**                        | **Excellent API**                | **Harvest now**                              |
| ambientCG                                                                    | models + huge PBR library                              | CC0                                                                    | 4/5     | **Yes**                        | Good                             | **Harvest now**                              |
| Kenney                                                                       | furniture, buildings, environment kits                 | CC0                                                                    | 5/5     | **Yes**                        | Good                             | **Harvest now**; stylized/default low-poly   |
| Smithsonian Open Access                                                      | sculptures, heritage, decor                            | CC0 Open Access subset                                                 | 3/5     | Yes for CC0 subset             | API available                    | **Harvest curated**                          |
| `pmndrs/assets`                                                              | small web-ready model/material/HDRI set                | CC0                                                                    | **5/5** | Yes                            | Excellent/npm                    | **Harvest + study pipeline**                 |
| `pmndrs/market`                                                              | web-ready model/material collection                    | CC0 focus                                                              | 5/5     | Yes where verified             | API-oriented                     | **Worth adapting**                           |
| Sweet Home 3D model libraries                                                | furniture + spatial metadata                           | mixed free licenses; attribution may apply                             | 2–3/5   | Conditional                    | Good after SH3F parser           | **High priority inspect**                    |
| FreeCAD Parts Library                                                        | architectural, industrial, generic, parametric objects | CC-BY 3.0 content                                                      | 2/5     | Yes with attribution           | Good                             | **Worth adapting**                           |
| Khronos glTF Sample Assets                                                   | reference-quality glTF, PBR, extensions                | **per-model license**                                                  | **5/5** | Per model                      | Excellent                        | **QA/test + selective harvest**              |
| BabylonJS Assets                                                             | meshes, textures, IES, environments                    | default CC-BY 4.0 unless overridden                                    | 5/5     | Usually with attribution       | Good                             | **Worth adapting**                           |
| Blender Demo Files                                                           | rich scenes/procedural examples                        | per-file CC0/CC-BY/etc                                                 | 2/5     | Per file                       | Manual manifest                  | **Selective harvest/study**                  |
| Godot demos                                                                  | complete open demo scenes                              | code MIT; still inspect third-party assets                             | 4/5     | Conditional                    | Good                             | **Study/selective extraction**               |
| NASA 3D Resources                                                            | spacecraft, scientific/outdoor objects                 | NASA media terms                                                       | 3/5     | Conditional                    | Good                             | **Niche source**                             |
| Europeana 3D                                                                 | cultural heritage                                      | per-item rights                                                        | 2/5     | Per item                       | API/metadata strong              | **Connector/curated import**                 |
| Scan the World                                                               | sculptures/cultural meshes                             | individual CC licenses                                                 | 2/5     | Per item                       | Weak/moderate                    | **Curated sculpture source**                 |
| Sketchfab downloadable CC                                                    | enormous variety                                       | per-item CC license; OAuth download                                    | 5/5     | Only compatible CC items       | technically good; legally filter | **Connector first**                          |
| OpenGameArt                                                                  | game assets, props, environments                       | CC0/CC-BY/SA/GPL etc varies                                            | 3/5     | Per asset                      | Moderate                         | **Manual curated harvest**                   |
| Objaverse 1.0                                                                | 800k+ annotated objects                                | per-object CC metadata                                                 | 3/5     | Allowlist only                 | **Excellent**                    | **Filtered harvest / agent index**           |
| Objaverse-XL                                                                 | 10M+ objects                                           | dataset ODC-By; individual rights vary                                 | 2/5     | Allowlist only                 | Excellent                        | **Research + filtered source**               |
| Amazon Berkeley Objects                                                      | \~7,953 glTF PBR product models                        | **license sources conflict**                                           | 5/5     | **Hold**                       | Excellent                        | **Research until legal snapshot resolved**   |
| Poly Pizza                                                                   | low-poly models                                        | per-asset CC; site restricts scraping/AI harvesting                    | 5/5     | Conditional                    | **Do not scrape**                | **External import**                          |
| Quaternius legacy CC0 packs                                                  | game-ready modular models                              | older packs may explicitly CC0                                         | 5/5     | Yes if pack explicitly CC0     | Moderate                         | **Harvest license-snapshotted legacy packs** |
| Quaternius current QAL                                                       | same strong low-poly ecosystem                         | QAL restricts standalone redistribution                                | 5/5     | **No default pack**            | no                               | **External/use only**                        |
| Blendkit / BlenderKit                                                        | huge high-quality ecosystem                            | commercial use often fine; standalone resale/redistribution restricted | 3/5     | Usually **no**                 | API integration                  | **Connector later**                          |
| ShareTextures models                                                         | models + materials                                     | CC0 claim but site ToS restricts collections/automation                | 4/5     | **Not safe as harvested pack** | No                               | **Avoid automated harvest**                  |
| 3D-FRONT / 3D-FUTURE                                                         | furnished interiors + furniture                        | research/scientific-use restrictions                                   | 2/5     | **No**                         | Technically excellent            | **Research only**                            |
| ShapeNet                                                                     | huge categorized object corpus                         | noncommercial research/education                                       | 2/5     | **No**                         | Excellent                        | **Research only**                            |
| HM3D                                                                         | 1,000 scanned buildings, GLB/OBJ                       | academic noncommercial                                                 | 2/5     | **No**                         | Excellent                        | **Research only**                            |
| OpenStreetMap → OSM2World                                                    | buildings/cities procedurally derived                  | ODbL + attribution/share-alike data obligations                        | 3/5     | special treatment              | Excellent                        | **Future outdoor/building generator**        |

### ABO license conflict

This one deserve explicit warning.

Amazon's dataset landing page currently says **CC BY 4.0**. AWS Open Data registry and an Amazon Science announcement say **CC BY-NC 4.0**. 

Until actual archive `LICENSE` governing downloaded 3D model payload is pinned and legally reviewed:

**treat ABO as noncommercial/research-only.**

No guess.

---

## 13-axis scorecard

These scores are **my product assessment**, not claims made by source.

Legend:

`Q` quality · `N` quantity · `L` license clarity/friendliness · `C` commercial · `R` redistribution · `W` web-ready · `F` formats · `M`metadata · `K` consistency · `I` ingestion · `E` spatial-editor fit · `A` agent fit · `H` ecosystem health.

| SourceQNLCRWFMKIEAHAction |   |   |   |   |   |   |   |       |   |   |       |       |   |                     |
| ------------------------- | - | - | - | - | - | - | - | ----- | - | - | ----- | ----- | - | ------------------- |
| Poly Haven                | 5 | 4 | 5 | 5 | 5 | 5 | 5 | 5     | 5 | 5 | 5     | 5     | 5 | **Harvest now**     |
| ambientCG                 | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 4     | 5 | 4 | 5     | 5     | 5 | **Harvest now**     |
| Kenney                    | 4 | 4 | 5 | 5 | 5 | 5 | 5 | 4     | 5 | 5 | 5     | 5     | 5 | **Harvest now**     |
| Smithsonian               | 5 | 4 | 5 | 5 | 5 | 3 | 4 | 5     | 3 | 4 | 4     | 4     | 5 | **Harvest curated** |
| pmndrs/assets             | 3 | 2 | 5 | 5 | 5 | 5 | 5 | 3     | 5 | 5 | 4     | 4     | 4 | **Harvest now**     |
| pmndrs/market             | 4 | 3 | 5 | 5 | 5 | 5 | 5 | 4     | 4 | 5 | 4     | 5     | 3 | **Adapt**           |
| Sweet Home 3D             | 3 | 4 | 4 | 5 | 4 | 2 | 3 | **5** | 4 | 4 | **5** | **5** | 4 | **Inspect first**   |
| FreeCAD Library           | 3 | 4 | 4 | 5 | 4 | 2 | 3 | 4     | 3 | 3 | 4     | 4     | 4 | Adapt               |
| Khronos samples           | 5 | 2 | 3 | 4 | 3 | 5 | 5 | 5     | 4 | 4 | 3     | 3     | 5 | QA/selective        |
| Babylon Assets            | 3 | 3 | 4 | 5 | 4 | 5 | 5 | 3     | 3 | 4 | 3     | 3     | 4 | Adapt               |
| Blender demos             | 5 | 3 | 3 | 4 | 3 | 2 | 2 | 3     | 3 | 2 | 4     | 3     | 5 | Selective           |
| Sketchfab CC              | 4 | 5 | 2 | 3 | 2 | 5 | 5 | 5     | 2 | 3 | 5     | 5     | 5 | Connector           |
| Objaverse                 | 3 | 5 | 3 | 3 | 3 | 3 | 4 | 5     | 2 | 5 | 4     | 5     | 5 | Filter              |
| OpenGameArt               | 3 | 4 | 2 | 4 | 2 | 3 | 3 | 3     | 2 | 2 | 3     | 3     | 4 | Curate              |
| Quaternius QAL            | 4 | 4 | 2 | 5 | 1 | 5 | 5 | 4     | 5 | 3 | 5     | 5     | 5 | No bundling         |
| Blendkit                  | 5 | 5 | 2 | 5 | 1 | 3 | 4 | 5     | 3 | 2 | 5     | 5     | 5 | Connector           |
| ShareTextures             | 4 | 4 | 2 | 5 | 1 | 4 | 4 | 3     | 4 | 1 | 4     | 4     | 4 | Avoid harvesting    |
| 3D-FRONT                  | 4 | 5 | 1 | 1 | 1 | 2 | 3 | 5     | 5 | 4 | 5     | 5     | 3 | Research            |
| ShapeNet                  | 3 | 5 | 1 | 1 | 1 | 2 | 2 | 5     | 3 | 4 | 3     | 4     | 3 | Research            |
| HM3D                      | 5 | 3 | 1 | 1 | 1 | 3 | 4 | 4     | 5 | 4 | 3     | 4     | 4 | Research            |

# C. Best texture / material sources

| SourceRightsPBR / resolutionHarvest suitabilityRecommendation |                                              |                                 |                                   |                               |
| ------------------------------------------------------------- | -------------------------------------------- | ------------------------------- | --------------------------------- | ----------------------------- |
| Poly Haven                                                    | CC0                                          | excellent PBR; HDRIs            | excellent API                     | **Core source**               |
| ambientCG                                                     | CC0                                          | broad PBR, high res             | excellent                         | **Core source**               |
| cgbookcase                                                    | CC0                                          | PBR, often up to 8K             | good                              | **Core source**               |
| TextureCan                                                    | CC0                                          | PBR                             | good                              | **Core source**               |
| 3DTextures.me                                                 | CC0                                          | complete PBR sets               | good                              | **Core source**               |
| Texture Ninja                                                 | CC0                                          | large architectural texture set | moderate                          | **Core supplemental**         |
| pmndrs/assets                                                 | CC0                                          | already compressed/web-oriented | excellent                         | **Web presets / HDRI**        |
| Kenney                                                        | CC0                                          | stylized textures/materials     | good                              | Stylized themes               |
| Blender CC0 demos                                             | per-file                                     | procedural examples             | manual                            | Inspiration/selective         |
| ShareTextures                                                 | restrictive site ToS despite CC0 asset claim | good                            | **poor for automated collection** | Do not bulk harvest           |
| Material Maker                                                | MIT software                                 | procedural PBR authoring        | generation, not harvest           | **Future procedural backend** |
| MaterialX                                                     | Apache/open standard                         | graph/PBR interchange           | N/A                               | Future interchange/schema     |

Me would build **36–48 material presets**, not 500.

Suggested first set:

```
Walls                7
Floors              10
Stone / masonry      6
Wood                 6
Metal                5
Fabric               5
Glass                procedural presets
Canvas / paper       3
```

Plus **8–12 curated HDRIs**.

Normalize them to:

- known real-world tile scale
- base-color color-space metadata
- roughness/metalness conventions
- normal orientation
- 1K and 2K derivatives
- KTX2/Basis web distribution.

Basis Universal 2.1 remains strong web target; KTX2 gives portable GPU-compressed textures and broad transcoding. 

# D. Best 2D / CAD / floor-plan asset sources

This ecosystem weaker.

| SourceRepresentationUseful partLicense issueRecommendation |                                 |                                                        |                                     |                            |
| ---------------------------------------------------------- | ------------------------------- | ------------------------------------------------------ | ----------------------------------- | -------------------------- |
| Sweet Home 3D                                              | plan icons + furniture metadata | explicit top-view representation tied to same 3D asset | per-library rights                  | **Best conceptual source** |
| easy-floorplan                                             | JSON primitive geometry         | furniture glyphs stored as geometry                    | MIT                                 | **Inspect/adapt**          |
| QCAD Part Library                                          | DXF/parts + RDF-like metadata   | technical symbols, top view metadata                   | per-item + project licenses         | Study/select               |
| FreeCAD Library                                            | FCStd / STEP / Symbols          | architecture + symbols                                 | CC-BY 3.0 content                   | Adapt                      |
| LibreCAD resources                                         | DXF/icons                       | drafting vocabulary                                    | code GPL; resources vary; icons CC0 | Study                      |
| Maker.js                                                   | generated vector geometry       | programmatic SVG/DXF shapes                            | verify dependency/license snapshot  | **Library candidate**      |
| JSCAD                                                      | parametric 2D/3D                | generated profiles/components                          | MIT                                 | Parametric candidate       |
| OpenSCAD MCAD                                              | parametric geometry             | technical component grammar                            | LGPL                                | Reference                  |
| OpenGameArt top-down packs                                 | PNG/vector sprites              | game-oriented plan-ish assets                          | individual license                  | Selective                  |
| Kenney 2D packs                                            | sprites/icons                   | generic top-down vocabulary                            | CC0                                 | Supplemental               |
| buildingSMART samples                                      | IFC                             | semantic BIM objects                                   | sample-specific/CC-BY               | Import tests               |
| OSM building footprints                                    | polygon + semantic tags         | outdoor/site plans                                     | ODbL                                | future site planning       |

The important finding:

**Me would not build Plan around SVG asset files.**

Store renderer-neutral geometry:

```
type PlanProxy =
  | { kind: 'box'; width: number; depth: number }
  | { kind: 'circle'; radius: number }
  | { kind: 'polygon'; points: Vec2[]; holes?: Vec2[][] }
  | { kind: 'semantic'; symbol: 'chair' | 'stairs' | 'plant' | ... }
  | { kind: 'none' };
```

Then SVG renderer draw it.

That fits current architecture better than persisting arbitrary SVG strings. Your architecture explicitly keeps renderer-specific representation out of semantic geometry boundaries. architecture.mdMD

# E. Best CAD / 2D editor projects to study or reuse

| ProjectStack / architectureGood reusable pieceLicenseMy recommendation |                           |                                                  |                                                       |                                       |
| ---------------------------------------------------------------------- | ------------------------- | ------------------------------------------------ | ----------------------------------------------------- | ------------------------------------- |
| `@flatten-js/core`                                                     | JS computational geometry | intersections, distances, affine ops, polygons   | MIT                                                   | **Strong candidate**                  |
| polygon-clipping                                                       | JS                        | robust polygon union/intersection/difference/XOR | MIT                                                   | **Use** when polygon booleans needed  |
| Concaveman                                                             | JS                        | fast concave hull                                | ISC                                                   | **Use for footprints**                |
| Simplify.js                                                            | JS                        | contour/polyline simplification                  | BSD-2                                                 | **Use for footprints**                |
| easy-floorplan                                                         | SVG/JS app                | wall/object/snapping UX, JSON furniture          | MIT                                                   | **Study + extract concepts**          |
| Maker.js                                                               | JS                        | paths/chains/layers, SVG/DXF generation          | open project; verify pinned license before dependency | Worth adapting                        |
| JSCAD                                                                  | JS/browser/CLI            | parametric profile→solid generation              | MIT                                                   | **Procedural object service**         |
| LibreCAD                                                               | C++/Qt                    | mature CAD interaction model + DXF               | GPL                                                   | **Study only / conversion process**   |
| QCAD                                                                   | C++/Qt + ECMAScript       | snapping, parts, dimensions, metadata            | GPL core                                              | **Study**                             |
| `web-ifc`                                                              | TS + C++ WASM             | IFC parser/writer                                | MPL-2.0                                               | **Import/export boundary**            |
| OpenCascade.js                                                         | OCCT → WASM               | solid BRep/STEP/booleans/sweep/fillet            | LGPL-family                                           | **Deferred**                          |
| CascadeStudio                                                          | browser CAD on OCCT       | scripted parametric CAD architecture             | MIT app + OCCT dependencies                           | Study                                 |
| Clipper2/WASM                                                          | C++/WASM                  | offsets + boolean polygon ops                    | permissive                                            | Add only if needed                    |

### What to extract

Not full application.

Use concepts like:

```
LibreCAD/QCAD
    ↓
snap rules
dimension grammar
selection UX
DXF semantics
layer ideas

easy-floorplan
    ↓
SVG spatial interaction
furniture proxy organization
wall/opening UX

web-ifc
    ↓
IFC read/write adapter

OpenCascade
    ↓
future isolated solid-operation service
```

But canonical flow remains:

```
LayoutDocument
      ↓
compileLayoutGeometry()
      ↓
Plan + 3D
```

No foreign CAD kernel should become second project truth. architecture.mdMD

# F. Best current AI 3D generators — September 2026

## Open/local

| SystemGeometryTexture/PBRTopology/web fitLocal requirementLicenseVerdict |                          |                      |                                 |                                         |                                         |                                    |
| ------------------------------------------------------------------------ | ------------------------ | -------------------- | ------------------------------- | --------------------------------------- | --------------------------------------- | ---------------------------------- |
| **TRELLIS.2**                                                            | **Excellent**            | **full PBR**         | high detail; needs optimization | official ≥24 GB NVIDIA; community lower | MIT                                     | **Best open general foundation**   |
| Step1X-3D                                                                | strong                   | strong               | more pipeline work              | heavy GPU                               | Apache-2.0                              | **Strong alternative**             |
| PartCrafter                                                              | structured/multipart     | geometry focus       | very interesting semantics      | H20-tested research stack               | MIT code                                | **Research structured generation** |
| CraftsMan3D                                                              | good geometry/refinement | pipeline-dependent   | requires remesh                 | local GPU                               | code/model licensing differs by release | Research; license pin carefully    |
| InstantMesh                                                              | good baseline            | weaker than latest   | predictable pipeline            | moderate                                | Apache-2.0                              | Baseline                           |
| Unique3D                                                                 | useful reconstruction    | moderate             | post-process                    | moderate                                | MIT                                     | Baseline                           |
| TripoSR                                                                  | fast geometry baseline   | weak/currently dated | post-process                    | relatively accessible                   | MIT code                                | Fast baseline                      |
| Hunyuan3D 2.1                                                            | strong                   | PBR                  | good                            | heavy                                   | **territorial custom license**          | **Avoid canonical global backend** |

### TRELLIS.2

Best open candidate me found for **internal generation / self-host research**.

But its strength creates web burden:

```
generation quality ↑
        ↓
triangle count ↑
texture size ↑
asset ingestion work ↑
```

Do not insert raw TRELLIS output directly in `SceneDocument`.

---

## Commercial/API

### 1. Tripo P2 — best product fit for web generation

Released August 2026.

Very useful controls:

- triangle cap 50k
- quad cap 25k
- PBR maps
- 8K optional texture quality
- auto-scale into meters
- deterministic seeds
- export orientation
- UV control
- Meshopt geometry compression. 

**My pick for first experimental generator adapter.**

Not because it necessarily wins screenshots.

Because API expose parameters your pipeline actually needs.

---

### 2. Meshy 7 / Smart Topology — best broad pipeline API

Meshy currently exposes:

- text/image/multiview generation
- smart topology
- target polycount
- quad option
- remesh
- UV unwrap
- retexture
- resize
- convert
- rigging
- animation.

Its API pricing currently charges 20 credits for normal Meshy 7 generation, plus texture/topology extras depending on operation. 

That makes Meshy useful as **asset processing platform**, not merely generator.

---

### 3. Rodin Gen-2.5 — highest-fidelity candidate

Rodin Gen-2.5 currently accepts text or up to five images and Hyper3D was still adding geometry/texture controls through August 2026. 

A May 2026 community same-input comparison rated Rodin above TRELLIS.2 on backside completion, UV unwrap, texture, and geometry. That is anecdotal, not benchmark, but useful practical signal. 

Me use Rodin for **hero/bespoke assets**, not bulk generic furniture.

---

## Current winners by task

| NeedPick                              |                                           |
| ------------------------------------- | ----------------------------------------- |
| Best open/local foundation            | **TRELLIS.2**                             |
| Best open structured-part research    | **PartCrafter**                           |
| Best web-oriented low-poly API        | **Tripo P2**                              |
| Best broad asset-processing API       | **Meshy**                                 |
| Best candidate for hero fidelity      | **Rodin Gen-2.5**                         |
| Best batch generic web asset creation | **Tripo P2 / Meshy**                      |
| Best predictable existing assets      | **None — harvest curated source instead** |

### “Looks good” vs reusable asset

Require generated model to pass:

```
□ backside complete
□ no catastrophic hidden geometry
□ reasonable watertightness where category needs it
□ deterministic real-world scale
□ canonical +Y up
□ sane pivot
□ correct floor grounding
□ stable UVs
□ ≤ web triangle budget
□ material maps valid
□ textures ≤ budget
□ Plan proxy valid
□ thumbnail valid
□ semantic category known
□ provenance + generator/version stored
```

Otherwise generation only produced picture-shaped mesh.

# G. Best AI / procedural layout systems

## Systems worth studying

### ProcTHOR

Procedurally creates semantically plausible interactive houses and has an open Apache-based ecosystem. 

Useful extraction:

```
room templates
object placement constraints
spatial randomization
semantic object classes
procedural scene validation
```

Not runtime dependency.

---

### Holodeck

Turns language description into interactive environment by selecting assets, composing layout, and producing structured environment data. 

Very relevant mental model:

```
LLM intent
→ choose assets
→ position objects
→ enforce relations
→ produce environment
```

This resembles your long-term agent workflow.

---

### PartCrafter scene generation

Interesting because model tries to produce compositional parts/objects rather than monolithic mesh. But its scene model used 3D-FRONT training data, so model/data provenance deserves legal review before product use. 

Research only.

---

### LayoutGPT / ATISS / DiffuScene / related

Strong research for:

- relation reasoning
- furniture distributions
- semantic interior composition.

Poor direct production dependency because many rely on datasets whose commercial rights are bad.

Study algorithms. Do not ship data.

---

### CAD-Recode

Very relevant to future CAD agent idea because it generates CadQuery code from geometry/point clouds rather than opaque mesh. 

---

### DeepCAD / Text2CAD / CAD-MLLM

Important lesson:

**structured operation sequence is better integration surface than generated mesh.**

DeepCAD represents CAD construction sequences and can reconstruct CAD/STEP-like outputs. 

That aligns with:

```
createRoom(...)
addWall(...)
addWindow(...)
setDimensions(...)
placeAsset(...)
```

rather than giving AI raw mesh authority.

# H. Recommended ingestion architecture

Me recommend this become durable infrastructure:

```
SOURCE
  ↓
Source Adapter
  ↓
License + Provenance Gate
  ↓
Quarantine / Validation
  ↓
Format Conversion
  ↓
Canonical GLB
  ↓
Geometry Normalization
  ↓
Material / Texture Normalization
  ↓
Web Optimization
  ↓
Bounds / Collision / Placement Analysis
  ↓
Plan Proxy Generation
  ↓
Thumbnails / Turntable
  ↓
Semantic Metadata + Embeddings
  ↓
Curation Gate
  ↓
Immutable Asset Revision
  ↓
Asset Registry
  ↓
Editor / Agent / Published Runtime
```

## 1. Source adapter

Example:

```
interface AssetSourceAdapter {
  search?(query: AssetSourceQuery): Promise<SourceAsset[]>;
  fetch(id: string): Promise<SourceAssetPayload>;
  resolveRights(id: string): Promise<SourceRightsEvidence>;
}
```

Different source adapters:

```
polyhaven
kenney
smithsonian
sweethome3d
user-upload
generated:tripo
generated:meshy
generated:trellis
```

---

## 2. License gate

Persist evidence at ingestion time.

Do not store only:

```
license: 'CC0'
```

Store:

```
{
  licenseId,
  licenseUrl,
  sourceTermsUrl,
  sourceSnapshotHash,
  author,
  attribution,
  redistributionAllowed,
  derivativesAllowed,
  commercialAllowed,
  shareAlike,
  downloadedAt
}
```

If uncertain:

```
state = blocked
```

not “probably okay”.

---

## 3. Conversion

Canonical delivery format:

**GLB/glTF 2.0.**

Assimp supports 40+ source formats and current 6.0.5 release landed April 2026. Its modified BSD license makes backend conversion use straightforward. 

Use Blender CLI when artistic/geometry normalization requires robust importer or baking.

---

## 4. Validate

Use Khronos glTF Validator.

It outputs JSON diagnostics and statistics and validates buffers, animation, images, extensions and glTF structure. 

Hard gate:

```
errors > 0 → fail
warnings   → classify
```

---

## 5. Normalize geometry

Canonical contract:

```
unit: meters
up: +Y
Plan plane: XZ
pivot: semantic placement pivot
floor assets: grounded at Y=0
front: canonical documented direction
```

Do not destructively invent real dimensions when source gives no reliable scale.

Flag:

```
scaleConfidence: 'source' | 'estimated' | 'manual'
```

---

## 6. glTF processing

Use **glTF Transform** as main TypeScript layer.

It supports Web and Node and has:

- prune
- dedup
- Draco
- Meshopt
- texture resizing
- WebP
- KTX2 / UASTC / ETC1S
- custom transforms. 

Excellent match to your TS stack.

---

## 7. Optimization

Me favor **Meshopt** for canonical web assets where renderer support already exists.

`gltfpack` offers:

- `EXT_meshopt_compression`
- KTX2 conversion
- WebP
- mesh simplification
- instancing
- preserving names/materials/extras. 

Do not automatically strip meaningful node names. Named nodes later support animations/interactions.

---

## 8. Texture processing

Default:

```
BaseColor                ETC1S or good KTX2 profile
Normal                   UASTC
Metallic/Roughness/AO    UASTC / packed
Emissive                 appropriate per content
```

Generate:

- 1K normal default
- 2K quality derivative
- 4K only hero source and optional.

---

## 9. Bounds and LOD

Produce:

```
AABB
OBB
bounding sphere
triangle count
vertex count
material count
texture VRAM estimate
LOD0
LOD1
LOD2
```

Do not make LOD mandatory for tiny low-poly assets.

---

## 10. Plan proxy generation

More below.

---

## 11. Thumbnails

Generate deterministic:

```
front
3/4
top
optional turntable
```

Same studio lighting.

This helps human browse and visual embeddings.

---

## 12. Semantic tagging

First deterministic:

```
category
dimensions
placement
materials
dominant colors
license
polycount
```

Then AI-derived:

```
style
era
descriptive tags
visual embedding
text embedding
```

Never let model overwrite source rights metadata.

---

## Local vs backend

### Local import

Run cheap operations:

```
GLB validation
bounds
basic metadata
cheap Plan proxy
preview
```

Could run Web Worker.

### Backend batch

Run expensive operations:

```
Blender conversion
texture baking
KTX2 encode
mesh simplification
LOD
full thumbnail set
embedding generation
quality checks
```

### Harvest pipeline

Separate internal workflow:

```
source adapter
→ immutable source manifest
→ license snapshot
→ batch normalization
→ human curation
→ published registry
```

This separation fits your architecture: project-local GLB bytes already belong to portable package/asset-store boundary, not `SceneDocument` itself. architecture.mdMD

# Automatic 3D → 2D footprint

## Recommended algorithm

### Tier 1 — OBB

Almost free.

```
mesh
→ XZ projected bounds
→ oriented rectangle
```

Good for:

- cabinets
- shelves
- simple sofas
- boxes
- benches.

---

### Tier 2 — projected silhouette

Preferred generic route:

```
GLB
 ↓
canonical local mesh
 ↓
orthographic projection onto XZ
 ↓
raster mask OR projected triangle polygons
 ↓
union
 ↓
small morphological close/dilate
 ↓
contour extraction
 ↓
simplify
 ↓
PlanProxy polygon
```

Rasterizing first is often more robust than exact triangle-union against broken web meshes.

---

### Tier 3 — semantic proxy

Use manually curated proxy when appearance from above does not equal useful floor-plan communication.

## Edge cases

| AssetBest proxy        |                                                                                |
| ---------------------- | ------------------------------------------------------------------------------ |
| chair with thin legs   | silhouette + close/dilate or semantic seat/back proxy                          |
| table                  | **top silhouette**, not contact points                                         |
| cabinet                | silhouette / OBB                                                               |
| shelf                  | silhouette                                                                     |
| floor lamp             | base + semantic lamp mark                                                      |
| plant                  | pot/base or simple canopy circle                                               |
| stairs                 | **authored parametric symbol** showing direction                               |
| wall art               | normally no floor footprint                                                    |
| hanging lamp           | no floor footprint / ceiling annotation                                        |
| sculpture              | generated silhouette; curate irregular hero pieces                             |
| huge architecture mesh | should usually become Layout import/semantic architecture, not furniture asset |

### Recommendation

```
type PlanProxySource =
  | 'manual'
  | 'generated-silhouette'
  | 'generated-obb'
  | 'parametric'
  | 'none';
```

And store generation version:

```
generator: {
  name: 'mesh-silhouette-v2',
  params: {...},
  quality: 0.88
}
```

Then pipeline can regenerate proxies later.

# I. Recommended asset schema

Most important split:

**AssetDefinition ≠ placed object.**

Your current product already distinguishes Asset Library reusable assets from placed scene instances. Keep that. Shell-scene-workspaces.mdMD

```
type AssetId = string;

type AssetDefinition = {
  id: AssetId;
  revision: number;

  identity: {
    name: string;
    category: string;
    subcategory?: string;
    tags: string[];
  };

  provenance: {
    provider:
      | 'first-party'
      | 'polyhaven'
      | 'kenney'
      | 'smithsonian'
      | 'sweethome3d'
      | 'user'
      | 'generated';

    sourceId?: string;
    sourceUrl?: string;
    downloadedAt?: string;

    contentHash: string;

    derivedFrom?: AssetId[];

    generator?: {
      provider: string;
      model: string;
      version: string;
      seed?: string;
      inputHashes?: string[];
    };
  };

  rights: {
    licenseId?: string;
    licenseUrl?: string;

    authors: string[];
    attributionText?: string;

    commercialUse: boolean | 'unknown';
    derivatives: boolean | 'unknown';
    redistribution: boolean | 'unknown';
    shareAlike: boolean | 'unknown';

    sourceTermsUrl?: string;
    evidenceId: string;
    reviewedAt?: string;
  };

  model: {
    uri: string;
    format: 'glb';
    contentHash: string;

    bytes: number;
    gltfVersion: '2.0';

    unit: 'meter';
    upAxis: '+Y';
    forwardAxis?: '+X' | '-X' | '+Z' | '-Z';

    meshCount: number;
    primitiveCount: number;
    vertices: number;
    triangles: number;

    animations: {
      name: string;
      duration: number;
    }[];

    extensionsUsed: string[];
  };

  dimensions: {
    width: number;
    height: number;
    depth: number;

    source: 'source' | 'estimated' | 'manual';
  };

  bounds: {
    aabb: {
      min: [number, number, number];
      max: [number, number, number];
    };

    obb?: {
      center: [number, number, number];
      halfSize: [number, number, number];
      rotation: [number, number, number, number];
    };
  };

  placement: {
    surfaces: Array<'floor' | 'wall' | 'ceiling' | 'free'>;

    pivot: [number, number, number];
    groundOffset: number;

    snapPoints?: {
      id: string;
      position: [number, number, number];
      kind: string;
    }[];

    clearance?: {
      front?: number;
      back?: number;
      left?: number;
      right?: number;
    };
  };

  planProxy: {
    source:
      | 'manual'
      | 'generated-silhouette'
      | 'generated-obb'
      | 'parametric'
      | 'none';

    polygon?: Array<[number, number]>;
    holes?: Array<Array<[number, number]>>;

    generation?: {
      pipelineVersion: string;
      confidence: number;
    };
  };

  materials: {
    pbr: boolean;

    slots: Array<{
      id: string;
      name?: string;
      replaceable: boolean;
    }>;

    textureMaxResolution: number;
    usesKtx2: boolean;
  };

  optimization: {
    profile: string;

    meshopt: boolean;
    draco: boolean;
    ktx2: boolean;

    lods: Array<{
      level: number;
      uri: string;
      triangles: number;
    }>;
  };

  semantics: {
    styles: string[];
    materials: string[];
    colors: string[];

    era?: string;

    indoorOutdoor:
      | 'indoor'
      | 'outdoor'
      | 'both';

    capabilities?: string[];

    textEmbeddingRef?: string;
    imageEmbeddingRef?: string;
  };

  curation: {
    status:
      | 'Approved'
      | 'Testing'
      | 'Placeholder'
      | 'Rejected';

    checks: string[];
    notes?: string;
  };
};
```

Then instance stays small:

```
type SceneAssetInstance = {
  id: string;
  assetId: AssetId;

  roomId?: string;

  transform: {
    position: [number, number, number];
    rotation: [number, number, number, number];
    scale: [number, number, number];
  };

  materialOverrides?: Record<string, string>;
};
```

Exact shape need adapt to current `SceneDocument` codec. Me not invent that integration without code.

# J. Recommended first asset library

Do **not** start at 1,000.

Me target around **100 carefully curated static objects**, plus procedural architecture.

## Static library

| GroupCount            |        |
| --------------------- | ------ |
| chairs                | 10     |
| benches               | 7      |
| stools                | 4      |
| lounge / sofas        | 6      |
| tables                | 10     |
| desks / consoles      | 5      |
| shelves / bookcases   | 7      |
| cabinets / storage    | 7      |
| floor / table lamps   | 8      |
| wall sconces          | 7      |
| pendants              | 5      |
| plants                | 8      |
| decor / generic props | 8      |
| electronics / signage | 5      |
| **Total**             | **97** |

This is enough combinatorial variety.

## Parametric, not static

```
wall
floor
ceiling
room
door
double door
sliding door
window
opening
column
stairs
partition
plinth
pedestal
display case
frame
shelf
cabinet
lighting track
rail
```

Each can have presets rather than unique mesh objects.

## Materials

**40-ish** normalized presets.

## Environment

**8–12 HDRIs**.

## Templates

Start maybe:

```
Small Gallery
Four-Room Gallery
Portfolio Exhibition
Product Showroom
Small Retail
Office / Studio
Residential Room
```

Templates far more useful to AI than another 50 random chairs.

# K. Build vs harvest vs generate

| Asset classHarvestProceduralAI generateManual |         |                         |                  |                       |
| --------------------------------------------- | ------- | ----------------------- | ---------------- | --------------------- |
| walls / rooms / floors                        | Low     | **5/5**                 | Low              | template only         |
| ceilings                                      | Low     | **5/5**                 | Low              | template              |
| doors/windows                                 | Medium  | **5/5**                 | Low              | presets               |
| stairs                                        | Low     | **5/5**                 | Low              | semantic presets      |
| columns                                       | Medium  | **5/5**                 | Low              | styles                |
| partitions                                    | Low     | **5/5**                 | Low              | presets               |
| plinths/pedestals                             | Low     | **5/5**                 | Low              | presets               |
| display cases                                 | Medium  | **5/5**                 | Medium           | hero styles           |
| shelving/cabinets                             | High    | **4/5**                 | Medium           | core presets          |
| chairs                                        | **5/5** | Low                     | Medium           | few canonical         |
| benches                                       | **5/5** | Medium                  | Medium           | gallery core          |
| tables                                        | **5/5** | Medium                  | Medium           | core                  |
| sofas/lounge                                  | **5/5** | Low                     | Medium           | none/few              |
| lamps                                         | **5/5** | track system only       | Medium           | gallery lights        |
| plants                                        | **5/5** | Low                     | **4/5**          | Low                   |
| sculpture/decor                               | High    | Low                     | **5/5**          | hero                  |
| electronics                                   | **5/5** | Low                     | Medium           | Low                   |
| materials                                     | **5/5** | **4/5**                 | Medium           | curation              |
| glass/simple metal                            | Medium  | **5/5**                 | Low              | Low                   |
| HDRIs                                         | **5/5** | Low                     | Low              | Low                   |
| Plan symbols                                  | Medium  | **auto-generation 5/5** | Low              | core semantic proxies |
| scene templates                               | Medium  | **5/5 composition**     | **5/5 assisted** | **5/5 curation**      |
| camera tours                                  | —       | semantic rules          | **5/5 assisted** | authorable            |

# L. Top repositories / datasets to inspect first

## 1. `pmndrs/assets`

Why:

- already designed for web
- CC0
- optimized GLB/textures
- npm-style consumption.

Inspect:

- model folders
- texture/HDRI folders
- optimization/build scripts
- metadata/index-generation path.

Goal: steal **pipeline ideas**, not merely files.

---

## 2. glTF Transform

[donmccurdy/glTF-Transform](https://github.com/donmccurdy/glTF-Transform?utm_source=chatgpt.com)

Inspect:

```
packages/core
packages/extensions
packages/functions
packages/cli
```

Concrete function code lives under e.g. `packages/functions/src/`; `join.ts` confirms structure. 

Why:
**probably canonical TS asset processing dependency.**

---

## 3. Khronos glTF Validator

[KhronosGroup/glTF-Validator](https://github.com/KhronosGroup/glTF-Validator?utm_source=chatgpt.com)

Inspect:

```
node/
lib/
bin/
test/
```

Use as ingestion acceptance gate. 

---

## 4. Khronos glTF Sample Assets

Inspect:

```
Models/
Models/<asset>/README.md
Models/Models.md
```

Why:

- validate renderer
- validate extensions
- build asset pipeline fixtures
- license model-per-directory discipline.

---

## 5. FreeCAD Parts Library

Inspect categories:

```
Architectural Parts/
Generic objects/
Industrial Design/
Symbols/
thumbnails/
LICENSE-Assets
```

Why:
parametric/semantic parts and CAD-style source data.

---

## 6. Sweet Home 3D furniture libraries

Not mainly GitHub clone. Download current SH3F libraries.

Inspect:

- `*.sh3f`
- furniture properties
- plan icons
- dimensions
- elevation
- rotations
- shelf metadata
- creator/license metadata.

This is maybe most important manual inspection after glTF Transform.

---

## 7. easy-floorplan

Inspect:

```
furniture/
furniture/*.json
```

Why:
simple JSON geometry is close to useful PlanProxy idea.

---

## 8. `allenai/objaverse-xl`

[Objaverse-XL repository](https://github.com/allenai/objaverse-xl?utm_source=chatgpt.com)

Inspect:

```
scripts/rendering/
scripts/rendering/blender_script.py
```

Why:
large-scale messy-asset normalization, rendering, metadata extraction.

License concern:
per-object rights remain mandatory. 

---

## 9. Microsoft TRELLIS.2

[microsoft/TRELLIS.2](https://github.com/microsoft/TRELLIS.2?utm_source=chatgpt.com)

Repository tree includes:

````
configs/
data_toolkit/
o-voxel/
trellis2/
app.py
app_texturing.py
example.py
example_texturing.py
train.py
``` citeturn239139search6


Why:
open generation + postprocessing architecture.

---

## 10. Step1X-3D

Inspect:
- preprocessing
- watertight pipeline
- texture path
- configuration profiles
- inference outputs.

Why:
independent open pipeline versus TRELLIS.

---

## 11. PartCrafter

[wgsxm/PartCrafter](https://github.com/wgsxm/PartCrafter?utm_source=chatgpt.com)

Current tree:

```text
assets/
configs/
datasets/
scripts/
settings/
src/
``` citeturn563306search0


Why:
part-aware generation may become more useful to editor than monolithic mesh generation.

License concern:
scene model/data lineage touches 3D-FRONT.

---

## 12. `web-ifc`

Inspect:

```text
src/
examples/
tests/
WASM build boundary
````

Why:
IFC interoperability without making IFC internal truth.

---

## 13. `three-mesh-bvh`

[gkjohnson/three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh?utm_source=chatgpt.com)

Why:
fast spatial queries, intersection, distance, SDF-ish operations, worker generation. 

Could support:

- footprint generation
- collision proxy generation
- clearance analysis
- imported mesh selection later.

---

## 14. Concaveman + polygon-clipping + Simplify.js

Tiny but high leverage.

They can form PlanProxy processing toolkit rather than adopting giant CAD library. 

---

## 15. OSM2World

[OSM2World project](https://osm2world.org/?utm_source=chatgpt.com)

It converts OpenStreetMap semantics into 3D and exports glTF/OBJ. 

Very useful later if editor expands toward:

- outdoor scenes
- campuses
- neighborhoods
- historical walkthrough context.

But ODbL needs deliberate data-license boundary. 

# M. Product implications

## 1. Should editor maintain own curated library?

**Yes. Definitely.**

But small.

Think:

```
Museum Editor Standard Library
```

not:

```
Museum Editor owns 40,000 meshes
```

Your library's value:

```
normalized
web-tested
legal
semantic
Plan-aware
agent-aware
```

---

## 2. Should editor connect to external libraries?

**Yes, second layer.**

UI eventually:

```
Assets
├── Curated
├── My Assets
├── Project
└── External
    ├── Poly Haven
    ├── Sketchfab
    └── ...
```

External asset gets ingested into local/project registry before placement.

Never have live third-party object become mysterious runtime dependency.

---

## 3. On-demand AI generation?

**Yes. Third source type.**

Asset search algorithm later:

```
search curated
       ↓
suitable?
  yes → use
  no
       ↓
search external allowed source
       ↓
suitable?
  yes → import
  no
       ↓
generate
```

That makes generation economical.

---

## 4. Which assets procedural?

Highest priority:

```
walls
floors
ceilings
rooms
openings
doors
windows
stairs
columns
partitions
shelves
cabinets
plinths
display cases
frames
rails
lighting tracks
repetition/arrays
```

These are where parameters matter more than artistic mesh.

---

## 5. Should every 3D asset have authored Plan proxy?

**Every Plan-eligible asset needs resolved Plan representation.**

But:

```
~70–90% automatically generated
~10–30% curated/manual
```

Do not manually draw hundreds upfront.

Current Plan contract already assumes canonical footprint metadata for floor catalogue models. This research suggests expanding that mechanism to imported assets through ingestion rather than changing Plan selection architecture. Shell-scene-workspaces.mdMD

---

## 6. How much automate?

Large amount:

**Automate**

- format validation
- GLB conversion
- texture scan
- bounds
- scale heuristics
- grounding
- optimization
- KTX2
- LOD
- Plan silhouette
- thumbnails
- initial tags
- embeddings
- duplicate detection
- performance score.

**Human/review**

- final licensing judgment
- bizarre scale
- poor topology
- semantic category
- placement behavior
- hero Plan proxy
- final Approved status.

Me expect mechanical pipeline **70–90% automatable** after adapters mature.

---

## 7. What infrastructure add to roadmap?

Order me recommend:

### P-A1 — Asset definition + provenance

```
AssetDefinition
AssetRevision
license evidence
source provenance
content hash
```

No UI explosion yet.

### P-A2 — Canonical import pipeline

```
GLB validation
normalization
optimization
thumbnail
bounds
```

### P-A3 — PlanProxy generation

Imported model:

```
GLB
→ footprint
→ Scene Plan Arrange
```

This directly closes current imported-footprint gap. Shell-scene-workspaces.mdMD

### P-A4 — Curated standard library

\~100 assets + 40 materials.

### P-A5 — Asset semantic search

Filters first:

```
category
dimensions
material
placement
style
license
poly budget
```

Embeddings second.

### P-A6 — Procedural asset families

Begin gallery-relevant:

```
plinth
display case
partition
frame
shelf
lighting track
```

### P-A7 — external source adapter

Poly Haven easiest first because API + rights clean.

### P-A8 — generation provider interface

Something like:

```
interface AssetGenerator {
  generate(request: AssetGenerationRequest):
    Promise<ImportedAssetCandidate>;
}
```

Tripo / Meshy / TRELLIS all return into same ingestion pipeline.

### P-A9 — agent asset/search commands

Then AI composition.

---

## 8. What deliberately not build?

Do **not** build:

- Blender-style mesh editor
- sculpting
- UV editor
- manual retopology editor
- own 3D foundation model
- giant asset crawler before license system
- giant marketplace now
- second Canvas/Fabric/Konva Plan architecture
- second CAD document representation
- IFC as internal truth
- USD as internal truth
- AI-only scene representation
- a separate “generated scene” pipeline
- 10,000 mediocre assets before first 100 excellent ones.

This aligns directly with North Star permanent non-goals. north-star.mdMD

---

## 9. Choices best supporting AI-agent scene creation

Expose semantic tools.

Not DOM clicks.

Example:

```
searchAssets({
  query: 'low modern wooden gallery bench',
  maxWidthM: 1.8,
  placement: 'floor',
  license: 'commercial',
  triangleBudget: 20_000
});

placeAsset({
  assetId: 'bench-oak-03',
  roomId: 'gallery-east',
  position: [1.2, 0, -2.4],
  yaw: Math.PI / 2
});

setMaterial({
  entityId: 'bench-7',
  slot: 'wood',
  materialId: 'oak-natural'
});

addCameraNode({...});
connectCameraNodes({...});
setCameraSequence({...});

validateProject();
renderPreview({...});
```

The agent should never need:

```
scene.children[43].position.x = ...
```

And it should never bypass room-local transforms, canonical selection/history, layout compiler, or camera motion pipeline. Your current architecture and North Star explicitly protect these. architecture.mdMD Camera-flow-specs.mdMDnorth-star.mdMD

---

## 10. Where editor create leverage Blender / generic CAD do not?

This may be most important conclusion.

Do not try win:

> who can model chair best?

Blender win.

Do not try win:

> who has deepest BIM schema?

Revit/IFC ecosystem win.

Win this:

```
user intent
   ↓
semantic spatial layout
   ↓
known reusable assets
   ↓
materials + lighting
   ↓
camera experience
   ↓
interactions
   ↓
preview
   ↓
web publish
```

And make whole path machine-operable.

The reusable unit is no longer “mesh”.

It becomes:

```
Spatial Asset
=
geometry
+ dimensions
+ placement rules
+ Plan proxy
+ materials
+ optimization
+ provenance
+ semantic meaning
```

Then next level:

```
Spatial Template
=
layout
+ asset roles
+ style/material rules
+ lighting intent
+ camera intent
```

Then agent can answer:

> Build small modern gallery with four rooms.

without hallucinating every vertex.

It can do:

```
createGalleryTemplate(...)
→ set room dimensions
→ choose standard doors
→ search bench assets
→ choose gallery lights
→ apply plaster / oak / concrete materials
→ place works
→ generate sensible circulation
→ author camera graph
→ author sequence
→ preview
→ correct
```

That is much closer to your AI-proof / Blender-like reusable-layer idea.

**Mesh supply commodity. Semantic spatial execution environment is harder commodity.**

And this fits current product architecture unusually cleanly: separate `LayoutDocument`/`SceneDocument`, one compiled layout geometry path, shared Plan/3D identity, one Camera graph/motion system, and visitor-safe publish boundary already give you bones for it. architecture.mdMD Design-shell-specs.mdMD north-star.mdMD

**My roadmap priority from this research:** finish current editor/publish foundation, then prioritize **Asset Registry → ingestion/normalization → generated Plan proxies → curated 100-asset standard library → procedural gallery primitives → semantic agent command API**. AI 3D provider integration comes *after* normalization pipeline, because then Tripo, Meshy, TRELLIS.2, future 2027 model, or user-uploaded GLB all become same kind of input instead of new architecture each time.