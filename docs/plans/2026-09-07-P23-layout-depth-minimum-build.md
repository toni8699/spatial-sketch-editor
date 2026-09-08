# P23 — Layout Depth: minimum useful Build set

**Created:** 2026-09-07 · **Status:** proposed (tracker authoritative)
**Depends on:** P22 complete, including hosted cold-visitor acceptance.
**Planning assumption:** owner requested this plan assuming P22 is finished.
This registers future work; it does not mark P22 or preceding work shipped.

## User outcome

A creator can build a small, accurately sized space, place architectural
objects against useful references, fit doors/windows, and repeat supported
structure without redrawing it. The result survives Undo, Save/Load and portable
export, and renders through P22's published visitor runtime.

P23 delivers the minimum Build vocabulary promised by the roadmap: numeric
placement/dimensions, stronger snapping, alignment, better openings,
duplicate/repeat, simple reusable architectural primitives, and a bounded
architectural-drafting visual pass so the Plan surface clearly communicates the
new precision. It is a bounded authoring slice, not the whole Layout Depth
family. P24's minimum Stage set and then P25's narrow Experience foundation may
proceed after this acceptance gate.

Excluded: stairs/railings, curved-wall tooling expansion, profile/extrude,
sweep/revolve, roof tools, a general constraint solver, mesh editing, linked
prefabs, a user preset library, multi-floor workflow expansion, mixed-domain
groups/multi-select, furniture/material/lighting depth, new camera behavior,
Experience schema, agent transports and a universal command framework.
Existing curved/imported geometry must retain fidelity; optional depth tails
need evidence and separately registered follow-up plans.

## Existing implementation to extend

Paths are repository-relative. Recheck these seams after P22 closes; reuse
accepted behavior rather than rebuilding features already present.

| Owner / seam | Existing behavior and intended reuse |
|---|---|
| `packages/layout-core/src/layout-types.ts`, codec and geometry modules | Meter-based rooms, frames, segments, openings and `box/plane/cylinder/sphere/profile` objects; one canonical compiler |
| `packages/layout-core/src/layout-geometry-queries.ts`, compiled query types | Renderer-neutral points/spans/polygons/AABBs with stable semantic/source IDs; preferred source for new snap/query behavior |
| `lib/editor/layout/layout-object-editing.ts` | Object creation/patches, IDs, dimensions, floor placement and Plan snapping |
| `layout-opening-editing.ts` | Opening defaults/patches, **meter offsets along segments**, interval tests and offset snap |
| `layout-editing.ts`, `layout-room-transform.ts` | Boundary editing and rigid room-unit transform, including frame, curved anchors and owned objects |
| `layout-preview-state.svelte.ts` | Existing validated mutators, derived bundle, install/commit and snapshots; no new parallel store |
| `layout-mutation-runner.ts`, `layout-transaction.ts`, editor store | Existing begin/commit/cancel and one chronological tagged history stack |
| `layout-interaction.ts`, `layout-plan-transform.ts`, `LayoutPlanViewport.svelte` | Plan gestures, snap toggles, active authority, selection reconciliation and cancellation |
| `PlanSvg.svelte`, Plan render model/chrome | Existing SVG Plan presentation; P23 visual polish must stay derived/presentation-only |
| `EditorInspector.svelte`, `LayoutDraftToolbar.svelte`, `app/PlanWorkspace.svelte` | Existing numeric object/opening controls and Layout authoring UI |
| `lib/editor/gizmo/layout-gizmo-candidate.ts` | Existing 3D object candidate path; preserve semantic parity with numeric edits |
| `layout-geometry-objects`, `layout-portals`, Plan render model | Rotation-aware bounds, existing opening/portal semantics and shared compiled output |

Numeric object dimensions and opening fields already exist. P23 improves their
coverage and validation and adds missing operations; it does not count replacing
those controls as new functionality. Preserve existing sphere/radius and plane
dimension semantics rather than treating every kind as a generic scale vector.

### Capability-maturity recheck before each touched increment

P23 has already completed the broad Phase 3 research → live-repository
reconciliation needed to write this implementation-ready brief. Do **not** reopen
a general CAD/floor-planner research phase before implementation.

However, the same maturity rule used by P24 applies to every capability P23
touches:

> **“Shipped” answers whether Museum Editor already has a canonical
> implementation. It does not answer whether that capability is sufficiently
> capable, discoverable, precise or polished for the P23 Build goal.**

