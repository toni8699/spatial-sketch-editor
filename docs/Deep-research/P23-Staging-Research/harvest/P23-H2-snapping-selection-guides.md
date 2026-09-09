# P23-H2 — Snapping / selection / guides / Plan visual grammar harvest

**Status:** harvest complete — implementation evidence for P23.2 and P23.6  
**Scope:** P23-H2 only. No plan or product-code changes.  
**Museum Editor baseline inspected:** `toni8699/spatial-sketch-editor@7492b4e6d4dc3bb6148b64e3b7327117f11b6b17` (`P23 plan subslices`)  
**Upstream snapshots inspected:**

- LibreCAD: `LibreCAD/LibreCAD@cf968cc77d1c8f0aa4ffebc660188061cfd4ac8c`
- openPlan3D: `laanlabs/openPlan3D@511ff08f57526784c0bf3bc48466bfea04204bbc`

This artifact records source-level findings, licensing/disposition, exact behavior, Museum mapping, acceptance-fixture provenance, and recommended refinements to the current seed plans. It does not broaden P23 into general CAD research.

---

## 1. Executive harvest result

P23.2 is directionally correct but should tighten four things before implementation:

1. **Keep snap truth on the existing compiled-query path.** Build an editor-side pure snap resolver over `CompiledLayoutGeometry.queries` plus transient gesture guides. Do not create a second Plan geometry model and do not make `PlanSvg.svelte` discover geometry.
2. **Make acquisition screen-space and tie resolution explicit.** Reference snapping should use one fixed CSS-pixel acquisition radius independent of grid step. If a valid reference candidate is acquired, it beats grid. Among reference candidates, choose nearest screen distance first, then a semantic tie rank, then a stable source key. Do not inherit upstream array/render-order accidents.
3. **Treat guides as transient result data, not authored constraints.** A snap result should carry the winning point plus renderer-neutral marker/guide descriptors. `PlanRenderModel` projects them; `PlanSvg.svelte` only draws them. Clear them on snap-off, cancel, tool/mode switch, pointer loss, and commit.
4. **Keep initial alignment narrower than openPlan3D.** P23.2 should remain one selected supported Layout object → one explicit reference, using compiled/world AABBs and Museum transactions. Do not import openPlan3D's multi-selection alignment/distribution/store mutation model.

P23.6 is also directionally correct. Harvest adds one important current-code reconciliation: **`PlanSvg.svelte` currently synthesizes a door leaf and swing arc despite the current render model carrying no handedness/swing semantics. P23.6 should remove/suppress that invented swing presentation until durable semantics exist.** Gap + jamb treatment is safe; invented handedness is not.

LibreCAD provides the strongest behavior model for snap candidate resolution, transient preview lifecycle, semantic snap feedback, and ordinary restriction guides, but its GPL license makes it **STUDY only**. openPlan3D is MIT and provides useful small pure hit/snap/alignment examples and tests, but its duplicated canvas logic, array-order tie behavior, consumer curve sampling, Svelte-store mutation, and persisted guide model should not become Museum architecture.

---

## 2. Disposition and license matrix

| Repo / source | License verified at snapshot | Disposition | Use in P23-H2 | Do not import |
|---|---|---|---|---|
| LibreCAD `LICENSE` | GPLv2 for LibreCAD as a whole; inspected visual-snap file also carries GPL terms | **STUDY** | Snap candidate behavior, nearest-candidate model, free fallback, restriction ordering, snap marker/info cursor, preview/highlight lifecycle, visual guide grammar | Source, tests, class structure, overlay implementation, Qt action framework, visual-snap subsystem |
| LibreCAD `librecad/src/lib/actions/rs_snapper.cpp` | GPL | **STUDY** | Exact ordinary snap order/tie behavior and acquisition policy | Code or translated line-for-line implementation |
| LibreCAD `librecad/src/lib/actions/rs_previewactioninterface.cpp` | GPL | **STUDY** | Transient preview/highlight cleanup lifecycle and angle-guide behavior | Preview container/action inheritance architecture |
| LibreCAD `librecad/src/lib/actions/visual_snap/lc_visual_snap_solution_visualizer.cpp` | GPL | **STUDY** | Distinct winner marks, guiding entities, projected marks, guide labels | Visual-snap classes, labels/constants, drawing code |
| openPlan3D `LICENSE` | MIT, copyright 2026 theLodgeStudio | **ADAPT**, narrow **PORT** allowed with attribution | Pure hit-test/test ideas, fixed-screen tolerances, endpoint/nearest-wall snap behavior, alignment math, Plan visual grammar | Canvas/store architecture and product model |
| openPlan3D `src/lib/utils/hitTesting.ts` | MIT | **ADAPT** | Rotated footprint hit shape, reverse/topmost behavior, opening pick extent, CSS-pixel tolerance | Brute sampled curve authority; per-type independent hit authority |
| openPlan3D `src/lib/utils/canvasInteraction.ts` | MIT | **ADAPT** | Grid fallback + magnetic endpoint idea; zoom-normalized acquisition | Hardcoded duplicate snap path as Museum resolver |
| openPlan3D `src/lib/utils/alignment.ts` | MIT | **ADAPT** | Min/center/max AABB alignment math vocabulary | Svelte-store reads/writes, multi-selection scope, equal-center distribution |
| openPlan3D renderer/canvas | MIT | **ADAPT** | Wall hierarchy, dimensions, selection handles, major/minor grid LOD, transient guide style | Canvas renderer, persistent guides, hardcoded colors, consumer geometry reconstruction |
| openPlan3D tests | MIT | **PORT/ADAPT** with attribution | Opening zoom fixture and wall/grid relation fixture concepts | Tests that assume openPlan document units/store architecture |

### License obligations

- **LibreCAD:** no source or test code is copied into Museum Editor by H2. Behavior and fixture intent below are rewritten independently in Museum terms. Keep provenance to the inspected GPL source.
- **openPlan3D:** if implementation later ports any substantial MIT source/test text rather than independently reimplementing the behavior, retain the MIT copyright and license notice required by that project. H2 itself ports no code.

---

## 3. Museum Editor current ground truth

