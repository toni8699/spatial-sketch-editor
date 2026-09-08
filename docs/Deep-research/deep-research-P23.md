My Lord, Phase 3 answer converge pretty hard on one direction:

> **Do not make Scene Plan into browser AutoCAD. Make it a precise semantic spatial builder.**

Your current architecture already right shape for this. `LayoutDocument` stays authored truth. `compileLayoutGeometry()` stays one compiler. SVG stays Plan renderer. Scene and Layout ownership stay separate. P23 should mostly add **better semantic operations, precision, snapping, dependent-reference handling, and deterministic structure transforms**, not new CAD substrate.   

Research strongest conclusion: **you do not need CAD kernel, constraint solver, Canvas rewrite, or BRep through P23 and likely well beyond it.** North Star already points right way: richer architectural operations must extend semantic layout + same compiler, not create parallel modeling truth. 

---

# A. Executive findings

## 1. P23 should start with operation architecture, not UI widgets

Best reusable pattern found in current browser floor planners is not rendering. It is:

```text
intent
→ plan all semantic changes
→ validate whole change
→ preview
→ commit atomically
→ one history entry
```

`openPlan3D/src/lib/utils/wallEditing.ts` already does a crude but useful version. `planWallResize()` calculates all connected-corner updates in a map, validates every resulting wall, then lets caller apply. Good pattern for Museum. Its exact geometry implementation should not become yours. 

For P23, me would make this pattern foundational.

---

## 2. Direct numeric precision ≠ geometric constraint system

This distinction matter huge.

P23 should support:

```text
Set wall length = 4.2 m
Set opening width = 0.9 m
Set opening offset = 1.4 m
Set object X = 2.0 m
Set yaw = 90°
```

This does **not** mean:

```text
Wall A permanently parallel Wall B
Room A always same width Room B
These four edges permanently equal
Solver recomputes entire sketch
```

LibreCAD supports precise mouse snapping plus keyboard coordinate/distance entry. FreeCAD Sketcher and SolveSpace show what happens after crossing into persistent constraints: DOF tracking, equation systems, redundancy, conflicts, convergence, solver diagnostics, and substantial UX around bad states. FreeCAD's `GCS.cpp` alone is ~5,000 LOC of solver implementation; SolveSpace exposes many geometric constraint types through its solver library. 

**Classification:** direct precision = **P23 MINIMUM**. Global solver = **REJECT / WRONG PRODUCT for current roadmap**.

---

## 3. Small snap vocabulary gives most useful CAD feeling

LibreCAD exposes grid, endpoint, on-entity, center, middle, distance, intersection, horizontal/vertical/orthogonal restrictions, and more. Museum should not clone all of it. 

My P23 set:

```text
grid
endpoint / room corner
midpoint
intersection
nearest point on wall/reference segment
orthogonal
opening edge while editing openings
```

Later:

```text
parallel
perpendicular
extension
equal spacing
object center/edge
temporary guide
angle increments beyond orthogonal
```

Tangent and generalized CAD object snaps bring near-zero value for first exhibition/showroom workflows.

---

## 4. Snap tolerance should be screen-space; topology tolerance should not

These are different concepts.

```text
Pointer snap tolerance
= interaction tolerance
= CSS pixels

Geometry equality / degeneracy tolerance
= numerical/topological policy
= world/model units
```

Do not share one `EPSILON`.

`openPlan3D` gives good cautionary evidence: its geometry logic historically mixed generous endpoint tolerances and room detection assumptions; its own QA found failures around multi-room topology and T-junctions. Current code has since added explicit T-junction splitting and planar-face traversal, but its history is useful evidence of how fragile naïve room graph logic gets.  

---

## 5. `robust-predicates` is strongest small dependency candidate

For CAD-like geometry, orientation classification is one of places raw floating-point math eventually bites.

`robust-predicates`:

- browser-native
- zero dependencies
- TypeScript declarations
- Unlicense
- current `3.0.3`
- implements robust Shewchuk orientation/incircle predicates. 

Me would likely add it before adding a general geometry framework.

One caveat: library documents its coordinate-orientation convention. Wrap it behind your own geometry adapter. Do not scatter direct calls through editor UI.

---

## 6. Flatten.js useful, but not new CAD truth

`@flatten-js/core` now gives line, ray, segment, circle, arc, polygon, distance, intersections, transforms, containment, booleans and spatial sets; current package is `1.6.14`. 

Good use:

```text
LayoutDocument
↓
canonical compiled primitives
↓
small adapter
↓
Flatten intersection/distance query
```

Bad use:

```text
LayoutDocument
↓
Flatten Polygon becomes real project model
↓
SVG and Three rebuild semantics from Flatten independently
```

**Disposition:** **PROTOTYPE / ADAPT SOON**, especially for snap-distance/intersection work if current internal geometry functions prove thin.

---

## 7. Opening attachment semantics deserve explicit P23 architecture decision

This may be biggest schema question.

`openPlan3D` uses:

```ts
wallId
position: number // 0..1 along wall
width
height
...
```

That simple normalized parameter works, but normalized `t` makes exact distance semantics less natural when wall length changes. Its UI already exposes distance-from-A/B concepts to users. 

For Museum, strongest long-term semantic coordinate is probably:

```text
wall reference
+
physical arc-length offset from canonical wall start
+
width
```

Why:

- exact dimension naturally means meters
- straight and curved walls use same concept
- duplicate straightforward
- split deterministic
- mirror deterministic
- resize policy explicit
- opening never floats in world space

But:

> **Need exact current Layout wall/room/opening types before recommending migration.**

If current schema already uses normalized `t`, P23 may expose physical distance while retaining current storage first. No need schema migration merely for elegance.

---

## 8. Explicit Room identity should survive. Derived room faces should assist it

Do **not** change Museum into:

```text
room = whatever polygon wall graph happens to infer today
```

JTS's `Polygonizer` is strong reference for proper derived face extraction. It requires correctly noded linework and explicitly reports dangles, cut edges, and invalid ring lines. That is much better mental model than “cycle search somehow creates rooms.” 

Museum direction:

```text
LayoutDocument
  explicit Room IDs / ownership

Compiled topology
  wall graph
  noded segments
  candidate enclosed faces
  topology diagnostics

Room tools
  use candidate faces to assist creation / validation
  never replace semantic room identity automatically
```

This preserves room-local ownership.

---

## 9. Blueprint3D useful historically, but shows architecture not to copy

Blueprint3D uses corners, walls, rooms and generated half-edges. Its `HalfEdge` computes interior/exterior wall corners based on thickness and adjacent edges. Good concept reference for wall joins. 

But same class also creates `THREE.Mesh`, matrices, renderer objects and intersection planes. That violates your renderer-neutral boundary directly. Also project itself says it was rushed, needs better serialization/tests/refactoring, and last main project activity is old. 

**Harvest:** half-edge/join concepts.

**Do not harvest:** document/render ownership.

---

## 10. OpenPlan3D is best current browser floor-planner code mine

This one most useful direct repo for P23.

It is MIT. Current code includes:

```text
wallEditing.ts
roomDetection.ts
alignment.ts
cadExport.ts
hitTesting.ts
outerWalls.ts
projectValidation.ts
roomPresets.ts
roomplanImport.ts
floorStack.ts
```

plus browser/geometry tests. 

Especially useful:

- atomic wall resize planning
- wall/opening property UX
- room presets
- alignment operations
- import normalization
- adversarial QA documents
- multi-floor failure lessons
- opening tests
- wall dimension tests

Not useful:

- giant Canvas-oriented Plan component
- direct Svelte store mutation patterns
- current room identity strategy
- duplicated/render-driven architecture
- fixed-sample Bézier measurements

Its current wall length code approximates a quadratic curve with exactly 20 samples. That is precisely kind of consumer-local curve resampling Museum must avoid. 

---

## 11. Use one canonical curve evaluator when curved walls arrive

Do not let:

```text
Plan SVG samples curve one way
3D samples another way
snapping samples another way
length measurement samples fourth way
```

If curves become authored semantics:

```text
Layout curve
↓
canonical evaluator / arc-length model
↓
compileLayoutGeometry()
↓
shared evaluated curve representation
├─ Plan
├─ Three
├─ snapping
└─ dimensions
```