Before implementing a P23 increment, re-inspect the exact current code path for
that capability after P22 and directly recheck the most relevant public reference
modules where the plan relies on them. The bounded recheck should answer:

1. what behavior actually ships now and which module/document owns it;
2. which part is already sufficient and should be preserved;
3. which concrete maturity gap this P23 increment closes;
4. whether upstream reference code/version/license has materially changed;
5. whether the proposed extension still composes with the existing compiler,
   transaction/history, selection and Plan-rendering authorities.

Classify touched behavior as `KEEP AS-IS`, `POLISH`, `DEEPEN IN P23`,
`FOLLOW-UP`, or `REJECT`. Do not add work merely for feature-name parity with a
CAD reference, and do not replace a canonical Museum Editor seam merely because a
reference tool solves the UX differently.

This is implementation due diligence, not another broad research gate. The
minimum scope below remains the approved P23 contract unless the recheck uncovers
a concrete incompatibility that requires owner review.

## External research references — non-authoritative

The current checked-in Phase 3 CAD/floor-planner research artifact is
[`../Deep-research/P23-Staging-Research/deep-research-P23-compact.md`](../Deep-research/P23-Staging-Research/deep-research-P23-compact.md).
Agents implementing P23 may inspect the public projects/modules referenced there.
They are implementation precedents, **not** product architecture and do not
override Museum Editor contracts. Recheck upstream state/license before reusing
code; GPL references are for algorithm/UX study unless a separately compatible
source is found.

Highest-value precedents for this slice:

| P23 concern | Reference | P23 lesson / disposition |
|---|---|---|
| Whole-candidate wall edits | `openPlan3D` `wallEditing.ts` + tests | Study plan → validate → apply atomically and adversarial fixtures; do not adopt its renderer/store architecture |
| Snap grammar / preview | LibreCAD `rs_snapper.cpp` + preview actions | Study endpoint/midpoint/intersection/orthogonal behavior and preview/commit UX; GPL study only |
| Architectural wall/opening semantics | Sweet Home 3D Plan/Wall controllers + models | Study direct dimensions, wall-relative openings and grouped edits; GPL study only |
| Architectural Plan visual language | LibreCAD, Sweet Home 3D and openPlan3D Plan surfaces | Study wall/opening/dimension/grid hierarchy and selection feedback; reproduce concepts through Museum's `PlanRenderModel` + SVG rather than importing their renderer architecture |
| Wall joins | Blueprint3D wall/corner/half-edge model | Study join concepts; reject Three/render ownership coupling |
| Human + future-agent semantic edits | KittyCAD/Zoo `modifyAst` + operations | Study typed semantic operations shared by UI/tests/agents; do not create a universal P23 command bus |
| Robust geometry classification | `robust-predicates` | Permitted focused dependency only if P23 degeneracy/intersection fixtures prove current math insufficient |
| General 2D geometry | Flatten.js | Prototype/reference only; current compiled query surface remains first choice and Flatten types never become project truth |
| Room topology diagnostics | JTS `Polygonizer` | Follow-up reference for derived candidate faces/dangles/cut edges while explicit Room identity stays authored |
| Bounded offset | CavalierContours JS / `clipper2-ts` | Follow-up spike only, not P23 minimum |

## Operation and ownership contract

Each capability below has an explicit document/target input, deterministic
candidate, validation/preconditions and result containing affected/created IDs
or a bounded rejection reason. IDs for copies are allocated deterministically
against the document or supplied explicitly; retries never depend on selection.
No Svelte component owns the only implementation of a semantic mutation.

Reuse current pure helpers and store adapters. Extract only the new/touched
candidate logic that currently depends on UI state; do not migrate every editor
command or create an operation registry. Pure layout operations can live beside
existing helpers, with canonical package imports and no DOM/store dependency.
Move them into `layout-core` only when a real shared caller needs that boundary.

The editor adapter resolves intent, builds and validates the complete candidate,
then applies it through the existing layout transaction. One Apply, duplicate,
repeat or finished gesture produces at most one `layout` history entry. Invalid,
cancelled and no-op operations produce none. Failure preserves document, compiled
preview, baseline and selection. Verify the runner's commit result/exception
behavior before adding batch callers; a failed commit must not report success
or leave a transaction open.