### 3.1 Canonical geometry/query boundary

Inspected:

- `packages/layout-core/src/layout-geometry-types.ts`
- `packages/layout-core/src/layout-geometry-queries.ts`
- `apps/editor/src/lib/layout/plan-render-model.ts`
- `apps/editor/src/lib/editor/layout/plan-hit.ts`

`CompiledLayoutGeometry.queries` already exposes the renderer-neutral spatial vocabulary needed for P23.2:

- `CompiledQueryPoint`: `vertex | interior-anchor`
- `CompiledQuerySpan`: `wall | opening | solid`, with source IDs and cumulative distances
- `CompiledQueryPolygon`: `room-floor | object-footprint`
- `CompiledQueryAabb`: `room | wall | opening | object | floor | document`

`projectPointToSpans()` already projects a world Plan point onto canonical compiled spans. It linearly scans spans and returns the nearest projection. `findPolygonContaining()` uses supplied polygon order and searches from the end.

**H2 conclusion:** P23.2 does not need a new persistent `SnapPrimitive` geometry layer. If a snap-specific runtime type is useful, it should be a **pure editor/session candidate descriptor built from compiled query records**, not a new authored or compiled geometry source.

Recommended shape, conceptually:

```ts
type PlanSnapCandidate = {
  kind: 'endpoint' | 'opening-edge' | 'intersection' | 'midpoint' |
        'orthogonal' | 'nearest-span' | 'grid';
  point: LayoutVec2;
  stableKey: string;
  sourceIds: readonly string[];
};
```

This type belongs at the Plan interaction/query adapter boundary, not in `LayoutDocument`, JSON, history, SVG, or Three state.

### 3.2 Current Plan selection already has explicit authority

Inspected:

- `apps/editor/src/lib/editor/layout/plan-hit.ts`
- `apps/editor/src/lib/editor/layout/arrange-hit.ts`
- `apps/editor/src/lib/editor/layout/layout-interaction.ts`
- `apps/editor/tests/lib/editor/layout/plan-hit.test.ts`
- `apps/editor/tests/lib/editor/layout/arrange-hit.test.ts`

Layout selection is already one explicit union:

`none | room | wall | opening | interiorAnchor | object`.

`resolvePlanHit()` is pure and query-backed. Its locked cross-kind priority is:

`vertex → interior anchor → opening → object → wall → room`.

`resolveArrangeHit()` is also pure and separately owns Arrange authority:

1. polygon containment before Scene-only edge halo;
2. active-owner selected member under pointer;
3. Scene layer 6 over Layout layer 5;
4. stable render/document order, last rendered on top.

This is important precedent: **snapping must not become a second selection resolver.** A snap reference may point at a wall/object/room feature without changing selection or owner authority.

The current Plan hit resolver does contain some order-dependent internal ties (`<=` for point records, reversed polygons/openings, first strictly-nearer wall in traversal). Those rules are existing **selection** behavior and are outside H2 unless P23 changes selection itself. H2 should not copy those order dependencies into the new snap resolver; P23.2 explicitly needs stable snap ties.

### 3.3 Current snapping is grid-only and duplicated across gesture paths

Inspected:

- `apps/editor/src/lib/editor/layout/layout-plan-transform.ts`
- `apps/editor/src/lib/editor/layout/layout-interaction.ts`
- `apps/editor/src/lib/editor/layout/layout-object-editing.ts`
- related Plan/gizmo callers referenced by P23.2
- `apps/editor/tests/lib/editor/layout/layout-plan-transform.test.ts`

Current facts:

- `snapToGrid(point, spacing = 0.25)` rounds X/Z independently.
- `buildPlanGrid(..., minorSpacing = 0.25, majorSpacing = 1)` has its own defaults.
- Plan state already has `gridEnabled`, `snapEnabled`, and `angleSnapEnabled`.
- current room/object/draft paths call grid snapping independently.
- existing test pins quarter-meter grid + 15° angle behavior and grid LOD.

**H2 conclusion:** first P23.2 implementation step should centralize the **effective grid step** and route all Plan placement/translation callers through one configuration value before adding reference candidates. The visible grid and the grid snap step may share a default but must not become coupled to the reference acquisition radius.

### 3.4 Current Plan rendering boundary is suitable for snap overlays

Inspected:

- `apps/editor/src/lib/layout/plan-render-model.ts`
- `apps/editor/src/lib/editor/layout/PlanSvg.svelte`
- `apps/editor/src/lib/editor/styles/plan.css`
- `apps/editor/src/lib/editor/layout/PlanCanvasChrome.svelte`
- theme registry/test seams

`PlanRenderModel` is already pure/world-space and accepts a transient `PlanInteractionProjection` containing selection, handles, drafts, labels, and object/room overrides. `PlanSvg.svelte` applies world→screen transforms and style classes. This is the right insertion seam for H2 snap feedback.

No snap-specific `PlanStyleToken` exists yet. H2 recommends adding a small semantic set rather than hardcoding one generic blue circle:

- `snap-guide`
- `snap-marker-endpoint`
- `snap-marker-opening-edge`
- `snap-marker-intersection`
- `snap-marker-midpoint`
- `snap-marker-nearest`
- `snap-marker-orthogonal`
- optional `snap-label`

The tokens can share ink/color while differing by compact geometry. Meaning should not depend on color alone.

### 3.5 Current Plan visual-semantic mismatch: invented door swing

`PlanRenderModel` currently gives opening primitives only:

- `kind: 'door' | 'window'`
- `widthMeters`
- `wallThicknessMeters`
- room `inwardNormal`

`PlanSvg.svelte` nevertheless synthesizes a door leaf endpoint and a swing arc from those values.

That is beyond the current authored semantics. P23.6 already says not to imply door swing/handedness if that state does not exist.

**H2 recommendation:** P23.6 should treat this as a required reconciliation, not optional polish:

- retain the opening void/gap;
- retain neutral jamb treatment;
- suppress invented door leaf/swing direction until a durable handedness/swing field is explicitly designed;
- keep hit testing on compiled opening spans, never on decorative SVG symbol geometry.

---