For first curved-wall type, me strongly favor **circular arcs** over cubic Bézier/NURBS.

Arc gives better architectural semantics:

```text
radius
angle
arc length
offset
opening distance
tangent
```

CavalierContours specifically represents line+arc polylines and supports offsetting them directly. 

---

## 12. Mirror has much better product leverage than trim/extend

Mirror maps naturally to both human and agent intent:

```text
mirror this gallery bay across centerline
mirror this room
mirror selected wall group
```

It can stay one deterministic Layout operation.

Trim/extend much more dependent on wall topology, junction semantics and ambiguous intersection selection.

My rank:

```text
mirror     → early follow-up
repeat     → early follow-up
offset     → early/mid follow-up
trim       → later
extend     → later
```

---

## 13. First arrays should bake normal entities

Do not introduce:

```text
ParametricArrayDefinition
ArrayInstanceOverrides
BrokenArrayItems
NestedArrays
```

for P23.

Start:

```text
repeatSelection(count, spacing)
→ N independent normal authored copies
```

Agent still gets durable vocabulary.

Persistent parametric arrays only earn schema when users repeatedly need:

> “change source once, all 24 bays update.”

---

## 14. Same answer for reusable components

First use **templates / recipes**:

```text
Insert Gallery Bay
→ create walls + openings + layout objects
→ normal independent authored structure
```

Do not jump straight to:

```text
definition
instance
override
nested component
detached instance
versioning
```

Figma/SketchUp/Revit-style component machinery creates huge project-model pressure.

Prove 3–5 recurring spatial families first.

---

## 15. Offset should be bounded architectural offset, not arbitrary polygon tool

Two strongest candidates:

**CavalierContours JS** — pure TypeScript, MIT/Apache, lines + first-class arc segments, open/closed polyline offset, 232 translated tests, browser/worker friendly. 

**clipper2-ts** — TypeScript Clipper2 port, Boost license, polygon offset/boolean/triangulation, 258 tests against reference suite. 

First feature should be closer to:

```text
Offset selected wall
Offset simple connected wall chain
distance = 1.2m
side = left/right
```

not:

```text
offset arbitrary self-intersecting compound polygon with holes
```

---

## 16. Spatial indexing not justified yet

RBush is excellent, browser-compatible, MIT, R-tree implementation. Flatbush is strong static index. 

But museum/showroom layouts likely remain small enough that:

```text
compile snap primitives
→ linear candidate scan
```

stays easier and deterministic.

Build a `SnapQuerySource` abstraction so index can be introduced after profiling. Do not add R-tree just because CAD systems can get large.

---

## 17. DXF should be interchange, never project truth

`dxf-parser` gives browser/Node parsing, most 2D entities, layers, blocks/inserts and text under MIT, but current npm release `1.1.2` is old. 

Maker.js remains actively packaged, Apache-2.0, and has DXF/SVG/vector export capability. 

Correct architecture:

```text
DXF
→ parse
→ import candidates
→ normalize units
→ user/semantic conversion
→ validate
→ LayoutDocument
```

Never:

```text
LayoutDocument = DXF graph
```

---

## 18. IFC should be future import adapter only

`web-ifc` remains active browser/WASM infrastructure, MPL-2.0, with browser API, schema types, multithreaded WASM and worker build. 

Good future use:

```text
IFC storey / wall / slab / opening / door / window
→ semantic import candidate
→ validation
→ LayoutDocument
```

Do not internalize IFC relationship graph, BIM property model or geometry engine.

---

## 19. Real CAD kernel threshold much farther away

replicad proves OCCT can work in browser, but its own docs recommend WASM + worker because model computation can be expensive. Its custom OpenCascade package adds another license/runtime layer. 

Me would state explicit technology gate:

> **No BRep kernel until persistent arbitrary solid booleans + fillet/chamfer + STEP roundtrip become core user workflow.**

Walls, rooms, openings, stairs, arcs, profile/extrude, arrays, rails and most architectural helpers do not justify OCCT.

---

## 20. AI value comes from operation vocabulary, not CAD generation model

KittyCAD/Zoo most useful agent reference found. Their current architecture explicitly treats modeling modifications as typed codemods; `src/lang/modifyAst/*.ts` clones and modifies the model AST, while `src/lib/operations.ts` prepares edit operations. They explicitly design intent to work whether created by human, LLM or another codemod, and test argument permutations in Vitest. 

DeepCAD represents CAD as ordered command sequences. CAD-Recode generates CadQuery program sequences rather than raw meshes. These independently reinforce same idea: **semantic operations are more reusable for AI than arbitrary vertex edits.** 

That maps almost perfectly to your North Star.

---

# B. Ranked repository / project shortlist