All durable edits belong to `LayoutDocument`. Scene objects/cameras retain their
room-local data; moving a room changes their derived world placement through its
frame, as it does today. Do not mutate Scene to compensate for a Layout change.
Use the live Scene document, not a stale preview copy, for cross-reference checks
and final project validation. Operations introducing invalid project references
are rejected; never cascade-delete Scene or camera content to make them pass.

## Minimum capability contract

### P23.1 — Precise placement and dimensions

Extend existing numeric controls with explicit meters/degrees, finite-number and
positive-dimension checks, inline rejection reasons and consistent Apply/Escape
behavior. Blank input is invalid, not zero. Keep radians in canonical documents.
Manual numeric values are exact and bypass gesture snapping.

- Layout objects: position X/Y/Z, supported rotation and kind-appropriate full
  dimensions/radius; preserve current world-center and room ownership semantics.
  Arrange keeps its X/Z/Yaw contract and read-only dimensions; dimension editing
  belongs to Layout. Reuse the existing 3D gizmo path where already supported.
- Rooms: numeric frame origin X/Z and yaw using `transformLayoutRoomUnit` and
  its existing pivot semantics. Compute the delta needed to reach the requested
  frame; do not mistake frame origin for the transform's centroid pivot.
- **Selected straight wall:** expose exact length in meters with an explicit
  `Start | End` fixed-endpoint choice. A semantic candidate moves only the
  opposite endpoint along the existing line direction, preserves the segment ID,
  updates the closed room boundary through the canonical room-editing path, keeps
  opening offsets in meters, validates adjacent segments/openings/topology, and
  rejects the whole change if the result is invalid. `auto-bezier` arc length is
  a readout only in P23; no numeric curved-wall length mutation or general wall-
  angle command is added here.
- Rectangular rooms: width/depth along room-local axes, anchored at the current
  local minimum corner, with frame unchanged. Enable only for a verified
  four-line rectangle, including rotated rectangles; no bounding-box resize of
  arbitrary polygons/curves. Preserve segment IDs and connectivity. Owned objects
  and Scene contents do not scale or move on room resize. Keep opening offsets
  in meters and reject a resize that makes them invalid.

No floor-wide height/elevation expansion is required. Existing thickness/height
fields keep their current owning scope and validation. Publish a clear reason
when an operation is unsupported rather than presenting a nonfunctional field.

Research precedent: direct numeric precision is intentionally **not** a general
persistent geometric-constraint system. FreeCAD/SolveSpace-class solver state,
DOF/conflict UX and constraint graphs remain outside P23/product scope.

### P23.2 — Predictable Plan snapping and alignment

Extend the existing Plan snap controls, not global editor preferences. Keep the
current 0.25 m default; expose a finite positive grid step with the existing
input-validation pattern. Reconcile current hard-coded quarter-meter paths so
the selected step applies to affected Layout placement and translation gestures.
Do not silently change Scene/Camera snapping or existing angle modifiers.

New semantic snap candidates derive from **`CompiledLayoutGeometry.queries` plus
transient gesture guides**. Plan/SVG code must not independently reconstruct or
resample authored geometry to create another snap truth. Keep a linear scan first;
a spatial index is added only after measured project-size evidence.

Add reference snapping for room drafting/vertex edits and supported object/room
translation:

- existing boundary endpoints / room corners;
- straight-wall midpoints;
- wall/reference-span intersections where valid;
- nearest point on a wall/reference span;
- an orthogonal guide relative to the active drafting/editing anchor;
- opening edges while editing an opening;
- rotation-aware object bounds edges/centers in X/Z where already supported.

Exclude the moving target and its owned members. Choose within a fixed CSS-pixel
acquisition radius, stable across zoom; use tool/context validity, semantic
feature priority, then screen distance, then stable ID/key. Reference snap wins
over grid when acquired. A visible guide/marker identifies the winner; snap-off
disables both. Reject invalid geometry rather than silently moving to a different
candidate. No persistent constraints are serialized. Pointer acquisition radius
is interaction state in CSS pixels; model-space geometry tolerances are a
separate canonical policy.

Alignment is initially **one selected supported layout object to one reference**:
another supported layout object's world AABB, a room's compiled Plan bounds, or a
selected straight-wall reference. Choose X or Z and minimum/center/maximum for
bounds references; wall reference adds a bounded **Center on wall** action using
compiled/query geometry. Translate only the selected object, preserving height,
rotation, dimensions and ownership. The Inspector reference picker keeps the
active selection intact. This delivers useful alignment without inventing a
multi-selection owner. General distribution/group alignment is later.