## 4. LibreCAD harvest — snapping and guide lifecycle

### 4.1 Exact inspected sources

At `LibreCAD/LibreCAD@cf968cc77d1c8f0aa4ffebc660188061cfd4ac8c`:

- `LICENSE`
- `librecad/src/lib/actions/rs_snapper.cpp`
- `librecad/src/lib/actions/rs_snapper.h`
- `librecad/src/lib/actions/rs_previewactioninterface.cpp`
- `librecad/src/lib/actions/visual_snap/lc_visual_snap_solution_visualizer.cpp`
- supporting visual-snap manager/solution names found under `librecad/src/lib/actions/visual_snap/`

No focused automated `RS_Snapper` unit-test suite was located by repository search at this snapshot. Therefore LibreCAD-derived Museum fixtures below are **behavior-derived fixtures**, independently authored from inspected implementation behavior, not ports of GPL tests.

### 4.2 Ordinary snap candidate resolution

When visual-snap mode does not produce a special solution, `RS_Snapper::snapPoint()` evaluates enabled ordinary candidates in this order:

1. endpoint
2. center
3. middle
4. distance
5. intersection
6. on-entity
7. grid

Each candidate compares its distance to the mouse against the current best using a strict-nearer comparison. Therefore:

- ordinary snapping is primarily **nearest acquired candidate**;
- exact-distance ties keep the earlier candidate type in the evaluation order;
- grid is a fallback contender, not a separately authored geometric relation;
- if no snap is valid, the result becomes free pointer position.

This is useful behavior evidence, but the evaluation order is not a suitable Museum stable key. It is implementation order. H2 should make Museum's tie rule explicit and testable.

### 4.3 Acquisition range and why Museum should not copy it

LibreCAD computes a snap/free range from multiple factors. Its effective range can be constrained by:

- a screen-derived entity catch distance (default setting rooted in a 32 px constant), and
- when grid snapping is on, a fraction of the current grid cell (default factor 25%).

That means the effective acquisition range can change when the grid cell changes.

**Museum disposition: REJECT this policy.** P23.2/T4 specifically needs a fixed CSS-pixel acquisition radius. Grid density is presentation/quantization; reference acquisition is pointer ergonomics. Changing `0.25 m → 0.10 m` grid spacing must not silently shrink or enlarge the mouse's reference-snap catch area.

### 4.4 Restriction ordering

LibreCAD first selects an ordinary snap spot, then can apply horizontal, vertical, or orthogonal restriction relative to a base/relative-zero point. Orthogonal mode chooses the closer horizontal/vertical constrained result.

Useful Museum lesson:

- **candidate resolution and directional restriction are separate stages**;
- an orthogonal guide can be represented as a transient candidate/restriction generated from the active gesture anchor rather than as document geometry;
- the UI can explain both the semantic snap and the directional restriction.

Museum should not import LibreCAD's full restriction/action model. P23.2 only needs its own bounded orthogonal guide behavior.

### 4.5 Visual snap / guide behavior

LibreCAD's visual-snap path can produce:

- an exact found point;
- one or more guiding entities;
- projected candidate marks;
- a line between a found and restricted point;
- labels for guide types;
- highlighting for source entities.

When several guide entities are available, the inspected path chooses the closest guide to the mouse before further resolution. Exact ordinary endpoint/intersection/center snaps can supersede a guide ray when they are within range.

The valuable product grammar is **not** the number of LibreCAD guide modes. It is the separation of:

1. winning coordinate;
2. source/reference highlight;
3. guide line/ray;
4. compact semantic marker/label;
5. action preview.

Museum P23.2 only needs a small subset: endpoint/corner, midpoint, intersection, nearest span, orthogonal, opening edge, grid.

### 4.6 Preview lifecycle

`RS_PreviewActionInterface` keeps action preview, highlights, and snapper feedback transient. Init/finish/suspend clear preview/highlight state; trigger clears transient visuals before executing the committed action and redraws afterward. Resume reconstructs preview/highlight state.

**Museum mapping:** snap guides and markers belong to `LayoutInteractionState` / local Svelte rune state and `PlanInteractionProjection`. They must never enter `LayoutDocument`, `SceneDocument`, persistence, or history.

Required clear events for P23.2:

- Snap off
- `Esc`/cancel
- pointer cancel/loss
- active tool change
- Scene Plan `Layout ↔ Arrange` authority change
- `Plan ↔ 3D` view switch
- completed commit
- invalidated source/reference

### 4.7 Snap feedback grammar

LibreCAD can show a snap marker at the result coordinate and an info cursor naming the current snap type (`Endpoint`, `Intersection`, `Middle`, `Grid`, etc.) plus a restriction name (`Vertical`, `Horizontal`, `Orthogonal`).

Museum should adapt the grammar, not the strings/UI:

- winner marker at exact snapped point;
- guide line only when the relation benefits from it;
- short semantic label only where ambiguity exists or during early P23 validation;
- selection stays blue selection; snap feedback must not look like a selected object;
- reference source may get a quiet transient emphasis but no selection mutation.

---

## 5. openPlan3D harvest — hit testing, snapping, alignment, rendering

### 5.1 Exact inspected sources/tests

At `laanlabs/openPlan3D@511ff08f57526784c0bf3bc48466bfea04204bbc`:

**Core source**

- `src/lib/utils/hitTesting.ts`
- `src/lib/utils/canvasInteraction.ts`
- `src/lib/utils/alignment.ts`
- `src/lib/utils/furnitureGeometry.ts`
- `src/lib/utils/canvasRenderer.ts`
- `src/lib/components/editor/FloorPlanCanvas.svelte`
- `src/lib/components/editor/AlignmentToolbar.svelte`

**Tests**

- `tests/opening-hit-testing.test.ts`
- `tests/furniture-interactions.test.ts`

No dedicated alignment test file was located by repository search at this snapshot.

### 5.2 Hit-test behavior worth keeping

`hitTesting.ts` is deliberately pure even though the larger canvas is not. Useful patterns:

- common point-to-segment distance helper;
- rotated furniture hit testing transforms the pointer into item-local coordinates;
- furniture/columns/stairs/openings generally scan from the end so the last drawn eligible item wins within that type;
- handle tolerance is converted from CSS pixels to world units (`8 / zoom`);
- measurement and annotation tolerances similarly use fixed-screen thresholds;
- opening pick shape follows the rendered wall-aligned opening extent instead of a large center-point circle.

The opening helper computes along-wall and across-wall components using the wall tangent. Its test proves a wide opening remains selectable over its physical width but does not capture distant empty space. It also tests the same relationship across multiple zoom levels.

**Museum mapping:** this directly supports P23.2 T4 and P23.6's “visual truth” rule, but Museum must keep source geometry canonical:

- opening reference/hit extent comes from compiled opening spans;
- curved-wall tangent/projection comes from compiled geometry/query functions;
- SVG symbol geometry does not become hit or snap authority.

### 5.3 Hit-test behavior not to import

openPlan3D has no one unified cross-type deterministic hit resolver comparable to Museum's `resolvePlanHit()` / `resolveArrangeHit()`. Different helpers use different traversal orders. Examples:

- furniture/openings often reverse arrays (topmost-by-draw-order);
- room hit loops forward;
- wall hit loops forward and returns first match;
- curved wall hit testing samples the curve in the consumer.

**Disposition: REJECT as Museum selection architecture.** Museum already has stronger explicit authority and one compiled-query source.

### 5.4 Magnetic snap behavior

There are two relevant implementations/patterns:

- `canvasInteraction.ts` has a small pure endpoint magnetic snap helper.
- `FloorPlanCanvas.svelte` contains a richer duplicated magnetic-snap path: endpoint pass first; if no endpoint acquired, a second pass projects to straight wall segments.

The canvas path uses:

- endpoint acquisition based on a constant divided by zoom;
- endpoints as a categorical first pass;
- nearest interior point on a wall as lower priority;
- excluded wall IDs to stop the moving wall snapping to itself;
- grid-rounded position as the initial fallback.

The second wall pass ignores near-endpoint `t` values because endpoints were already handled.

Useful lessons:

- moving/owned sources must be excluded;
- reference candidates and grid fallback should be separated;
- point and span references deserve distinct semantic markers;
- fixed-screen tolerance should be converted once by the caller.

Do not import:

- duplicate snap code in both component and utility;
- straight-wall-only projection where Museum already has compiled spans;
- hardcoded centimeter constants;
- array order as final tie-break.

### 5.5 Snap tie behavior

openPlan3D's relevant snap loops use strict-nearer comparisons. Consequences:

- exact-distance ties preserve the earlier wall/endpoint in array order;
- `snapFurnitureToWalls()` also preserves the earlier qualifying wall on an exact tie;
- the canvas magnetic snap gives endpoint category priority over wall-span projection, regardless of a later span pass.

This is deterministic only if source array order is treated as semantic. Museum P23.2 should not make that assumption for snapping.

**H2 decision:** stable source identity must be the final snap tie-break, not incidental render/array order.

### 5.6 Wall-flush + grid relation

`furnitureGeometry.ts` contains one useful constraint-ordering idea. When furniture snaps flush to a straight wall, it grid-snaps the candidate position, then only keeps the component of grid movement that lies **along** the wall, preserving exact perpendicular wall clearance.

`tests/furniture-interactions.test.ts` includes a diagonal-wall case proving wall clearance remains exact with grid snapping enabled.

Museum should not import this furniture behavior into P23.2, but the principle is useful:

> a stronger acquired geometric relation must not be damaged by applying a weaker grid quantization afterward.

For P23.2 this simplifies to: **when a valid reference snap is acquired, do not subsequently grid-round the snapped coordinate.** Grid is fallback, not a second destructive pass.

### 5.7 Alignment patterns

`alignment.ts` supports:

- left/right/top/bottom
- horizontal/vertical center
- horizontal/vertical distribution

It derives axis-aligned rectangles from furniture center + effective width/depth. Alignment min/max/center operations move all selected furniture to a collective edge/center. Distribution sorts by center and equally spaces centers between the first and last.

Important limitations:

- rotation is not incorporated into its alignment rectangle math;
- it is multi-selection oriented;
- distribution is center spacing, not equal visible gaps;
- it reads/writes Svelte stores directly;
- it starts/ends an undo group internally;
- no explicit no-op history guard is visible;
- no dedicated alignment tests were found.

**Museum disposition:** ADAPT only the min/center/max vocabulary. P23.2's narrower design is better:

- one selected supported Layout object;
- explicit reference chosen without changing viewport selection;
- selected object's existing rotation-aware/world bounds;
- reference bounds from compiled query AABB / selected straight wall;
- one Museum mutation transaction;
- preserve height/elevation, yaw, dimensions, and `roomId` unless the operation explicitly edits them;
- no-op produces no history;
- distribution and multi-selection remain deferred.

### 5.8 Plan visual grammar

`canvasRenderer.ts` provides several useful visual patterns, not a rendering architecture to copy.

**Walls**

- straight walls read as a filled physical-thickness band with an outline rather than a decorative centerline;
- selected wall shifts to the common blue selection family;
- selected endpoints and a midpoint handle are visually distinct.

Museum already renders wall casing + fill with physical width. P23.6 should refine hierarchy/tokens, not replace this with canvas geometry.

**Dimensions**

- external dimensions sit offset from the wall;
- optional extension lines connect measured endpoints to the dimension line;
- line is interrupted around the text label;
- endpoint ticks are diagonal;
- placement flips to the other side when the preferred label/line would leave the canvas.

Museum adaptation:

- use this grammar for selected straight-wall length and rectangular room dimensions only;
- use screen-constant stroke/text sizing rather than openPlan's zoom-scaled font formula;
- collision/edge avoidance stays presentation-only;
- no persisted dimension entity in P23.6.

**Rooms**

- restrained floor fill;
- room name/area near centroid;
- selected room gets a stronger outline;
- internal width × depth text is based on room bounds.

Museum adaptation: name is safe derived content. Width × depth should only appear where P23.6 can truthfully identify a rectangular room; do not show AABB width/depth as if it were exact dimensions for arbitrary concave/curved rooms.

