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
duplicate/repeat and simple reusable architectural primitives. It is a bounded
authoring slice, not the whole Layout Depth family. P24's minimum Stage set and
then P25's narrow Experience foundation may proceed after this acceptance gate.

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
| `lib/editor/layout/layout-object-editing.ts` | Object creation/patches, IDs, dimensions, floor placement and Plan snapping |
| `layout-opening-editing.ts` | Opening defaults/patches, meter offsets, interval tests and offset snap |
| `layout-editing.ts`, `layout-room-transform.ts` | Boundary editing and rigid room-unit transform, including frame, curved anchors and owned objects |
| `layout-preview-state.svelte.ts` | Existing validated mutators, derived bundle, install/commit and snapshots; no new parallel store |
| `layout-mutation-runner.ts`, `layout-transaction.ts`, editor store | Existing begin/commit/cancel and one chronological tagged history stack |
| `layout-interaction.ts`, `layout-plan-transform.ts`, `LayoutPlanViewport.svelte` | Plan gestures, snap toggles, active authority, selection reconciliation and cancellation |
| `EditorInspector.svelte`, `LayoutDraftToolbar.svelte`, `app/PlanWorkspace.svelte` | Existing numeric object/opening controls and Layout authoring UI |
| `lib/editor/gizmo/layout-gizmo-candidate.ts` | Existing 3D object candidate path; preserve semantic parity with numeric edits |
| `layout-geometry-objects`, `layout-portals`, Plan render model | Rotation-aware bounds, existing opening/portal semantics and shared compiled output |

Numeric object dimensions and opening fields already exist. P23 improves their
coverage and validation and adds missing operations; it does not count replacing
those controls as new functionality. Preserve existing sphere/radius and plane
dimension semantics rather than treating every kind as a generic scale vector.

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
- Rectangular rooms: width/depth along room-local axes, anchored at the current
  local minimum corner, with frame unchanged. Enable only for a verified
  four-line rectangle, including rotated rectangles; no bounding-box resize of
  arbitrary polygons/curves. Preserve segment IDs and connectivity. Owned objects
  and Scene contents do not scale or move on room resize. Keep opening offsets
  in meters and reject a resize that makes them invalid.

No floor-wide height/elevation expansion is required. Existing thickness/height
fields keep their current owning scope and validation. Publish a clear reason
when an operation is unsupported rather than presenting a nonfunctional field.

### P23.2 — Predictable Plan snapping and alignment

Extend the existing Plan snap controls, not global editor preferences. Keep the
current 0.25 m default; expose a finite positive grid step with the existing
input-validation pattern. Reconcile current hard-coded quarter-meter paths so
the selected step applies to affected Layout placement and translation gestures.
Do not silently change Scene/Camera snapping or existing angle modifiers.

Add reference snapping for room drafting/vertex edits and supported object/room
translation: existing boundary endpoints and straight-wall midpoints, plus
rotation-aware object bounds edges/centers in X/Z. Exclude the moving target and
its owned members. Choose within a fixed CSS-pixel acquisition radius, stable
across zoom; use deterministic feature priority then distance then stable ID.
Reference snap wins over grid when acquired. A visible guide identifies the
winner; snap-off disables both. Reject invalid geometry rather than silently
moving to a different candidate. No persistent constraints are serialized.

Alignment is initially **one selected supported layout object to one reference**:
another supported layout object's world AABB, or a room's compiled Plan bounds.
Choose X or Z and minimum/center/maximum; translate only the selected object,
preserving height, rotation, dimensions and ownership. The Inspector reference
picker keeps the active selection intact. This delivers useful alignment without
inventing a multi-selection owner. General distribution/group alignment is later.

### P23.3 — Openings that fit

Build on existing door/window offset, width, height, sill and profile controls.
Expose segment length and remaining clearance; make clear that offset is the
opening's start measured in meters along the segment. Add Center on segment and
distance-from-end placement by converting to the existing offset representation.
Reuse current rectangular/rounded/pointed profiles; no new door-leaf meshes or
interactive opening/closing behavior.

Validate the whole candidate for finite positive dimensions, segment limits,
vertical fit and overlapping opening intervals using the canonical geometry
rules/tolerances. Numeric edits reject overflow rather than clamp silently.
Changing door/window kind preserves only valid fields; any necessary reset is
explicit in the UI. Existing curved-segment behavior remains supported as-is;
new placement assistance may be limited to straight segments with a stated reason.

Expose the existing optional door `connectsRoomIds` relation through an explicit
room choice, using current codec/portal semantics. Windows remain unpaired;
unrelated/self/missing-room targets are rejected. Do not infer a relationship
because two walls look adjacent, create camera edges, or promise that a relation
cuts a second wall automatically. Show the actual compiled result. Two physical
wall openings, where required, remain explicit authored openings.

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

### P23.5 — Small architectural preset set

Offer three labeled Layout presets using existing shapes: **Column** (cylinder),
**Partition** (box) and **Platform** (box). Each starts with editable dimensions
and floor-relative placement, then becomes an ordinary Layout object. Reuse
primitive placement, preview, validation and cancellation. Presets are creation
defaults, not linked prefab instances or new serialized object kinds.

Use existing native number inputs and toolbar/Inspector placement. No preset
editor, library service, dependency or metadata schema is needed. Plan, 3D and
the published runtime consume the exact same objects through the compiler.