Research precedent: LibreCAD informs the bounded snap vocabulary and preview
behavior, but P23 remains purpose-built around Museum's compiled query records.
Do not add Flatten.js merely for feature parity; introduce `robust-predicates`
behind a layout-core adapter only if near-collinear/intersection acceptance
fixtures demonstrate a real classification weakness in current math.

### P23.3 — Openings that fit

Build on existing door/window offset, width, height, sill and profile controls.
Expose segment length and remaining clearance; make clear that offset is the
opening's start measured in **meters along the segment**. Add Center on segment
and distance-from-end placement by converting to the existing offset
representation. No schema migration to normalized `t` is required. Reuse current
rectangular/rounded/pointed profiles; no new door-leaf meshes or interactive
opening/closing behavior.

For **straight segments**, add direct Plan manipulation:

- dragging the opening body slides it along its owning segment only;
- left/right width handles resize the opening along that same segment;
- the gesture keeps `segmentId`, height, sill and profile unchanged unless the
  specific edited field owns that value;
- preview is transient, pointer-up commits one Layout history entry, and Escape/
  pointer cancellation restores the immutable baseline with no history.

Validate the whole candidate for finite positive dimensions, segment limits,
vertical fit and overlapping opening intervals using the canonical geometry
rules/tolerances. Numeric and direct edits reject overflow rather than clamp
silently. Changing door/window kind preserves only valid fields; any necessary
reset is explicit in the UI. Existing curved-segment behavior remains supported
as-is; the new body-drag/width-handle assistance may be limited to straight
segments with a stated reason.

Expose the existing optional door `connectsRoomIds` relation through an explicit
room choice, using current codec/portal semantics. Windows remain unpaired;
unrelated/self/missing-room targets are rejected. Do not infer a relationship
because two walls look adjacent, create camera edges, or promise that a relation
cuts a second wall automatically. Show the actual compiled result. Two physical
wall openings, where required, remain explicit authored openings.

Research precedent: mature floor planners reinforce wall-relative opening
semantics, but Museum's current meter-based `segmentId + offset + width` model is
already the preferred P23 base. Extend it rather than replacing it.

### P23.4 — Duplicate and linear repeat

Supported targets are one authored non-profile layout object, one opening on its
current segment, or one room with its owned supported layout objects. Copies are
independent canonical records. Duplicate uses the same operation as repeat with
one copy. The creator supplies translation X/Z for objects/rooms, or spacing in
meters along the segment for openings. Repeat adds an integer 1–50 copies;
the cap is a deliberate first-slice bound, raised only with measured evidence.

Generate all copies from the original using `index × delta`, not accumulated
rounded offsets. Allocate unique room/object/segment/interior-anchor/opening IDs
and remap internal references. Preserve object Y/rotation/dimensions and room
floor/frame/shape. Room copies include owned Layout structure, never furniture,
Scene entities or camera tours; state this beside the action. Reject room-copy
requests containing read-only profile objects or external door relations until
the creator removes those relations explicitly; never silently strip them or
link cloned rooms back to originals. Standalone opening copies likewise reject
linked doors. This bounds duplication without corrupting connection meaning.

Preview the entire candidate and validate it once as a batch. Any invalid copy
rejects the whole operation with the failing target/reason. One commit and one
Undo cover the whole batch. Select the first new top-level target after success;
do not create multi-selection merely because repeat creates several records.

Research precedent: first repeat/array behavior should bake independent normal
entities. Do not add persistent array relations, definition/instance overrides,
or a component framework to P23.

### P23.5 — Small architectural preset set

Offer three labeled Layout presets using existing shapes: **Column** (cylinder),
**Platform** (box) and **Plinth** (box). Each starts with editable dimensions and
floor-relative placement, then becomes an ordinary Layout object. Reuse primitive
placement, preview, validation and cancellation. Presets are creation defaults,
not linked prefab instances or new serialized object kinds.

Do **not** ship a generic box preset called `Partition` in this minimum slice. A
wall-like box cannot own openings or participate in room-boundary semantics and
would create a misleading second-class wall concept. If a freestanding display
partition becomes a repeated need, register it later as an explicit fixture or
template with truthful semantics.