**Snap points**

openPlan can draw all wall endpoints as faint dots when grid is shown.

Museum disposition: **do not copy as always-on snap-point clutter.** P23.6 calls for a quiet drafting surface and a visible **winning** snap marker. Candidate cloud display can remain deferred.

**Guides**

openPlan has persistent project/floor guides, drawn as dashed horizontal/vertical lines with labels and orientation-specific colors.

Museum disposition: **visual STUDY/ADAPT only.** P23.2 explicitly does not introduce persistent constraints/guides. Museum guides are transient gesture overlays. Do not add guide fields to `LayoutDocument`.

**Grid**

openPlan uses separate minor/major grid levels and hides overly dense grid detail at low pixel spacing. Museum already has the same important behavior in `buildPlanGrid()` (minor hidden below 6 px). H2 confirms the existing Museum approach; no new grid renderer is needed.

---

## 6. Recommended Museum snap resolver contract

This section is the main H2 refinement to the current P23.2 seed. It changes no code; it records the recommended post-harvest contract.

### 6.1 Location and ownership

Recommended new pure editor module:

`apps/editor/src/lib/editor/layout/plan-snap.ts`

Responsibilities:

- accept `CompiledLayoutQueryGeometry`;
- accept pointer world coordinate + `pixelsPerMeter` or caller-provided world radius;
- accept active tool/gesture context and excluded source IDs;
- generate only allowed candidates from canonical query records + transient gesture anchors;
- resolve one deterministic winner;
- return renderer-neutral guide/marker metadata.

It must not import:

- Svelte component state;
- DOM/SVG;
- Three/Threlte;
- `SceneDocument` mutators;
- history;
- persistence.

`LayoutPlanViewport.svelte` orchestrates the call. Existing Layout mutation/transaction functions commit the snapped result. `plan-overlays.ts` / `PlanInteractionProjection` turns the result into visual primitives. `PlanSvg.svelte` remains a thin draw adapter.

### 6.2 Acquisition radius

Recommended initial constant:

`SNAP_ACQUIRE_RADIUS_PX = 8`

Rationale from inspected seams:

- Museum Arrange already uses a small screen-space halo (6 px) for Scene footprints;
- openPlan uses 5 px opening edge margin and 8 px handles/measurements for precision targets;
- LibreCAD's much broader legacy catch range is additionally grid-cell-coupled and is not a good direct fit for Museum's dense Plan surface.

The constant must be centralized and testable. Convert once per event:

`worldRadius = SNAP_ACQUIRE_RADIUS_PX / pixelsPerMeter`.

Do **not** make it a fraction of grid spacing.

Hysteresis/release radius: **defer from the first P23.2 implementation.** Neither inspected source provides evidence that Museum needs a sticky previous winner to meet the minimum slice. Add only if visual QA shows unstable flicker around equidistant references.

### 6.3 Candidate set for P23.2

Generate only context-valid candidates:

1. **Endpoint / room-corner** — compiled `vertex` query points.
2. **Opening edge** — start/end of the owning compiled opening interval, only where opening editing/placement context allows it.
3. **Intersection** — intersections of eligible canonical compiled straight/span segments, with self/adjacent duplicate filtering.
4. **Straight-wall midpoint** — midpoint of the authored straight wall segment, not midpoint of each tessellated span.
5. **Orthogonal** — transient horizontal/vertical relation from the active gesture anchor to eligible reference points/spans.
6. **Nearest span** — `projectPointToSpans()` over eligible canonical compiled spans.
7. **Grid** — current effective grid step.

Do not resample curves in the Plan consumer. For curved walls, nearest-span behavior uses the already compiled spans. Straight-wall midpoint remains explicitly straight-wall-only for P23.2.

### 6.4 Moving-source exclusion

Every gesture must provide exclusions before candidate generation:

- moved room and its owned Layout members where their own geometry would self-snap;
- actively dragged object itself;
- actively edited opening itself when an edge would trivially snap to its current coordinate;
- current wall/vertex source as required by the edit mode;
- Arrange Scene-owner gesture may **read** layout references but never include Scene write targets as Layout candidates that cause document crossover.

Exclusion is by stable source identity, not coordinate comparison.

### 6.5 Deterministic winner algorithm

Recommended refinement to P23.2's current seed ordering:

**A. Filter by active tool/context validity.**  
Invalid source kinds never enter the pool.

**B. Split reference candidates from grid.**  
If at least one valid non-grid reference is within the CSS-pixel acquisition radius, resolve among references. Grid cannot steal from an acquired reference.

**C. Within references, choose nearest screen distance first.**  
This follows the strongest common upstream behavior and avoids a farther endpoint stealing from a much nearer wall/span just because of type rank.

**D. Exact/numerical tie → semantic tie rank.**  
Recommended tie rank only for near-equal distances:

`endpoint/opening-edge → intersection → midpoint → orthogonal → nearest-span`.

Opening-edge is only present in opening context, so it does not become a global privileged feature.

**E. Final tie → stable key.**  
Use a key assembled from semantic kind + existing stable compiled source IDs/subfeature identity. Never use current array position, layer order, Svelte keyed iteration order, or “last rendered.”

**F. No acquired reference → grid fallback.**  
Grid snapping may apply if `snapEnabled`; otherwise return free pointer coordinate.

This intentionally differs from:

- LibreCAD's implicit type-order tie;
- openPlan's array-order exact tie;
- openPlan's categorical endpoint-first pass.

It preserves P23.2's important “reference beats grid” rule while making reference competition spatially intuitive and stable.

### 6.6 Snap result and guide result

Recommended conceptual result:

```ts
type PlanSnapResult = {
  point: LayoutVec2;
  kind: PlanSnapCandidate['kind'] | 'free';
  sourceIds: readonly string[];
  stableKey: string | null;
  guides: readonly PlanSnapGuide[];
};
```

`PlanSnapGuide` is transient/render-neutral. Examples:

- line through active anchor for orthogonal relation;
- short source-span emphasis for nearest-span;
- point marker for endpoint/midpoint/intersection/opening-edge;
- optional compact semantic text.