| Rank | Project | Purpose / state | License | Exact useful modules / surface | Harvest mode | P23 |
|---:|---|---|---|---|---|---|
| **1** | openPlan3D [repo](https://github.com/laanlabs/openPlan3D) | Current Svelte browser floor planner | MIT | `src/lib/utils/wallEditing.ts`, `roomDetection.ts`, `alignment.ts`, `cadExport.ts`, `roomplanImport.ts`; wall/opening/browser tests | **PORT SELECTED ALGORITHMS + TEST IDEAS** | Very high |
| **2** | robust-predicates [repo](https://github.com/mourner/robust-predicates) | Focused robust predicates, current 3.0.3 | Unlicense | `orient2d`, `incircle` public API | **REUSE** | High |
| **3** | Flatten.js [repo](https://github.com/alexbol99/flatten-js) | General 2D geometry | MIT | point/segment/line/arc/polygon/intersection/distance API | **PROTOTYPE / REUSE ADAPTER** | High |
| **4** | CavalierContours JS [repo](https://github.com/msurguy/cavalier-contours-js) | Line+arc polyline offset/boolean | MIT OR Apache-2.0 | `Polyline`, `Shape`, `parallelOffset`, closest point, intersection | **REUSE AFTER SPIKE** | Follow-up |
| **5** | LibreCAD [repo](https://github.com/LibreCAD/LibreCAD) | Mature 2D CAD | GPL | `librecad/src/lib/actions/rs_snapper.cpp`, `rs_previewactioninterface.cpp`, command/modify actions | **STUDY UX + ALGORITHMS ONLY** | High reference |
| **6** | Sweet Home 3D [repo](https://github.com/mjcipriano/sweethome3d) | Mature architectural/interior planner; fork active through v7.15.0 June 2026 | GPL | `PlanController.java`, `WallController.java`, `model/Wall.java`, `DimensionLine.java`; current AI command work | **STUDY** | High reference |
| **7** | Blueprint3D [repo](https://github.com/furnishup/blueprint3d) | Historical web floor planner; stale core | MIT | `src/model/{floorplan,wall,corner,room,half_edge}.ts`; `src/floorplanner/*` | **PORT CONCEPT ONLY** | Medium |
| **8** | KittyCAD / Zoo modeling-app [repo](https://github.com/KittyCAD/modeling-app) | Modern browser CAD + KCL operation model | MIT | `src/lang/modifyAst/*.ts`, specs, `src/lib/operations.ts` | **STUDY OPERATION ARCHITECTURE** | Very high agent relevance |
| **9** | JTS [repo](https://github.com/locationtech/jts) | Mature planar topology | EPL-2 / EDL-1 | `operation/polygonize/Polygonizer.java` | **PORT ALGORITHM / TEST THINKING** | Room follow-up |
| **10** | JSTS [repo](https://github.com/bjornharrtell/jsts) | JS port of JTS | EPL/EDL-family files | polygonize/intersection/topology modules | **STUDY; dependency probably too broad** | Follow-up |
| **11** | clipper2-ts [repo](https://github.com/countertype/clipper2-ts) | TS Clipper2 port | Boost 1.0 | `inflatePaths`, boolean ops, triangulation | **OFFSET SPIKE** | Follow-up |
| **12** | polygon-clipping [repo](https://github.com/mfogel/polygon-clipping) | Focused polygon booleans | MIT | `union`, `intersection`, `difference`, `xor` | **REUSE LATER** | Profile/import |
| **13** | Maker.js [repo](https://github.com/microsoft/maker.js) | Browser/vector CAD toolkit | Apache-2.0 | `packages/maker.js/src/core/dxf.ts`, chains/paths/export | **STUDY / DXF EDGE** | Deferred |
| **14** | dxf-parser [repo](https://github.com/gdsestimating/dxf-parser) | DXF parser | MIT | parser public API / `src/` | **REUSE AT IMPORT EDGE** | Deferred |
| **15** | FreeCAD [repo](https://github.com/FreeCAD/FreeCAD) | Full parametric CAD, active 1.1.1 in 2026 | LGPL-2.1+ | `src/Mod/Sketcher/App/planegcs/GCS.cpp`, Sketcher model | **STUDY ONLY FOR P23** | Solver/parametric reference |
| **16** | SolveSpace [repo](https://github.com/solvespace/solvespace) | Parametric CAD + geometric solver, active | GPL-3+ | `src/slvs/lib.cpp`, solver API/docs | **STUDY / DO NOT EMBED** | Reject global solver |
| **17** | web-ifc [repo](https://github.com/ThatOpen/engine_web-ifc) | Browser IFC parser/writer, WASM | MPL-2.0 | `src/ts/web-ifc-api.ts`, worker/WASM build | **FUTURE ADAPTER** | Long-term |
| **18** | replicad [repo](https://github.com/sgenoud/replicad) | TS facade over OpenCascade/WASM | mixed stack; OCCT build LGPL | sketch/BRep APIs + worker integration | **STUDY ONLY** | Avoid now |
| **19** | JSCAD [repo](https://github.com/jscad/OpenJSCAD.org) | JS CSG / procedural geometry | MIT | `@jscad/modeling` extrusions, booleans, expansions | **STUDY PROFILE/EXTRUDE** | Long-term |
| **20** | CAD-Recode [repo](https://github.com/nanotarv/CAD-RECODE) | Point cloud → CadQuery code | research license; verify before reuse | generated CadQuery command/program representation | **STUDY AGENT VOCABULARY** | Long-term AI |
| **21** | DeepCAD [repo](https://github.com/rundiwu/DeepCAD) | CAD command-sequence learning | research | `cad_json`, `dataset/json2vec.py` | **STUDY REPRESENTATION** | Long-term AI |
| **22** | RBush [repo](https://github.com/mourner/rbush) | Dynamic browser R-tree | MIT | `index.js` | **DEFER UNTIL PROFILED** | Possible later |

Sweet Home current fork shipped v7.15.0 on June 13, 2026 and includes a newer AI design-assistant command layer; this makes it more interesting as interaction/command reference than old SH3D source alone. 

---

# Evaluation matrix

Score = my architecture assessment, not source-provided benchmark.

`5 = best fit`. For **Cost**, 5 means cheap. For **Risk**, 5 means low architecture risk.

| Technology | Arch | Web | TS | SVG | Robust | Semantic | Agent | License | Cost | Maint | Low risk | Verdict |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| openPlan3D | 5 | 5 | 5 | 1 | 2 | 4 | 3 | 5 | 4 | 5 | 4 | **STUDY / PORT SELECTED** |
| robust-predicates | 3 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | **USE NOW** |
| Flatten.js | 4 | 5 | 4 | 5 | 4 | 4 | 4 | 5 | 4 | 5 | 4 | **ADAPT SOON** |
| CavalierContours JS | 4 | 5 | 5 | 5 | 4 | 4 | 5 | 5 | 4 | 4 | 4 | **PROTOTYPE** |
| clipper2-ts | 3 | 5 | 5 | 5 | 5 | 3 | 4 | 5 | 4 | 4 | 4 | **PROTOTYPE LATER** |
| LibreCAD | 5 | 1 | 1 | 2 | 5 | 4 | 3 | 1 | 1 | 5 | 2 | **STUDY** |
| Sweet Home 3D | 5 | 2 | 1 | 2 | 4 | 5 | 4 | 1 | 1 | 5 | 2 | **STUDY** |
| Blueprint3D | 4 | 4 | 3 | 1 | 2 | 3 | 2 | 5 | 3 | 1 | 2 | **STUDY** |
| JTS/JSTS | 4 | 3 | 2 | 5 | 5 | 3 | 3 | 4 | 2 | 5 | 3 | **STUDY / BOUNDED USE** |
| Maker.js | 3 | 5 | 4 | 5 | 3 | 3 | 4 | 5 | 3 | 4 | 3 | **DEFER** |
| dxf-parser | 3 | 5 | 4 | 5 | 2 | 2 | 3 | 5 | 4 | 2 | 4 | **DEFER** |
| FreeCAD | 5 | 1 | 1 | 1 | 5 | 5 | 4 | 3 | 1 | 5 | 1 | **STUDY** |
| SolveSpace | 4 | 1 | 1 | 1 | 5 | 5 | 4 | 1 | 1 | 5 | 1 | **AVOID DEPENDENCY** |
| web-ifc | 4 | 5 | 4 | 3 | 5 | 5 | 4 | 3 | 1 | 5 | 3 | **DEFER** |
| replicad/OCCT | 4 | 4 | 5 | 1 | 5 | 3 | 5 | 2 | 1 | 5 | 1 | **AVOID NOW** |
| KittyCAD/KCL | 3 | 5 | 5 | 2 | 5 | 5 | 5 | 5 | 1 | 5 | 2 | **STUDY OP MODEL** |

---

# C. Capability matrix

| Capability | Best reference | Reusable candidate | Complexity | Architecture risk | Bucket |
|---|---|---|---:|---:|---|
| Numeric wall length | LibreCAD / openPlan3D | existing math + operation layer | Low–Med | Low | **P23 MINIMUM** |
| Numeric wall thickness | openPlan3D / SH3D | existing math | Low | Low | **P23 MINIMUM** |
| Exact opening width/offset | SH3D / openPlan3D | own semantic op | Med | Med | **P23 MINIMUM** |
| Unit parsing/display | LibreCAD | own centralized parser/formatter | Med | Low | **P23 MINIMUM** |
| Transient dimensions | LibreCAD | SVG + existing render model | Low | Low | **P23 MINIMUM** |
| Persistent dimension annotations | LibreCAD/SH3D | own entity later | Med | Med | **FOLLOW-UP** |
| Grid snap | LibreCAD | own | Low | Low | **P23 MINIMUM** |
| Endpoint snap | LibreCAD | own + robust predicates | Low | Low | **P23 MINIMUM** |
| Midpoint snap | LibreCAD | own | Low | Low | **P23 MINIMUM** |
| Intersection snap | LibreCAD | own / Flatten | Med | Low | **P23 MINIMUM** |
| Orthogonal snap | LibreCAD | own | Low | Low | **P23 MINIMUM** |
| Wall/entity projection | LibreCAD | Flatten or own | Low–Med | Low | **P23 MINIMUM** |
| Parallel/perpendicular | LibreCAD | own | Med | Low | **FOLLOW-UP** |
| Smart guides | Figma/CAD pattern | own transient layer | Med | Low | **FOLLOW-UP** |
| Align to reference | openPlan3D/Figma | pure operation | Low | Low | **P23 MINIMUM** |
| Distribution | openPlan3D | pure operation | Low | Low | **FOLLOW-UP** |
| Wall endpoint editing | floor planners | own | Med | Med | **P23 MINIMUM** |
| Wall joins | Blueprint3D / SH3D | own compiler | Med–High | High | existing/foundation |
| Room-face detection | JTS | algorithm port / optional JSTS | High | Med | **FOLLOW-UP assist** |
| Opening attachment | SH3D/openPlan3D | own semantic model | Med | Med | **P23 MINIMUM** |
| Duplicate structure | CAD blocks/floor planners | own graph clone | Med | Low–Med | **P23 MINIMUM** |
| Repeat | CAD arrays | own baked copies | Low–Med | Low | **FOLLOW-UP** |
| Mirror | CAD | own reflection op | Med | Low–Med | **FOLLOW-UP** |
| Bounded offset | Cavalier/Clipper2 | Cavalier JS | Med–High | Med | **FOLLOW-UP** |
| Trim | LibreCAD | own after graph mature | High | High | **FOLLOW-UP late** |
| Extend | LibreCAD | own after graph mature | Med–High | High | **FOLLOW-UP late** |
| Circular arc wall | CAD + Cavalier | Flatten/Cavalier helpers | High | Med–High | **LONG-TERM / demand** |
| Bézier/NURBS walls | general CAD | none recommended | Very high | High | **DEFER** |
| Platform preset | floor planners | existing Layout primitive | Low | Low | **P23 MINIMUM if primitive exists** |
| Column preset | openPlan/floor planners | existing primitive | Low | Low | **P23 MINIMUM if primitive exists** |
| Stairs | SH3D/openPlan | own semantic entity | High | High | **LONG-TERM** |
| Levels | SH3D/BIM | own explicit model | Very high | High | **LONG-TERM** |
| Railings | BIM/CAD | path + repeat later | High | Med | **LONG-TERM** |
| Linear array | CAD | baked copies | Low | Low | **FOLLOW-UP** |
| Persistent array entity | parametric CAD | own new entity | High | High | **LONG-TERM** |
| Templates | CAD blocks | own operation recipes | Low–Med | Low | **FOLLOW-UP** |
| Definition/instance components | SketchUp/Revit/Figma | own future system | Very high | High | **LONG-TERM** |
| Profile/extrude | JSCAD/CAD | Earcut + compiler | High | Med | **LONG-TERM** |
| Sweep | CadQuery/JSCAD | none needed now | Very high | High | **LONG-TERM** |
| Revolve | CadQuery/JSCAD | none needed now | High | High | **LONG-TERM / low priority** |
| Roof helpers | BIM | own later | High | High | **DEFER** |
| Box selection | CAD/Figma | own SVG hit query | Low | Low | **FOLLOW-UP** |
| CAD crossing selection | LibreCAD | own later | Low | UX cost | **DEFER** |
| DXF import | dxf-parser | dxf-parser | Med–High | Low if adapter | **LONG-TERM edge** |
| SVG export | native Plan | existing SVG model | Low | Low | **FOLLOW-UP/edge** |
| SVG semantic import | — | none | High ambiguity | High | **REJECT semantic import** |
| IFC | web-ifc | web-ifc worker | Very high | Med at boundary | **LONG-TERM edge** |
| Global geometric solver | FreeCAD/SolveSpace | none | Extreme | Extreme | **REJECT** |
| BRep/STEP authoring | OCCT/replicad | none | Extreme | Extreme | **REJECT NOW** |

---

# Wall representation recommendation

Four common models:

| Model | Good | Bad |
|---|---|---|
| **centerline + thickness** | compact, dimensions easy, walls intuitive | joins must be derived |
| **stored boundary polygon** | rendering direct | editing, joins, openings and wall identity painful |
| **vertex-edge graph** | topology explicit | schema complexity; user semantic walls can blur into graph edges |
| **parametric segment + thickness + attachments** | supports line/arc, openings, dimensions, one semantic wall | compiler more sophisticated |

Best long-term fit likely:

```text
semantic wall
  stable identity
  canonical direction
  line / later arc geometry
  thickness
  height
  explicit attachments

↓ compiler

join topology
wall faces
opening cuts
Plan edges
3D wall meshes
snap primitives
```

But this is migration-sensitive.

> **Need exact current Layout wall/room types before recommending migration.**

Me would absolutely not rewrite wall storage as part of P23 unless current schema blocks numeric editing/opening semantics.

---

# Room topology recommendation

Use hybrid:

```text
EXPLICIT AUTHORED
Room
  id
  ownership
  metadata
  local frame

DERIVED
Wall subdivision graph
Faces
Dangles
Cut edges
Invalid loops
Adjacency candidates
```

JTS Polygonizer specifically demonstrates why noding matters: edges must meet at endpoints, and malformed linework should produce diagnostics instead of silently pretending everything forms rooms. 

Useful semantic operations later:

```ts
detectRoomCandidates()
createRoomFromFace(...)
validateRoomBoundary(...)
rebindRoomBoundary(...)
splitRoom(...)
mergeRooms(...)
```

Derived faces never become room IDs automatically.

---

# Opening model recommendation

Concept only:

```ts
type WallAttachment = {
  wallId: LayoutId;

  // Physical authored placement along canonical wall path.
  offsetFromStart: number;

  width: number;
};
```

Then specific subtype:

```ts
Door:
  height
  swing
  hinge
  side

Window:
  height
  sillHeight
```

For curved wall:

```text
offset = arc length along canonical wall path
```

not Bézier parameter `t`.

### Required deterministic transform rules

**Resize wall**

Pick explicit fixed endpoint.

```text
fixed start
→ opening offset stays same
→ reject/clamp only under defined policy if wall becomes too short
```

**Reverse wall direction**

```text
s' = wallLength - s
left/right semantics invert
door handedness transforms explicitly
```

**Split wall at distance k**

```text
opening before k → first wall
opening after k  → second wall with offset s-k
opening crossing split → reject or explicit resolution
```

No silent orphan.

**Duplicate**

```text
wall cloned
→ new wall id
→ opening cloned
→ wallId remapped
→ offset preserved
```

**Mirror**

```text
position reflected
wall direction recalculated
opening offset recalculated from mirrored canonical start
side/hinge semantics transformed
```

This single reference model buys huge later leverage.

---

# D. Exact P23 Minimum me would write now

Me would change your current proposed P23 slightly.

## P23.0 — precision/operation foundation

Not user headline, but mandatory engineering base.

Create semantic Layout operation boundary:

```text
plan
→ validate
→ preview
→ commit
```

Requirements:

- operation takes explicit semantic IDs
- no SVG/DOM inputs
- no Three objects
- no session selection inside operation
- no partial mutation
- deterministic reference updates
- single Layout history transaction
- same operation callable by UI/test/future agent
- preview produces no history

This should precede clever tools.

---

## P23.1 — direct precision

### Wall

Minimum:

```text
length
thickness
angle OR endpoint coordinates
```

Do not promise arbitrary room width/depth until current room model known.

Flow:

```text
select wall
→ selected dimension shown
→ click value or Inspector field
→ enter 4.2 m
→ choose/preserve defined anchor endpoint
→ preview
→ commit
```

### Opening

```text
width
wall-relative position
existing height/sill fields where already modeled
```

### Layout objects

Existing supported fields:

```text
X
Z
yaw
existing dimensions where Layout mode owns them
```

No ownership movement.

---

## P23.2 — bounded snap engine

Minimum types:

```text
grid
endpoint / corner
midpoint
intersection
nearest-on-wall
orthogonal
opening edge while opening editing
```

No tangent, generalized parallel constraints, arbitrary tracking system.

Tolerance in CSS pixels.

Geometry source exclusively compiled canonical layout.

---

## P23.3 — opening direct manipulation

For existing door/window/opening entities:

```text
drag along wall
resize width
numeric position
numeric width
flip existing directional semantics where supported
```

Must preserve wall attachment.

Must reject overlap/out-of-wall states deterministically or expose explicit validation state.

---

## P23.4 — structure duplicate

First useful closure:

```text
duplicate selected Layout structure
```

For room duplication, likely:

```text
room
+ owned/participating layout structure
+ Layout-owned dependent openings
+ Layout objects explicitly in operation closure
```

Not:

```text
Scene entities automatically
```

Because Scene ownership separate. 

Use two-pass cloning:

```text
1. collect closure in stable order
2. allocate new IDs
3. build oldId → newId map
4. clone entities
5. remap internal references
6. transform copy
7. validate full result
8. commit once
```

---

## P23.5 — targeted alignment

Me would promote this.

Not full distribution toolbar.

Support useful semantic actions:

```text
align selected Layout objects to reference X
align selected Layout objects to reference Z
center object on wall segment
center object in room/reference bounds
```

Where scene objects involved, equivalent Scene operation must mutate **only SceneDocument**, even if architecture provides reference geometry.

No mixed-document command.

---

## P23.6 — primitive presets, conditional

Only include:

```text
Column
Platform
Plinth
```

if current `LayoutDocument.objects` already has enough primitive semantics to implement them as:

```text
preset → existing primitive
```

If new serialized architectural entity needed merely to show a round column button, **defer it**.

Need current Layout-object types to decide.

---

# Explicit P23 Minimum non-scope

```text
persistent dimension annotations
rulers / draggable guides
mirror
offset
trim/extend
general arrays
persistent components
curved-wall migration
stairs
levels
railings
profile/extrude
DXF
IFC
global constraint solver
BRep
WASM geometry kernel
```

This gives coherent first slice without turning P23 into six months of CAD substrate.

---

# E. P23 Follow-up ranking

Score 1–5. Higher better except risk, where 5 = safer.

| Rank | Capability | Human | Agent | Reuse | Cost | Low risk | Decision |
|---:|---|---:|---:|---:|---:|---:|---|
| **1** | Mirror selected Layout structure | 5 | 5 | 5 | 4 | 4 | **PROMOTE EARLY** |
| **2** | Repeat / linear baked array | 5 | 5 | 5 | 5 | 5 | **PROMOTE EARLY** |
| **3** | richer snap + temporary guides | 5 | 4 | 4 | 4 | 5 | **PROMOTE** |
| **4** | bounded wall/chain offset | 4 | 5 | 5 | 3 | 3 | **PROMOTE AFTER SPIKE** |
| **5** | box multi-select | 4 | 2 | 4 | 5 | 5 | **Useful enabler** |
| **6** | distribute/equal spacing | 4 | 5 | 5 | 5 | 5 | **Cheap follow-up** |
| **7** | persistent dimension annotation | 3 | 2 | 3 | 3 | 3 | **Only if drafting demand** |
| **8** | trim/extend | 3 | 4 | 3 | 2 | 2 | **Later** |
| **9** | circular arc wall | 4 | 5 | 5 | 2 | 2 | **Demand-gated** |
| **10** | levels | 5 for architecture users | 5 | 5 | 1 | 1 | **LONG-TERM, not P23 follow-up** |

Interesting result: **baked repeat deserves earlier promotion than your current roadmap suggests.** Very cheap operation. Huge for exhibition bays, columns, booth dividers, windows, shelves.

---

# Mirror bounded scope

First mirror should be:

```text
Mirror selected Layout structure
around explicit world/room-local line
```

Not “generic CAD mirror entity.”

Operation computes:

```text
point reflection
wall endpoint reflection
yaw reflection
winding correction
opening reference remap
door hand/swing transformation
```

Source remains untouched.

One Layout history entry.

No live persistent mirror relation.

---

# Offset bounded scope

Start only:

```text
single straight wall
or
simple non-branching connected wall chain
```

Parameters:

```text
distance
side
join style
```

Good first join style:

```text
miter with safe limit
```

Then maybe bevel.

Round join only when arc infrastructure ready.

Reject ambiguous branch junctions rather than guessing.

---

# Trim / extend

Me keep late.

Why:

```text
user clicks wall A
then boundary B
```

sounds simple.

Internally need answer:

- which semantic wall changes?
- what about attached opening beyond trim?
- what if wall belongs to two rooms?
- what if intersection lies behind start?
- what if extension crosses another topology edge?
- does room boundary change?
- does wall identity survive?
- does connected corner migrate?

Much higher semantic risk than mirror/repeat.

---

# F. Recommended geometry stack

## P23

```text
Authored geometry
→ existing LayoutDocument

Canonical derivation
→ compileLayoutGeometry()

Basic vector / line math
→ EXISTING MUSEUM MATH

Robust orientation predicates
→ robust-predicates

Intersections / distance / arc helpers
→ existing code first
→ @flatten-js/core only if spike proves value

Polygon boolean
→ NONE in P23

Offset
→ NONE in minimum

Triangulation
→ existing canonical compiler
→ Earcut only if profile/extrude later needs it

Spatial index
→ linear scan

DXF
→ none

IFC
→ none

BRep
→ none
```

### Why `robust-predicates`

Tiny surface. Solves hard numerical classification problem. Does not demand new data model. 

### Why not full Flatten immediately

Your existing geometry compiler may already implement enough intersection/distance. No reason to duplicate utilities before measuring gap.

---

## Follow-up

```text
Polyline/arc offset
→ cavalier-contours-js

Polygon boolean
→ polygon-clipping
or clipper2-ts if offset + boolean convergence valuable

Spatial index, if profiling proves need
→ RBush

DXF import
→ dxf-parser

DXF export
→ small custom writer or bounded Maker.js adapter
```

`polygon-clipping` already depends on `robust-predicates` and focuses only on union/intersection/difference/xor. 

---

## Long-term

```text
Profile triangulation
→ Earcut after validity checks

IFC
→ web-ifc in Worker/WASM boundary

BRep
→ no dependency unless product gate crossed
```

Earcut explicitly assumes valid polygons and does not guarantee correct triangulation for arbitrary malformed rings, so validation stays before triangulation. 

---

# Libraries me would reject for current stack

### Turf

GIS semantics. Wrong abstraction.

### Concaveman

Concave hull useful for point clouds, not authored architecture. 

### Delaunator

Excellent Delaunay triangulation, but no P23 problem requires it. 

### Simplify.js

Polyline simplification can destroy authored architectural precision. Good visualization tool, bad canonical geometry operation. Package also old/stable rather than actively evolving. 

### JSTS as blanket dependency

Very capable but broad GIS/topology API. Use JTS ideas and targeted utilities first.

---

# G. Snapping architecture

Proposed derived flow:

```text
Pointer CSS position
       ↓
existing Plan screen→world transform
       ↓
world X/Z candidate
       ↓
CompiledLayoutGeometry
       ↓
build/query derived SnapPrimitives
       ↓
tool/context filtering
       ↓
generate candidates
       ↓
rank
       ↓
SnapPreview
       ↓
semantic operation args
       ↓
owner-specific plan/validation
       ↓
one commit
```

No snap information serialized.

No new geometry truth.

---

## Derived runtime type

Concept:

```ts
type SnapPrimitive =
  | {
      kind: 'point';
      sourceId: string;
      semantic:
        | 'wall-endpoint'
        | 'room-corner'
        | 'wall-midpoint'
        | 'opening-edge';
      point: Vec2;
    }
  | {
      kind: 'segment';
      sourceId: string;
      semantic:
        | 'wall-centerline'
        | 'wall-face'
        | 'opening-span';
      a: Vec2;
      b: Vec2;
    };
```

This is **compiled/session runtime only**.

Not `LayoutDocument`.

---

## Candidate ranking

Me would rank lexicographically:

```text
1. candidate valid for current tool
2. semantic snap priority
3. screen-space distance
4. stable source ID / candidate key
```

Suggested priority:

```text
endpoint / explicit intersection
opening edit target
midpoint / center
orthogonal guide
nearest-on-entity
grid
```

But context changes priority.

While dragging opening:

```text
opening edge > wall endpoint > midpoint > grid
```

While creating wall:

```text
existing endpoint > intersection > orthogonal > grid
```

This avoids one global magical ranking.

---

## Zoom

Tolerance:

```ts
worldRadius = snapRadiusCssPx / planScale
```

So same visual reach at 25% and 400% zoom.

Never store `world snap tolerance = 0.2m` as pointer UX.

---

## Hysteresis

Once candidate acquired:

```text
keep candidate until pointer leaves slightly larger release radius
```

Prevents rapid snap flicker between endpoint/midpoint/grid.

Exact threshold should come from interaction testing, not hard-coded research recommendation.

---

## Agent behavior

Agent should usually **not** use fuzzy pointer snapping.

Prefer:

```ts
alignToWall({
  entityId,
  wallId,
  mode: 'center'
});
```

or:

```ts
moveWallEndpoint({
  wallId,
  endpoint: 'end',
  target: { kind: 'wallEndpoint', wallId: otherId, endpoint: 'start' }
});
```

Same geometric resolver can validate references, but agent intent stays semantic.

---

# H. Operation architecture

Me recommend conceptual discriminated commands.

Not claim current API.

```ts
type LayoutOperation =
  | {
      kind: 'wall.setLength';
      wallId: string;
      length: number;
      fixedEndpoint: 'start' | 'end';
    }
  | {
      kind: 'wall.moveEndpoint';
      wallId: string;
      endpoint: 'start' | 'end';
      target: Vec2;
    }
  | {
      kind: 'opening.move';
      openingId: string;
      offset: number;
    }
  | {
      kind: 'opening.resize';
      openingId: string;
      width: number;
    }
  | {
      kind: 'structure.duplicate';
      ids: string[];
      translation: Vec2;
    };
```

Follow-up:

```ts
| {
    kind: 'structure.mirror';
    ids: string[];
    axis: Line2;
  }
| {
    kind: 'structure.repeat';
    ids: string[];
    count: number;
    delta: Vec2;
  }
| {
    kind: 'path.offset';
    ids: string[];
    distance: number;
    side: 'left' | 'right';
  };
```

---

## Planning contract

```ts
type PlannedLayoutChange = {
  next: LayoutDocument;
  changedIds: string[];
  createdIds: string[];
  deletedIds: string[];
  diagnostics: LayoutDiagnostic[];
};
```

Could be patches instead of full `next`. Exact representation depends current history/store.

Important contract:

```ts
planLayoutOperation(
  document,
  operation,
  context
): Result<PlannedLayoutChange, LayoutOperationError>;
```

No partial writes.

---

## `setWallLength`

**Input**

```text
wallId
length
fixed endpoint
```

**Validate**

- finite positive length
- resulting wall nondegenerate
- joined endpoint movement valid
- attached openings still valid
- resulting topology allowed

**Document**

`LayoutDocument` only.

**History**

one `layout` entry.

---

## `resizeOpening`

**Input**

```text
openingId
width
```

**Validate**

- width > minimum
- interval remains on wall
- collision/overlap according defined policy
- opening type restrictions

**Refs**

No reference change.

**History**

one Layout entry.

---

## `duplicateStructure`

**Input**

```text
explicit selected semantic IDs
transform
closure policy
```

**Validation**

- selection clonable
- closure internally complete
- destination legal enough for product rules

**Refs**

Two-pass old→new map.

**Scene**

No Scene mutation.

---

## `alignLayoutEntities`

Only transform-independent Layout objects first.

Do not use it to “align three connected walls” unless exact wall topology semantics explicitly defined.

Equivalent Scene operation lives separately:

```ts
alignScenePlacements(...)
```

Architecture may provide reference geometry. Scene writes Scene only. This follows Arrange ownership rule. 

---

# Gesture architecture

```text
pointerdown
→ capture original command intent

pointermove
→ derive operation args
→ plan operation
→ show transient preview

pointerup
→ commit one validated planned operation
→ one history entry

Esc
→ discard preview
→ zero document changes
→ zero history
```

This pattern aligns with LibreCAD's long-lived separation of preview actions from completed operations and with openPlan's plan-before-apply wall resize.  

---

# Svelte 5 shape

Concept only:

```svelte
<script lang="ts">
  let gesture = $state<LayoutGesture | null>(null);

  let preview = $derived.by(() => {
    if (!gesture) return null;
    return planLayoutOperation(layoutDocument, gesture.operation);
  });

  function commit() {
    if (!preview?.ok) return;
    commitLayoutOperation(preview.value);
    gesture = null;
  }

  function cancel() {
    gesture = null;
  }
</script>
```

For high-frequency expensive geometry, compute imperative transient preview or worker result instead of forcing huge `$derived` recomputation.

Document state still outside SVG DOM.

---

# I. Data-model pressure

| Capability | Pressure | Comment |
|---|---|---|
| Numeric input UI | **NO SCHEMA CHANGE** | operation/UI only |
| unit parsing/formatting | **NO SCHEMA CHANGE** | unless current document incorrectly persists display units |
| transient dimensions | **NO SCHEMA CHANGE** | derived presentation |
| persistent dimensions | **NEW SEMANTIC ENTITY** | only later |
| grid snap | **NO SCHEMA CHANGE** | session setting |
| object snap | **NO SCHEMA CHANGE** | derived geometry |
| guides | **NO SCHEMA CHANGE** if transient | persistent guides would need entity |
| align | **NO SCHEMA CHANGE** | semantic command |
| duplicate | **NO SCHEMA CHANGE** | reference-remap command |
| baked repeat | **NO SCHEMA CHANGE** | normal copies |
| persistent array | **NEW SEMANTIC ENTITY** | definition + generation semantics |
| mirror | **NO SCHEMA CHANGE** | command, no persistent relation |
| persistent symmetric relation | **MAJOR MODEL CHANGE** | reject |
| bounded offset creating walls | **NO SCHEMA CHANGE** | if result normal walls |
| persistent offset relation | **NEW SEMANTIC ENTITY** | unnecessary |
| wall-relative opening | **SMALL EXTENSION or migration** | depends current schema |
| room-face assist | **NO SCHEMA CHANGE** | derived topology |
| derived-room-as-truth | **MAJOR MODEL CHANGE** | reject |
| circular wall segment | **SMALL/MAJOR depends current wall model** | need current types |
| column/platform preset | **NO CHANGE if primitive exists** | otherwise inspect |
| stairs | **NEW SEMANTIC ENTITY** | if architectural |
| levels | **MAJOR MODEL CHANGE** | coordinate + ownership decision |
| railing | **NEW SEMANTIC ENTITY** if procedural | imported Scene asset avoids it |
| templates | **NO SCHEMA CHANGE** | expand to normal entities |
| component definition/instance | **NEW DURABLE DOMAIN/MODEL** | long-term |
| profile/extrude | **NEW SEMANTIC ENTITY** | profile + height/material |
| DXF | **NO INTERNAL SCHEMA CHANGE** | import adapter/candidates |
| SVG export | **NO SCHEMA CHANGE** | presentation |
| SVG semantic import | **high ambiguity** | avoid |
| IFC | **NO INTERNAL SCHEMA CHANGE ideally** | adapter only |
| global constraints | **MAJOR MODEL CHANGE** | reject |
| BRep | **MAJOR MODEL CHANGE** | reject |

---

# Stairs

Research conclusion: do not ship “stair mesh generator” and call it architectural stairs.

Semantic stair eventually needs more than:

```text
width
depth
step count
```

Need relationships to:

```text
source level
destination level
elevation
direction
landing
clearance
walkable path
Plan symbol
camera/visitor traversal
support surfaces
```

openPlan3D can draw straight/L/U stairs, useful as UI/reference, but this does not remove Museum-specific semantic work. 

**Bucket:** LONG-TERM / demand-gated.

---

# Levels

Current architecture decision should not be guessed.

Potential models:

### Option A

```text
world coordinates everywhere
Level { elevation }
entities tagged levelId
```

Simpler interoperability.

### Option B

```text
Level local frame
→ rooms local to Level
→ scene objects room-local
```

Stronger hierarchy but adds another transform frame.

Because you already rely on room-local transforms, introducing level-local frame changes transform composition.

> Need exact current `LayoutDocument`, room frame, and `compileLayoutGeometry()` transform types before choosing.

**Bucket:** LONG-TERM.

---

# Railings

For now:

```text
decorative railing
→ imported Scene asset
```

Later when authoring pattern repeatedly needed:

```text
semantic railing
  path
  height
  rail profile
  post spacing
```

Could share path + repetition infrastructure.

Do not build before path/repetition themselves proven.

---

# Profile / extrude

Good long-term bounded capability:

```text
closed 2D profile
+
height
=
architectural extrusion
```

Not arbitrary mesh edit.

Validation:

```text
simple closed ring
no self intersection
minimum edge length
consistent winding
holes optional later
```

Compiler owns triangulation + sides.

Earcut good derived triangulation tool only after profile validity. 

Useful:

- plinth
- custom display wall
- simple podium
- raised floor
- architectural blocking volume

**LONG-TERM**, but much better fit than sweep/revolve.

---

# Sweep / revolve

### Sweep

Potential:

- railing profile
- molding
- track
- trim

Could eventually earn place.

### Revolve

Potential:

- column
- decorative architectural profile

But imported asset usually cheaper.

Both **LONG-TERM**, with sweep higher value than revolve.

---

# Roofs

Current exhibition/showroom wedge gives low leverage.

**DEFER** until product demonstrates exterior/building authoring demand.

Do not contaminate P23.

---

# Persistent components

Me agree with current North Star: prove families first.

Sequence:

```text
Phase 1
Template operation
"Insert Exhibition Bay"

Phase 2
Reusable saved template

Phase 3, only if needed
Definition + instance

Phase 4, much later
Overrides / nested components
```

This avoids Revit-family rabbit hole.

---

# Box/lasso selection

First behavior:

```text
drag empty Layout canvas
→ rectangle
→ select eligible entities fully/intersecting according one simple documented rule
```

Me would use **intersects rectangle** or **fully enclosed** consistently.

Do not initially implement AutoCAD's directional distinction:

```text
left→right = enclosed
right→left = crossing
```

LibreCAD supports this richer grammar, but Museum does not need that cognitive burden yet. 

Stable selection ordering should follow canonical document/render order, not hit iteration randomness.

---

# Guides/rulers

P23:

```text
temporary extension guide
orthogonal guide
dimension preview
snap marker + semantic label
```

Follow-up:

```text
equal-spacing smart guide
parallel guide
angle readout
```

Defer:

```text
desktop-style rulers
dragged persistent guide objects
```

unless users start producing presentation drawings.

---

# DXF minimum future boundary

### Import

Support first:

```text
LINE
LWPOLYLINE / POLYLINE
ARC
CIRCLE
layers
BLOCK/INSERT where flattenable safely
units
```

Then:

```text
DXF
→ reference/import candidate
→ explicit conversion:
   line/polyline → wall candidate
   closed polyline → profile/room-boundary candidate
→ validation
→ LayoutDocument
```

Do not infer doors/windows from arbitrary CAD blocks without explicit mapping.

### Export

Start:

```text
wall center/faces
openings
simple dimensions
layer grouping
```

Maker.js may help at boundary, but custom bounded export may actually be easier than bringing whole package. 

---

# SVG

**Export:** yes. Natural.

```text
PlanRenderModel
→ SVG drawing
```

**Import:** treat as:

```text
reference
or bounded profile candidate
```

not semantic rooms/walls.

SVG says how shape looks. Usually not what architectural object means.

---

# IFC

Potential useful subset later:

```text
IfcBuildingStorey
IfcWall / IfcWallStandardCase
IfcSlab
IfcOpeningElement
IfcDoor
IfcWindow
```

But even these mappings need normalization because IFC geometry/property models can vary widely.

Use worker/WASM. `web-ifc` already ships worker/multithreaded WASM support. 

---

# Worker / WASM boundaries

| Work | P23 execution |
|---|---|
| point/segment distance | main thread TS |
| snap candidates | main thread TS |
| endpoint/intersection predicates | main thread TS |
| wall resize | main thread TS |
| duplicate/mirror | main thread TS |
| modest room-face detection | main thread TS |
| bounded offset | main thread TS first |
| large topology/import | Worker if measured |
| large DXF | Worker candidate |
| IFC | **WASM Worker** |
| BRep/OCCT | **WASM Worker**, but deferred |

Your North Star technology gate already says Rust/WASM only after real bottleneck. Research gives no reason to change it. 

---

# Geometry robustness policy

This should be P23 engineering requirement.

## Never rely on one epsilon

Define separate concepts:

```text
coordinate comparison tolerance
minimum authored segment length
intersection classification tolerance
pointer snap radius
display rounding precision
```

---

## Normalize before expensive topology

Check:

```text
finite coordinates
duplicate adjacent points
zero-length segments
near-zero wall lengths
duplicate wall references
invalid opening width
opening beyond wall
self-intersection
overlap / collinearity
ring winding
zero-area rings
```

---

## Use robust predicate for classification

Examples:

```text
orientation
collinearity
segment-side test
```

Then tolerance only where product semantics really require “close enough.”

---

## Deterministic outputs

When geometric outputs could arrive different order:

```text
sort by semantic/stable key
```

Do not use timestamps to create topology identity.

Current openPlan `detectRooms()` currently creates fallback room IDs partly using `Date.now()`. That is fine warning example; do not port that into Museum. 

---

# J. Required CAD reliability tests

## Precision

```text
wall = 3m
setWallLength(wall, 4m, fixed=start)

→ start unchanged
→ end deterministic
→ connected endpoint semantics preserved
→ compiled Plan and 3D agree
→ one layout history entry
```

---

## Reject

```text
setWallLength(wall, 0)

→ error
→ document byte/structural equality unchanged
→ no history
```

---

## Unit parsing

```text
display metric
enter "4.2 m"
→ canonical internal value

switch imperial
→ same authored geometry
→ formatting changes only
```

openPlan's own QA found unit/display inconsistencies across dimension surfaces. Worth turning into explicit fixture class. 

---

## Snap zoom invariance

```text
pointer 5 CSS px from endpoint at 50% zoom
pointer 5 CSS px from endpoint at 400% zoom

→ same snap candidate
```

---

## Snap tie

```text
endpoint and grid both same screen distance
→ documented semantic priority wins
→ same result every run
```

---

## Snap cancellation

```text
drag wall endpoint
snap preview appears
Esc

→ LayoutDocument unchanged
→ history unchanged
```

---

## Opening move

```text
door offset = 1.2m
drag along wall
→ wallId same
→ new offset deterministic
→ width unchanged
→ one history entry
```

---

## Wall shrink around opening

```text
wall contains 0.9m door
shrink wall below legal opening interval

→ operation rejected
→ no partial wall move
```

Do not silently delete/move opening.

---

## Wall split

```text
wall length 6m
opening center 4m
split at 3m

→ opening transferred to second wall
→ offset = 1m
→ source reference gone
→ new reference valid
→ one transaction
```

if split supported.

---

## Duplicate

```text
room with:
4 walls
1 door
2 windows
3 Layout objects

duplicate

→ every cloned ID new
→ all internal refs point to clones
→ no clone references source wall accidentally
→ source untouched
→ SceneDocument untouched
```

---

## Duplicate + room-local Scene

```text
source room owns Scene Chair A

duplicate Layout room

→ Chair A not duplicated
→ SceneDocument byte-equivalent
```

Unless later explicit composite operation says otherwise.

---

## Mirror

```text
asymmetric room
left-hinged door

mirror around vertical axis

→ geometry reflected
→ valid door attachment
→ handedness follows defined mirror rule
→ source unchanged
```

---

## Offset

Fixtures:

```text
single segment
L-chain
acute corner
obtuse corner
near-collinear chain
tiny segment
self-intersecting input
offset collapse
large coordinates
very small offset
arc+line chain later
```

Compare Cavalier and Clipper2 outputs.

---

## Room assist

```text
rectangle
L-shape
two rooms sharing wall
T-junction divider
grid of 10 rooms
dangling interior wall
overlapping wall
self-intersecting loop
hole/courtyard later
```

This exact family catches failures documented by openPlan's earlier QA. 

---

## Plan/3D geometry parity

For every compiled architectural fixture:

```text
Plan boundary identities
3D wall adapter boundary identities
snap geometry references

→ derive from same CompiledLayoutGeometry
```

No consumer-side remeasurement.

This directly enforces your current geometry contract. 

---

# K. Do-not-build list

## 1. Global geometric constraint solver

Why trap:

- persistent dependency graph
- overconstraint states
- underconstraint states
- solver conflict UI
- diagnosis
- convergence
- ordering/priority
- schema burden
- agent must resolve conflicting constraints

FreeCAD/SolveSpace show real scale. 

**Reject.**

---

## 2. BRep kernel

Would bring:

- separate topological model
- WASM/kernel lifecycle
- generated BRep identity
- potentially second serialization truth
- high bundle cost
- worker coordination
- CAD-class debugging

No current product need.

**Reject until explicit STEP/solid-authoring trigger.**

---

## 3. General polygon/solid booleans as user tool

Profile/extrude may internally need booleans later.

That does not mean user needs:

```text
Union
Subtract
Intersect
```

for arbitrary architecture.

**Reject user-facing general solids.**

---

## 4. Persistent CAD command console

LibreCAD command line good for CAD professionals; supports exact coordinates and commands. 

Museum should instead expose:

```text
Inspector numeric input
inline dimension edit
agent semantic API
```

A command console duplicates UI/agent vocabulary without product need.

---

## 5. Full drafting annotation system

Dimension styles, leaders, text style, paper space, plot layouts, title blocks.

Useful to drawing-document CAD.

Not core spatial-experience authoring.

---

## 6. Full BIM property graph

No:

```text
MEP
structural loads
cost schedules
construction phases
classification codes
BIM coordination
```

IFC import can remain edge.

---

## 7. STEP authoring

STEP import/export only earns work if advanced manufactured/product geometry becomes product wedge.

---

## 8. Generic mesh edit

Permanent non-goal already right. 

---

## 9. Persistent inferred room ownership

Never:

```text
object lies inside room polygon
therefore roomId = room
```

Hard conflict with explicit ownership and room-local transforms.

---

## 10. Canvas/Konva/Fabric rewrite

Nothing research found justifies abandoning SVG.

Floor planners using Canvas mostly demonstrate implementation history, not capability you cannot achieve with SVG. Blueprint3D and openPlan3D both tightly mix canvas/render/controller concerns in places; that is not an advantage for your architecture. 

---

# L. Harvest plan

## Clone now

### 1. openPlan3D

Inspect:

```text
src/lib/utils/wallEditing.ts
src/lib/utils/alignment.ts
src/lib/utils/roomDetection.ts
src/lib/utils/cadExport.ts
src/lib/utils/roomplanImport.ts
src/lib/utils/projectValidation.ts
tests/browser/wall-dimensions.spec.ts
tests/wall-editing*
tests/opening*
tests/room*
```

Harvest:

```text
atomic planning
edge-case tests
dimension/opening UI ideas
presets
import validation lessons
```

Not renderer architecture.

---

### 2. LibreCAD

Study:

```text
librecad/src/lib/actions/rs_snapper.cpp
librecad/src/lib/actions/rs_previewactioninterface.cpp
modify actions
command parsing
```

`rs_snapper.cpp` is ~1,658 LOC of mature snapping implementation. GPL means concept/algorithm study, not casual source transplant. 

---

### 3. Sweet Home 3D

Study:

```text
PlanController.java
WallController.java
Wall.java
DimensionLine.java
DoorOrWindow model
```

Especially:

- direct manipulation
- wall/room semantics
- grouped undo
- current AI editing commands
- levels UX

GPL: study.

---

### 4. Blueprint3D

Study:

```text
corner.ts
wall.ts
room.ts
half_edge.ts
floorplan.ts
```

Specifically wall join geometry.

Avoid Three coupling. 

---

### 5. KittyCAD modeling-app

Study:

```text
src/lang/modifyAst/*.ts
src/lang/modifyAst/*.spec.ts
src/lib/operations.ts
PRINCIPLES.md
```

Best reference for “human + agent + tests share semantic modeling intent.” 

---

# Prototype now

## Spike A — snap kernel

Use current `CompiledLayoutGeometry`.

Implement:

```text
grid
endpoint
midpoint
intersection
projection
orthogonal
```

Dependencies:

```text
robust-predicates
+
either existing math
or Flatten adapter
```

Test zoom/ties/hysteresis/degenerate intersections.

**Success gate:** no change to serialized Layout schema.

---

## Spike B — wall/opening semantic transforms

Pure test harness. No UI.

Implement hypothetical operations against current types:

```text
resize wall
reverse wall
split wall
duplicate wall
mirror wall
```

with one attached door/window.

This spike decides whether current opening representation survives P23 unchanged.

Most important technical spike.

---

## Spike C — structure clone/remap

Fixture:

```text
room
walls
openings
Layout objects
external references
```

Build deterministic two-pass ID remapper.

Prove:

```text
source untouched
internal clone refs correct
Scene untouched
one command
```

---

## Spike D — offset bake-off

Same pathological fixtures through:

```text
cavalier-contours-js
clipper2-ts
```

Compare:

- line chains
- acute joins
- self-intersections
- offset collapse
- arc support
- performance
- deterministic output
- bundle cost

Cavalier likely wins if circular arcs become canonical; Clipper2 likely stronger if polygon shell operations dominate. 

---

## Spike E — assisted room topology

Do not create rooms automatically.

Input compiled/noded wall segments.

Output:

```ts
{
  faces,
  dangles,
  cutEdges,
  invalidRings
}
```

Use JTS Polygonizer behavior as correctness reference. 

Compare against explicit Room entities.

Goal:

```text
validation / candidate creation
```

not replacement ownership.

---

# Study before final P23 implementation brief

Research broad pass done.

Four codebase-specific things still block *migration-level* certainty:

```text
1. exact LayoutDocument wall / room / opening / Layout object types

2. compileLayoutGeometry()
   input/output types,
   especially joins, openings and room frames

3. current Layout history / transaction / mutation API

4. current Plan pointer/snap coordinate-transform utilities
```

With those, me can convert this into exact P23 file-by-file architecture without guessing.

---

# Long-term reference shelf

```text
JTS/JSTS
  room topology / polygonization

CavalierContours
  line+arc offset

polygon-clipping / Clipper2
  booleans

Earcut
  profile triangulation

Maker.js
  DXF/vector interchange

web-ifc
  BIM import edge

JSCAD
  bounded procedural/extrude ideas

FreeCAD / SolveSpace
  solver lessons, not dependencies

replicad
  marker for future BRep threshold

CAD-Recode / DeepCAD / KittyCAD
  agent vocabulary / semantic command research
```

---

# Core architectural CAD boundary

## Core spatial CAD — polish first-class

This editor **should** become very good at:

```text
rooms
walls
floors/ceilings when needed
doors/windows/openings

exact dimensions
numeric editing
snap
alignment
guides

duplicate
repeat
mirror
bounded offset

simple spatial presets
columns
platforms
plinths

eventually practical arc walls
```

This layer massively benefits human and AI authoring.

It creates vocabulary like:

```ts
createRoom(...)
setWallLength(...)
setWallThickness(...)
moveWallEndpoint(...)
addOpening(...)
setOpeningWidth(...)
moveOpening(...)
duplicateStructure(...)
repeatStructure(...)
mirrorStructure(...)
alignToWall(...)
offsetWallChain(...)
```

That is durable moat.

---

# Useful advanced architecture — add only after repeated demand

```text
stairs
levels
railings
arc walls
profile/extrude
reusable templates
eventually components
advanced arrays
```

These can materially improve spatial experiences.

But each deserves its own product proof.

---

# Interchange — keep at edges

```text
DXF
SVG
IFC
possibly STEP eventually
```

They enter through:

```text
adapter
→ candidates
→ normalize
→ validate
→ semantic project state
```

They do not become internal truth.

---

# Full CAD/BIM/DCC territory — stop here

Do not cross into:

```text
global geometric solver
general sketch constraints
arbitrary BRep
arbitrary solids
fillet/chamfer workbench
construction drawing suite
general BIM
MEP
structural engineering
STEP-native modeling
mesh topology
UV
rigging
animation authoring
```

That is point where marginal complexity begins attacking your main product.

---

# If me write P23 immediately

Me scope first implementation brief like this:

```text
P23 — Precision Spatial Layout

P23.0
Semantic Layout operation + validation/preview/commit boundary

P23.1
Numeric wall/opening/Layout-object precision
Central unit parse/format
Selected/transient dimensions

P23.2
Derived snapping system
grid
endpoint
midpoint
intersection
wall projection
orthogonal
opening edge

P23.3
Door/window/opening move + resize
with explicit attachment semantics

P23.4
Deterministic Layout structure duplicate
two-pass ID/reference remap
SceneDocument untouched

P23.5
Targeted align/center commands

P23.6
Column/platform/plinth presets
ONLY where existing Layout primitive model already supports them

P23.7
Robustness + acceptance gate
degenerate geometry
reference integrity
zoom-stable snapping
cancel semantics
one operation = one history entry
Plan/3D compile parity
```

Then register:

```text
P23.x follow-up A
Mirror

P23.x follow-up B
Repeat / baked linear array + distribution

P23.x follow-up C
Richer smart guides/snaps

P23.x follow-up D
Bounded wall-chain offset

P23.x follow-up E
Box selection

P23.x follow-up F
Room topology diagnostics/assisted face detection

P23.x follow-up G
Trim/extend only after wall reference semantics prove stable
```

Deliberately defer:

```text
curved-wall schema expansion
persistent dimensions
levels
stairs
railings
components
profile/extrude
DXF/IFC
constraint solver
BRep
```

## Final answer to Phase 3 question

**Expand much deeper into 2D CAD than current editor, but only along semantic architectural operations.**

You want roughly:

> **“Figma-level directness + enough CAD precision + floor-planner semantics + agent-addressable commands.”**

You do **not** want:

> **“AutoCAD feature count in browser.”**

Best product boundary appears right before features require **persistent global constraints, arbitrary solid topology, or BIM-grade relationships**.

Everything before that — precision, snaps, references, openings, repetition, mirror, bounded offsets, practical architecture helpers — strengthens your editor and AI surface.

Everything after that starts making specialized CAD system become hidden product you now must maintain.

That boundary fits current North Star almost perfectly. 