Use existing native number inputs and toolbar/Inspector placement. No preset
editor, library service, dependency or metadata schema is needed. Plan, 3D and
the published runtime consume the exact same objects through the compiler.

### P23.6 — Architectural drafting visual pass

After the semantic CAD behaviors above are stable, make Scene → Plan → Layout
read like a deliberate architectural drafting surface rather than a generic SVG
editor. This increment is **presentation/interaction projection only**. It does
not add durable Layout fields, a second Plan geometry model, a new selection
system, or consumer-owned geometry. `PlanRenderModel`/compiled query data remain
the source and `PlanSvg.svelte`/existing Plan chrome remain the renderer.

The visual language should make authored hierarchy and current interaction state
obvious at normal working zooms:

- **Walls:** strengthen the authored wall/room boundary hierarchy; selected and
  hovered walls become unmistakable without changing hit authority or geometry.
  Avoid decorative centerlines that imply a second editable wall representation.
- **Rooms:** use a restrained room fill/boundary hierarchy and the existing room
  name where legible. Selected-room emphasis must not overpower wall/opening
  editing. Room labels are derived presentation, never persisted layout text.
- **Openings:** doors/windows read as intentional gaps/symbols in the wall, with
  selected-only body/width handles matching P23.3. Do not invent door swing,
  hinge or handedness graphics until those semantics exist in authored data.
- **Dimensions:** selected straight-wall length and rectangular-room dimensions
  use a consistent architectural dimension treatment: extension lines/ticks,
  concise meter labels and edit affordance where the value is editable. Avoid a
  persistent annotation/documentation system; nonselected dimensions may be
  suppressed when density would obscure geometry.
- **Snapping/guides:** endpoint, midpoint, intersection, nearest-span and
  orthogonal winners receive distinct but compact markers/guide language. The
  marker describes the semantic winner visually; it does not become selection.
- **Objects:** Layout footprints keep clear authored/selected/hover hierarchy.
  Passive Scene footprints visible in Layout remain quieter than Layout-owned
  editable objects and never gain Layout hit authority.
- **Grid:** preserve the configured metric step while improving major/minor
  hierarchy and zoom readability. Visual density may adapt to zoom, but authored
  snap step and world coordinates do not change with the drawing treatment.
- **Invalid/preview states:** invalid wall/opening candidates, direct-manipulation
  previews and snap/alignment previews must be visually distinguishable from
  committed authored geometry without mutating documents.

Reuse existing P21 theme tokens and Plan paper identity. Do not introduce a new
CAD theme, hard-coded per-theme palettes, gradients/shadows for decoration, or a
second visual system. Prefer structural hierarchy through stroke weight, opacity,
pattern/dash and existing semantic tokens. Maintain keyboard focus visibility and
contrast across all shipped editor themes.

Keep label/dimension placement bounded: simple offset/collision avoidance is fine,
but do not build a general annotation-layout solver in P23. If labels conflict in
a dense drawing, selection/context priority wins and lower-priority presentation
may hide rather than rewriting geometry or adding persistent annotation state.

Research precedent: inspect LibreCAD, Sweet Home 3D and openPlan3D for drafting
hierarchy, dimensions, opening readability and snap feedback. Reproduce only the
useful visual grammar through Museum's existing SVG/render-model architecture;
do not transplant their Canvas/controller/render ownership.

## UI, state and lifetime

Keep Scene → Plan → Layout as the architectural authoring surface. Arrange and
Camera retain their current authority and controls. Reuse P21's ribbon, Inspector
and theme tokens; no new global mode or parallel toolbar system. Existing 3D
selection/transform remains available, but direct wall/anchor 3D picking and full
3D drafting are not prerequisites for this Plan-led slice.

New state is transient input drafts, snap step/winner, alignment reference,
opening direct-manipulation preview, repeat/preset preview and derived visual
projection state. No document schema change, saved constraint graph, persistent
dimension entity, new history store or backend dependency. All new durable
results use existing fields. Both mounted Plan workspaces must retain their
hidden/inert boundaries.

Begin gestures from an immutable baseline. Escape, pointer cancellation, target
deletion, project change and leaving the owning surface cancel pending edits and
guides through existing cleanup. Numeric drafts are keyed by target and reset on
selection change/Undo; focus moving to a different target cannot commit an old
input against the new target. Undo/Redo reconciles selection via existing helpers.
Unit labels, keyboard operation, visible focus and announced validation errors
are required. Typing in a field must not trigger canvas shortcuts.