No snap result is serialized. No guide produces history.

### 6.7 Apply order

For position gestures:

`raw pointer → context constraints → reference snap resolution → grid fallback only if no reference → preview → commit`

Do not grid-round a winning reference coordinate after resolution. The openPlan diagonal wall fixture demonstrates why a weaker quantization should not disturb an exact stronger relation.

Existing 15° rotation/angle modifier behavior remains unchanged by H2/P23.2.

---

## 7. Alignment contract refinement

P23.2 seed already limits alignment to one selected supported object and one reference. H2 recommends keeping that boundary.

### 7.1 Supported reference geometry

- **another Layout object:** existing compiled object world AABB;
- **room:** compiled Plan/world room bounds where the operation is semantically a bounds alignment;
- **selected straight wall:** compiled wall/span source, with explicit “Center on wall” operation.

For object/room bounds expose only:

- X min / center / max
- Z min / center / max

No distribution in P23.2.

### 7.2 Rotation-aware selected object

openPlan's alignment rectangle ignores furniture rotation. Museum must not repeat this.

Use the selected Layout object's existing world-space compiled footprint/AABB after room-local transform and yaw. Compute the translation delta required to align its current min/center/max to the chosen reference coordinate.

The operation moves X/Z only. Preserve:

- object height/elevation state;
- yaw;
- dimensions;
- shape/type;
- explicit `roomId` ownership.

Do not infer room ownership from the resulting coordinate.

### 7.3 Reference picker must not become selection

The Inspector's reference picker is a transient authoring target, not viewport selection.

Selecting `Wall A` as an alignment reference must not:

- replace the selected object;
- switch Arrange owner;
- create a second selection store;
- create history before the alignment command runs.

### 7.4 History

One alignment command = one `layout` transaction/history entry.

If the computed delta is zero within the existing mutation equality/tolerance policy, do nothing and emit no history entry.

---

## 8. P23.6 Plan visual grammar refinements

### 8.1 Wall / room / object hierarchy

Keep the current Museum paper surface and current single blue selection language. H2 does **not** recommend copying openPlan colors.

Recommended hierarchy:

1. authored architectural wall thickness strongest neutral structure;
2. opening gaps/jambs clearly cut through walls;
3. room fill and room label quiet;
4. Layout objects below walls but clearly authored;
5. passive Scene footprints below active Layout authored content;
6. transient guides/preview above content but visually different from selection;
7. active selection/handles highest interaction emphasis.

Use stroke weight, opacity, dash, and shape before adding more hues.

### 8.2 Snap markers and guides

Use compact semantics instead of one generic dot:

- endpoint/opening-edge: small square/bracket-like point mark;
- midpoint: small triangle/diamond;
- intersection: small `×`/cross mark;
- nearest-span: point + short perpendicular/source emphasis;
- orthogonal: thin dashed guide + right-angle cue where useful;
- grid: smallest/quietest point marker, no long guide.

Exact glyph geometry is presentation work for P23.6, but all markers must:

- stay screen-constant in CSS px;
- use `pointer-events: none`;
- never become hit geometry;
- never look identical to selection handles;
- remain legible at 50/100/200 px-per-meter reference zooms and across all shipped themes.

### 8.3 Guide layering and lifecycle

Place snap guides inside the existing transient Plan interaction projection/layer system. Do not add a second SVG overlay with independent world transforms.

A good structure is:

`Plan snap result → plan-overlays.ts → PlanInteractionProjection → PlanRenderModel → PlanSvg.svelte`.

This preserves one view transform and deterministic render ordering.

### 8.4 Dimensions

Adapt the useful openPlan drafting grammar:

- extension lines;
- offset dimension line;
- concise metric label;
- line break/gap behind text or equivalent readable halo;
- compact diagonal ticks;
- flip/shift presentation near viewport edges when needed.

For P23.6 show only derived/contextual dimensions that current semantics can support truthfully:

- selected straight-wall length;
- rectangular-room principal dimensions.

Do not persist these as dimension entities in P23.6.

### 8.5 Door/opening presentation correction

Current `PlanSvg.svelte` door swing is semantically overclaimed. P23.6 should explicitly remove/suppress it until door handedness/swing exists in authored state.

Allowed now:

- wall gap/void;
- jamb boundaries;
- neutral door/opening symbol that does not imply left/right swing;
- selected opening body + width handles from the actual opening edit contract.

Disallowed now:

- invented leaf hinge side;
- invented swing direction;
- SVG-derived state used for snap/hit/mutation.

### 8.6 Grid

Museum's current grid LOD is already stronger than importing openPlan's canvas grid:

- major/minor world grid;
- minor hidden when projected below 6 px;
- stable world/screen transform;
- Plan paper token system.

P23.6 should tune hierarchy only. Visual grid changes must not alter snap coordinates.

### 8.7 Theme/token refinement

`plan.css` already centralizes paper/plan tokens and the theme registry keeps shipped themes separate from spatial canvas invariants. Add semantic snap/guide CSS variables at this shared Plan token layer if new values are required; do not add a “CAD theme” and do not hardcode per-theme snap colors in `PlanSvg.svelte`.

Suggested minimum token vocabulary:

- `--editor-plan-guide`
- `--editor-plan-guide-muted`
- `--editor-plan-snap-marker`
- `--editor-plan-snap-marker-fill`
- `--editor-plan-preview-valid`
- existing danger token for invalid preview

Marker kind should be communicated primarily by geometry, so one marker ink can serve multiple kinds.

---

## 9. Acceptance fixtures and provenance

These fixtures should be added when P23.2/P23.6 implements the harvest. “Port” below means fixture intent/data may be adapted under the noted license; it does not authorize importing GPL code.