## UI, state and lifetime

Keep Scene → Plan → Layout as the architectural authoring surface. Arrange and
Camera retain their current authority and controls. Reuse P21's ribbon, Inspector
and theme tokens; no new global mode or parallel toolbar system. Existing 3D
selection/transform remains available, but direct wall/anchor 3D picking and full
3D drafting are not prerequisites for this Plan-led slice.

New state is transient input drafts, snap step/winner, alignment reference and
repeat/preset preview. No document schema change, saved constraint graph, new
history store or backend dependency. All new durable results use existing fields.
Both mounted Plan workspaces must retain their hidden/inert boundaries.

Begin gestures from an immutable baseline. Escape, pointer cancellation, target
deletion, project change and leaving the owning surface cancel pending edits and
guides through existing cleanup. Numeric drafts are keyed by target and reset on
selection change/Undo; focus moving to a different target cannot commit an old
input against the new target. Undo/Redo reconciles selection via existing helpers.
Unit labels, keyboard operation, visible focus and announced validation errors
are required. Typing in a field must not trigger canvas shortcuts.

## Acceptance and sequencing

Implement P23.1 → P23.2 → P23.3 → P23.4 → P23.5, then P23.6 integration/closeout.
For each capability, demonstrate a headless call over a plain document with
explicit target IDs, then its UI adapter. Existing helpers count as headless
operations; no transport or command registry is required.

| Increment | Exact focused acceptance |
|---|---|
| P23.1 | Numeric object edit equals the equivalent gizmo candidate; room frame reaches requested coordinates/yaw; rotated rectangle gets requested local dimensions without changing frame/segment IDs; arbitrary/curved room resize rejects; invalid/blank/zero inputs preserve state; one Undo/Redo round-trip |
| P23.2 | Non-default grid step reaches every affected caller; snap winner is stable at different zooms and ties; moving members excluded; guides clear on cancel; rotated object's AABB min/center/max matches reference after alignment; no-op alignment adds no history |
| P23.3 | Center and end-clearance yield exact offsets; endpoint/overlap/vertical limits reject atomically; profile survives round-trip; explicit valid door relation survives codec/portal derivation; invalid target/window relation rejects; wall shrink cannot leave an invalid opening |
| P23.4 | N copies have unique IDs, exact offsets and correct internal remaps; owned objects follow copied room; no Scene/camera records copied or modified; linked-door/profile restrictions explained; invalid final copy rolls back all; undo/redo restores IDs and entire batch |
| P23.5 | Each preset compiles as its ordinary shape; dimension edits and cancellation use existing paths; floor placement accounts for elevation and object center; export/import preserves editable values |
| P23.6 | End-to-end author/save/preview/publish checks, regression/bundle gates and contract updates |

Tests belong in existing layout/editor suites. Cover candidate validation and
the transaction adapter, including commit failure and stale selection; do not
substitute duplicated UI math for the headless test. Use current geometry golden/
parity fixtures to prove Plan bounds, 3D geometry and visitor compilation agree.
Do not create a new test framework or broad benchmark project. Use a bounded
50-copy fixture to catch nonfinite geometry, ID collisions and excessive repeated
compilation; add performance machinery only on a demonstrated regression.

Manual integration fixture: create a rotated 6 m × 4 m room, set a 0.1 m grid,
place a column and platform, align their bounds, add a centered 0.9 m door and a
window with a sill, repeat three columns, duplicate the unlinked room, and edit
one copy independently. Check Plan/3D, Undo/Redo, project switching and Preview
return. Save/Load and portable export/import retain dimensions, IDs, ownership
and opening relations. Publish through P22 and inspect in a fresh unauthenticated
browser; later Layout edits leave the old publication unchanged until Update.

Final checks: focused suites, full `npm test -- --run`, `npm run check`, shared
package checks, `npm run build`, existing visitor/preview/public-route bundle
gates, and P22 API tests. Use the scripts present after P22; record actual results.
Smoke `/museum`, `/museum/editor`, Scene Arrange and Camera Plan/3D for regressions.
No commits or live publication are performed merely by writing this plan.

## Boundaries and fallback

Keep `LayoutDocument` → `compileLayoutGeometry()` → Plan + 3D + P22 runtime as
the only geometry path. No generated endpoints are persisted; no Layout helpers
enter visitor chunks; frozen `/museum` remains `rooms.ts`/Chopin-owned under its
existing gates. One camera graph/motion, no additional selection/history system.

If rectangle sizing or duplication uncovers cross-domain mutation requirements,
keep the operation bounded or reject that input with a reason; do not split a
supposed atomic edit into separate Layout/Scene commits. If richer presets need
new document kinds, ship the existing-shape presets and register that depth later.
Partial increments can land independently, but P23 ships only when the minimum
capabilities above pass. Optional depth tails never become a hidden P25 gate.

Rollback removes the new UI/operation entry points while retaining canonical
documents; ordinary shapes/openings need no reverse migration. On ship update
`components/persistence.md`, relevant placement/shell contracts,
`Design-specs/Shell-scene-workspaces.md` and ownership docs only where behavior
changed. Archive this plan, collapse the tracker row, and advance CURRENT to the
P24 minimum Scene/Staging Depth brief. Record measured limitations in that
closeout rather than adding speculative implementation tickets.