## Geometry robustness policy

P23 does not introduce a general geometry kernel, but new CAD-like behavior must
keep interaction tolerance separate from authored-geometry validity:

- **pointer/snap acquisition** — CSS pixels converted through current Plan zoom;
- **minimum authored size** — meters and operation-specific product limits;
- **geometric equality/degeneracy** — canonical layout-core policy/helpers;
- **display rounding** — UI formatting only, never authored geometry.

Do not introduce one magic `EPSILON` that controls both pointer UX and topology.
New/touched geometry code must be deterministic around near-collinear and nearly
coincident cases. If current line/intersection math fails the P23 acceptance
fixtures, prefer a focused `robust-predicates` adapter in `layout-core` before a
broad geometry framework. Flatten.js/JSTS remain research references unless a
bounded missing capability earns them.

## Acceptance and sequencing

Implement P23.1 → P23.2 → P23.3 → P23.4 → P23.5 → P23.6, then P23.7
integration/closeout. For each semantic capability, demonstrate a headless call
over a plain document with explicit target IDs, then its UI adapter. Existing
helpers count as headless operations; no transport or command registry is
required. P23.6 is rendering/presentation acceptance and must prove it introduces
no authored document or history changes.

| Increment | Exact focused acceptance |
|---|---|
| P23.1 | Numeric object edit equals the equivalent gizmo candidate; room frame reaches requested coordinates/yaw; straight wall reaches requested length while the chosen endpoint remains fixed, segment ID survives and invalid attached-opening/topology results reject atomically; rotated rectangle gets requested local dimensions without changing frame/segment IDs; arbitrary/curved room resize and numeric auto-bezier length mutation reject; invalid/blank/zero inputs preserve state; one Undo/Redo round-trip |
| P23.2 | Non-default grid step reaches every affected caller; snap winner is stable at different zooms and ties; endpoint/midpoint/intersection/nearest-span/orthogonal/opening-edge fixtures resolve deterministically from compiled query geometry; moving members excluded; guides clear on cancel; rotated object's AABB min/center/max and Center-on-wall alignment reach the requested reference; no-op alignment adds no history |
| P23.3 | Center and end-clearance yield exact offsets; straight-wall opening body drag and width handles preserve segment/height/sill/profile, commit once, and cancel cleanly; endpoint/overlap/vertical limits reject atomically; profile survives round-trip; explicit valid door relation survives codec/portal derivation; invalid target/window relation rejects; wall shrink cannot leave an invalid opening |
| P23.4 | N copies have unique IDs, exact offsets and correct internal remaps; owned objects follow copied room; no Scene/camera records copied or modified; linked-door/profile restrictions explained; invalid final copy rolls back all; undo/redo restores IDs and entire batch |
| P23.5 | Column/Platform/Plinth presets compile as their ordinary shapes; dimension edits and cancellation use existing paths; floor placement accounts for elevation and object center; export/import preserves editable values |
| P23.6 | Wall/room/opening/object hierarchy is readable across shipped themes and representative zooms; selected/hover/preview/invalid states are distinct; selected wall/room dimensions and snap markers remain legible without persistent annotation state; passive Scene footprints stay visually subordinate and non-authoritative; changing visual density/zoom does not change snap coordinates, compiled geometry, document JSON or history |
| P23.7 | Degeneracy fixtures cover near-collinear intersections, nearly coincident endpoints, zero/tiny wall length, endpoint intersection, deterministic snap ties and opening-invalidating wall resize; end-to-end author/save/preview/publish checks, regression/bundle gates and contract updates pass |

Tests belong in existing layout/editor suites. Cover candidate validation and
the transaction adapter, including commit failure and stale selection; do not
substitute duplicated UI math for the headless test. Use current geometry golden/
parity fixtures to prove Plan bounds, 3D geometry and visitor compilation agree.
Add focused render-model/component assertions for P23.6 where stable semantic
classes/attributes are appropriate; do not snapshot raw SVG markup or pixels as
the only correctness gate. Do not create a new test framework or broad benchmark
project. Use a bounded 50-copy fixture to catch nonfinite geometry, ID collisions
and excessive repeated compilation; add performance machinery only on a
demonstrated regression.