| H2 fixture | Museum acceptance | Provenance | Disposition |
|---|---|---|---|
| **H2-F1 fixed-pixel acquisition** | Same pointer distance in CSS px acquires/releases the same reference at Plan scales 50, 100, 200 px/m; changing grid step does not change acquisition radius | LibreCAD screen catch concept + rejection of grid-cell coupling; openPlan zoom-normalized tolerances and `opening-hit-testing.test.ts` | Independent Museum fixture; LibreCAD STUDY, openPlan ADAPT |
| **H2-F2 opening physical extent** | A point over the actual opening width is eligible; a point the same distance from center but outside opening body is not; test across zoom | openPlan `tests/opening-hit-testing.test.ts` wide-opening regression (#18) | PORT/ADAPT under MIT attribution |
| **H2-F3 stable symmetric tie** | Two equal-distance reference candidates resolve to same stable source key even if input candidate/compiled traversal order is reversed | LibreCAD strict-nearer implicit tie + openPlan array-order tie exposed by inspection | Independent Museum regression; do not port GPL |
| **H2-F4 reference beats grid** | Acquired endpoint/midpoint/intersection/span coordinate remains exact even when grid fallback would round elsewhere | LibreCAD ordinary candidate/grid competition; openPlan diagonal wall + grid fixture | Independent/adapted behavior |
| **H2-F5 nearest-reference competition** | Within acquired non-grid references, closer screen-space candidate wins; semantic rank only breaks numerical tie | LibreCAD nearest-candidate behavior; H2 refinement over openPlan endpoint-first pass | Independent Museum fixture |
| **H2-F6 moving-source exclusion** | Dragged object/room/wall cannot snap to its own current/source geometry; neighboring references remain eligible | openPlan `excludeWallIds`; P23 owner/room transform contract | Independent Museum fixture |
| **H2-F7 orthogonal transient guide** | Guide snaps from active gesture anchor, marker/line shown; cancel/snap-off clears all state and leaves document/history unchanged | LibreCAD restriction + preview lifecycle | Independent Museum fixture; STUDY only |
| **H2-F8 opening-edge snap** | Opening edit/placement can acquire owning opening edge; unrelated opening edge does not globally outrank context | LibreCAD semantic candidate separation + openPlan opening extent | Independent Museum fixture |
| **H2-F9 curved nearest-span uses compile** | Auto/explicit curved wall nearest snap matches canonical compiled query projection; Plan resolver performs no curve sampling | Museum `g2AutoBezierDocument` + rejection of openPlan consumer sampling | Reuse Museum fixture |
| **H2-F10 intersection source** | Intersection candidate is derived from canonical compiled spans, stable under zoom, excludes adjacent/self duplicate intersections | LibreCAD intersection snap behavior + Museum compiler boundary | Independent Museum fixture |
| **H2-F11 non-default grid step** | One changed effective grid step reaches every affected draft/placement/translation path; no hidden 0.25 m path remains | Current Museum duplicated default identified by P23.2 | Museum regression |
| **H2-F12 alignment rotated bounds** | Rotated Layout object min/center/max aligns using current world footprint/AABB, preserving Y/yaw/dimensions/roomId | openPlan alignment vocabulary; explicit rejection of its rotation-blind rect | Independent Museum fixture |
| **H2-F13 alignment no-op** | Already-aligned operation does not write document or history | Museum one-intent/one-history invariant; gap in openPlan alignment | Museum regression |
| **H2-F14 guide lifecycle** | Pointer cancel, Esc, commit, tool change, mode switch and Plan→3D all clear snap overlays | LibreCAD preview/action lifecycle | Independent Museum fixture; STUDY only |
| **H2-F15 visual/semantic separation** | Snap marker is non-hit-testable, does not alter `resolvePlanHit`/`resolveArrangeHit`, selection, JSON, compiled geometry, or history | Museum architecture + LibreCAD separate overlay model | Museum contract test |
| **H2-F16 door symbol truth** | No door leaf/swing graphic appears when document has no handedness/swing semantic; opening gap/jamb remains | Current `PlanSvg.svelte` mismatch + P23.6 contract | Museum render regression |
| **H2-F17 Plan hierarchy matrix** | walls/openings/rooms/objects/passive Scene footprints/selection/snap guides remain distinguishable at 50/100/200 px/m and all shipped themes | openPlan renderer visual grammar + current Museum Plan/theme seams | Museum component/visual contract |

### Reusable current Museum fixture sources

Prefer extending current compiler/query fixtures instead of inventing parallel geometry fixtures:

- `apps/editor/tests/layout/__fixtures__/layout-g2-fixtures.ts`
  - `g2LineRectangleDocument`
  - `g2AutoBezierDocument`
  - `g2MultipleOpeningsDocument`
  - `g2ObjectMatrixDocument`
- `apps/editor/tests/lib/editor/layout/plan-hit.test.ts`
- `apps/editor/tests/lib/editor/layout/arrange-hit.test.ts`
- `apps/editor/tests/lib/editor/layout/layout-plan-transform.test.ts`

New H2 fixtures should compile through `compileLayoutGeometry()` and feed the snap resolver `geometry.queries`; no hand-built shadow wall geometry for integration tests except narrow resolver unit inputs.

---

## 10. Exact source-to-Museum mapping

| Harvest finding | Museum seam | Mapping |
|---|---|---|
| Nearest acquired ordinary snap | new pure `plan-snap.ts` over `geometry.queries` | ADAPT behavior; explicit deterministic comparator |
| Screen-space catch radius | `LayoutPlanViewport.svelte` + `layout-plan-transform.ts` | caller converts CSS px to world once |
| Grid fallback | existing `snapToGrid()` | centralize effective step; fallback only |
| Endpoint/corner | `CompiledQueryPoint(kind='vertex')` | direct canonical source |
| Interior/nearest wall | `CompiledQuerySpan` + `projectPointToSpans()` | direct canonical source; no resampling |
| Opening physical extent | compiled `opening` spans | direct canonical source; SVG symbol never authority |
| Orthogonal guide | active gesture anchor + eligible query features | editor-session candidate only |
| Snap marker / guide line | `plan-overlays.ts` / `PlanInteractionProjection` | render-neutral transient primitive |
| Snap drawing | `PlanRenderModel` → `PlanSvg.svelte` | style/transform only |
| Alignment min/center/max | compiled object/room AABBs + existing layout mutation transaction | one selected object to one ref |
| Selection topmost/authority | existing `resolvePlanHit()` / `resolveArrangeHit()` | preserve unchanged; snapping does not select |
| Preview cleanup | `LayoutInteractionState`, component-local runes, tool/mode cancellation | never serialize/history |
| Wall/dimension grammar | existing Plan render model + PlanSvg + Plan chrome | presentation only |
| Theme treatment | `apps/editor/src/lib/editor/styles/plan.css` + existing theme tokens/tests | no new CAD theme |

---

## 11. Not-to-import architecture

### From LibreCAD

Do not import or recreate as a parallel subsystem:

- `RS_Snapper`/Qt action inheritance architecture;
- visual-snap manager/solution object graph;
- overlay entity containers as a second Plan model;
- relative-zero/UCS system;
- full endpoint/center/middle/distance/tangent/normal/ray snap vocabulary;
- document/entity classes;
- settings-driven grid-cell-coupled acquisition range;
- any GPL source/test text.

H2 uses only independently described behavior: nearest acquired candidate, explicit feedback, transient lifecycle, restriction/guide separation.

### From openPlan3D

Do not import:

- `FloorPlanCanvas.svelte` as a monolithic interaction/render authority;
- duplicate component-local + utility snap implementations;
- Canvas2D as a second Plan renderer;
- consumer curve sampling for hit/snap/wall length;
- per-type independent hit resolvers as Museum's cross-type selection system;
- render-array order as snap tie truth;
- Svelte store reads/writes inside alignment algorithms;
- furniture document semantics into `LayoutDocument`;
- multi-selection alignment/distribution into P23.2;
- persistent guide entities into P23.2;
- hardcoded upstream colors/units;
- room AABB dimensions presented as true dimensions for non-rectangular rooms.

### Museum hard boundaries to preserve

- `LayoutDocument` remains authored architecture/rough layout-object truth.
- `SceneDocument` remains separate; Arrange may read layout references without cross-document mutation.
- room-local transforms/explicit `roomId` remain authoritative.
- `compileLayoutGeometry()` remains the single layout geometry compiler.
- Plan consumes compiled query/render-model geometry; SVG does not reinterpret curves/topology.
- current deterministic selection/history ownership remains canonical.
- one completed gesture/command produces one correctly tagged history result.
- no snap/guide/preview state is serialized.
- no visitor runtime dependency on editor snapping, selection, guide, Inspector, or history code.

---

## 12. Recommended refinements to P23.2

Record these in H2; do not edit the plan in this harvest.

1. **Replace the seed tie wording** `tool/context validity → semantic feature priority → screen distance → stable ID/key` with:
   - tool/context validity;
   - acquired reference family before grid;
   - nearest CSS-pixel distance among references;
   - semantic rank only for numerical ties;
   - stable source key final.
2. **Pin initial acquisition to 8 CSS px**, centralized, with `worldRadius = px / pixelsPerMeter`; grid step never affects it.
3. **Defer snap hysteresis** until a failing visual/interaction fixture proves it necessary.
4. **Define reference/grid apply order:** a winning reference coordinate is final; do not re-grid it.
5. **Define stable-key requirement:** candidate order/render order cannot be the tie-break.
6. **Keep snap candidate type editor-runtime only** unless later evidence shows a shared `layout-core` query primitive is necessary. No persistent `SnapPrimitive`.
7. **Require moving-source exclusions by stable IDs** for every gesture adapter.
8. **Use compiled spans for curved nearest-point behavior; never resample in Plan.**
9. **Straight-wall midpoint means authored segment midpoint**, not every compiler tessellation span midpoint.
10. **Opening-edge candidates are context-scoped**, built from the opening's canonical compiled interval.
11. **Reference picker is transient and selection-neutral.**
12. **Alignment remains one selected object → one explicit reference.** Multi-select/distribute stays deferred.
13. **Alignment uses rotation-aware world bounds** and one Layout transaction; no-op = no history.
14. **Snap off means both coordinate snapping and guide/marker feedback off.**
15. **Add lifecycle tests** for cancel/tool/mode/view changes, not only coordinate math.

---

## 13. Recommended refinements to P23.6

Record these in H2; do not edit the plan in this harvest.

1. **Add snap-specific semantic Plan style tokens** and route them through `PlanInteractionProjection` / `PlanRenderModel` rather than direct component markup state.
2. **Keep winner-only feedback in P23.6.** Do not show every potential snap point by default.
3. **Use shape + line pattern, not additional hue families, to distinguish snap kinds.**
4. **Keep snap markers/guide stroke/text screen-constant and pointer-inert.**
5. **Adapt dimension grammar:** offset line, extension lines, compact ticks, readable label gap/halo, presentation-only edge avoidance.
6. **Restrict contextual room dimensions to truthful rectangular cases.** Do not label arbitrary room AABB dimensions as architectural dimensions.
7. **Explicitly remove/suppress current invented door swing/leaf presentation** until handedness/swing semantics are authored.
8. **Keep opening gap/jamb rendering and compiled opening hit/snap source separate.** Decorative symbol geometry is never hit/snap truth.
9. **Retain current major/minor grid LOD model** and tune presentation only; grid density changes never alter reference acquisition.
10. **Keep P21 Plan paper/theme system.** Add shared Plan semantic tokens only; no new CAD-specific theme.
11. **Visual QA matrix must include selection + snap + preview + invalid together**, so snap feedback cannot be mistaken for selection or invalid state.
12. **Component tests should assert semantics/classes/tokens and non-mutation**, not rely only on pixel snapshots.

---

## 14. H2 closeout

H2 provides enough evidence to unblock detailed implementation planning for P23.2 and the snapping/selection/guide portion of P23.6.

The recommended implementation direction is intentionally small:

```text
CompiledLayoutGeometry.queries
        + transient gesture anchor/context
                    ↓
             pure Plan snap resolver
                    ↓
       snapped point + semantic guides
          ↙                     ↘
existing Layout transaction   PlanInteractionProjection
                                    ↓
                            PlanRenderModel
                                    ↓
                              PlanSvg.svelte
```

No new document model. No second geometry compiler. No second selection system. No persistent guide/constraint model. No Canvas/Three Plan renderer. No Scene/Camera ownership crossover.

**H2 complete. Stop here.**