Manual integration fixture: create a rotated 6 m × 4 m room, set a 0.1 m grid,
set one straight wall to an exact requested length, place a column and platform,
align one object to bounds and another to a straight wall, add a centered 0.9 m
door, drag it along the wall, resize it with a width handle, add a window with a
sill, repeat three columns, duplicate the unlinked room, and edit one copy
independently. At 50%, 100% and 200% Plan zoom, inspect wall/room/opening hierarchy,
dimensions, grid density, snap markers, selected/hover/preview states and passive
Scene-footprint subordination. Check Plan/3D, Undo/Redo, project switching and
Preview return. Save/Load and portable export/import retain dimensions, IDs,
ownership and opening relations. Publish through P22 and inspect in a fresh
unauthenticated browser; later Layout edits leave the old publication unchanged
until Update.

Final checks: focused suites, full `npm test -- --run`, `npm run check`, shared
package checks, `npm run build`, existing visitor/preview/public-route bundle
gates, and P22 API tests. Use the scripts present after P22; record actual results.
Smoke `/museum`, `/museum/editor`, Scene Arrange and Camera Plan/3D for regressions.
No commits or live publication are performed merely by writing this plan.

## Research-backed follow-up candidates — not P23 ship gates

Keep the broader Layout Depth family staged. After the minimum lands, use measured
pilot/user/agent demand to register follow-ups in approximately this order:

1. **Mirror selected Layout structure** — baked deterministic transform, no
   persistent symmetry relation.
2. **Box selection + distribute/equal spacing** — normal canonical selections and
   transforms; no mixed Layout/Scene transaction.
3. **Richer temporary guides/snaps** — parallel/perpendicular/extension/equal-
   spacing only where repeated workflows justify them.
4. **Bounded straight/non-branching wall-chain offset** — compare
   CavalierContours JS vs `clipper2-ts` in a focused spike; bake normal Layout
   entities, no persistent offset relation.
5. **Derived room-topology diagnostics / assisted face candidates** — JTS
   Polygonizer behavior is the reference; explicit Room IDs/ownership remain
   authored truth.
6. **Trim/extend** — only after wall/opening/reference semantics are mature enough
   to define deterministic dependent-reference behavior.

Demand-gated later work remains: circular-arc wall semantics, stairs, levels,
railings, profile/extrude, reusable definition/instance components and bounded
DXF/IFC adapters. General constraint solvers, arbitrary BRep/STEP-native modeling,
full BIM/MEP and mesh/DCC editing remain outside the product direction.

These follow-ups must never become a hidden gate before P24 minimum Scene/Staging
Depth or P25's narrow Experience proof.

## Boundaries and fallback

Keep `LayoutDocument` → `compileLayoutGeometry()` → Plan + 3D + P22 runtime as
the only geometry path. Snap/query helpers consume canonical compiled query
records rather than rebuilding Plan geometry. P23 visual drafting work consumes
`PlanRenderModel`/compiled semantic data and may add derived presentation only;
it must not reconstruct or persist a second geometric representation. No
generated endpoints are persisted; no Layout helpers enter visitor chunks;
frozen `/museum` remains `rooms.ts`/Chopin-owned under its existing gates. One
camera graph/motion, no additional selection/history system.

If straight-wall sizing, rectangle sizing, opening direct manipulation or
duplication uncovers cross-domain mutation requirements, keep the operation
bounded or reject that input with a reason; do not split a supposed atomic edit
into separate Layout/Scene commits. If richer presets need new document kinds,
ship the existing-shape presets and register that depth later. If the visual pass
needs semantics that are not currently authored (for example door handedness or
persistent dimension annotations), omit that visual affordance rather than
smuggling new truth into presentation state. Partial increments can land
independently, but P23 ships only when the minimum capabilities above pass.
Optional depth tails never become a hidden P25 gate.

Rollback removes the new UI/operation/presentation entry points while retaining
canonical documents; ordinary shapes/openings need no reverse migration. On ship
update `components/persistence.md`, relevant placement/shell contracts,
`Design-specs/Shell-scene-workspaces.md` and ownership docs only where behavior
changed. Archive this plan, collapse the tracker row, and advance CURRENT to the
P24 minimum Scene/Staging Depth brief. Record measured limitations in that
closeout rather than adding speculative implementation tickets.