# P23 — Layout Depth: minimum useful Build set

**Created:** 2026-09-07 · **Status:** proposed (tracker authoritative)
**Depends on:** P22 complete, including hosted cold-visitor acceptance.
**Planning assumption:** owner requested this plan assuming P22 is finished.
This registers future work; it does not mark P22 or preceding work shipped.
**Plan review:** 2026-09-08 ground-truth pass against the working tree — all
named seams verified (centroid-pivot `transformLayoutRoomUnit`, meter-offset
openings, codec-enforced door relations); path convention, P23.3 relation
contract and fixture-first notes folded below. Reviewer harvest-workflow
proposal folded same day: capability-split harvest passes (H1–H4) producing
implementation artifacts with license/disposition/file/fixture provenance,
consumed per increment via the READ FIRST table in the references section.
**Progressive planning:** 2026-09-08 restructure into umbrella + child-plan
seeds (P23.1–P23.7) + evidence artifacts (H1–H4); migration accounting at
§Progressive-planning migration accounting. This document is the Layout Depth
umbrella: durable product contract, boundaries, order and evidence gates.
Implementation detail lives in the child seeds until reconciled.

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

Paths are repository-relative and abbreviated: `packages/layout-core/src/…`
rows are the canonical layout package; `lib/editor/…` rows mean
`apps/editor/src/lib/editor/…`; bare filenames are layout-owner modules in
`apps/editor/src/lib/editor/layout/`, except `EditorInspector.svelte`, which
sits at `apps/editor/src/lib/editor/`; an `app/…`, `gizmo/…` or `layout/…`
prefix marks that editor subdirectory. Recheck these seams after P22 closes;
reuse accepted behavior rather than rebuilding features already present.

| Owner / seam | Existing behavior and intended reuse |
|---|---|
| `packages/layout-core/src/layout-types.ts`, codec and geometry modules | Meter-based rooms, frames, segments, openings and `box/plane/cylinder/sphere/profile` objects; one canonical compiler |
| `packages/layout-core/src/layout-geometry-queries.ts`, compiled query types | Renderer-neutral points/spans/polygons/AABBs with stable semantic/source IDs; preferred source for new snap/query behavior |
| `lib/editor/layout/layout-object-editing.ts` | Object creation/patches, IDs, dimensions, floor placement and Plan snapping |
| `layout-opening-editing.ts` | Opening defaults/patches, **meter offsets along segments**, interval tests and offset snap |
| `layout-editing.ts`, `layout-room-transform.ts` | Boundary editing and rigid room-unit transform, including frame, curved anchors and owned objects |
| `layout-preview-state.svelte.ts` | Existing validated mutators, derived bundle, install/commit and snapshots; no new parallel store |
| `layout-mutation-runner.ts`, `layout-transaction.ts`, editor store | Existing begin/commit/cancel and one chronological tagged history stack |
| `layout-interaction.ts`, `layout-plan-transform.ts`, `layout/LayoutPlanViewport.svelte` | Plan gestures, snap toggles, active authority, selection reconciliation and cancellation |
| `layout/PlanSvg.svelte`, Plan render model/chrome | Existing SVG Plan presentation; P23 visual polish must stay derived/presentation-only |
| `EditorInspector.svelte`, `layout/LayoutDraftToolbar.svelte`, `app/PlanWorkspace.svelte` | Existing numeric object/opening controls and Layout authoring UI |
| `lib/editor/gizmo/layout-gizmo-candidate.ts` | Existing 3D object candidate path; preserve semantic parity with numeric edits |
| `packages/layout-core/src/layout-geometry-objects.ts`, `packages/layout-core/src/layout-portals.ts`, Plan render model | Rotation-aware bounds, existing opening/portal semantics and shared compiled output |

Numeric object dimensions and opening fields already exist. P23 improves their
coverage and validation and adds missing operations; it does not count replacing
those controls as new functionality. Preserve existing sphere/radius and plane
dimension semantics rather than treating every kind as a generic scale vector.

### Capability-maturity recheck before each touched increment

P23 has already completed the broad Phase 3 research → live-repository
reconciliation needed to define this umbrella's contract and evidence gates. Do **not** reopen
a general CAD/floor-planner research phase before implementation.

However, the same maturity rule used by P24 applies to every capability P23
touches:

> **“Shipped” answers whether Museum Editor already has a canonical
> implementation. It does not answer whether that capability is sufficiently
> capable, discoverable, precise or polished for the P23 Build goal.**

Before implementing a P23 increment, re-inspect the exact current code path for
that capability after P22, read the increment's harvest artifact (READ FIRST
table in the references section), and directly recheck the most relevant public reference
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

### Open-source harvest passes — implementation artifacts, not essays

The research artifact above stays the **discovery layer**: it answers which
projects matter, why, and their PORT vs ADAPT vs STUDY vs REJECT disposition.
No broad deep research is re-run for P23. What discovery does not give the
implementer is *exactly which code, tests and fixtures to harvest*. That is a
separate, targeted **harvest pass** per capability group over the
already-selected repos — a bounded inspection pass, not a new research phase.

A harvest pass produces an implementation artifact (not an essay) under
`docs/Deep-research/P23-Staging-Research/harvest/`, one per group:

- `P23-H1-wall-room-geometry.md` — wall/room/opening semantics: openPlan3D,
  Blueprint3D, Sweet Home 3D
- `P23-H2-snapping-selection-guides.md` — snapping/selection/guides + Plan
  visual grammar: LibreCAD, openPlan3D
- `P23-H3-robust-geometry.md` — predicates/intersections/topology diagnostics:
  `robust-predicates`, Flatten.js, JTS
- `P23-H4-offsets-trims-curves.md` — offset/trim/curve operations:
  CavalierContours JS, `clipper2-ts`, LibreCAD. **Runs only when the bounded
  offset/trim follow-up is scheduled**, matching the disposition table above.

Every artifact uses the same fixed contract:

- Repo, license (rechecked live), disposition: `PORT | ADAPT | STUDY | REJECT`;
- Relevant files, functions/classes, tests/fixtures (exact paths);
- Algorithm/interaction being harvested; what can be copied/ported, what must
  be rewritten, what architecture must **not** come over;
- Mapping into Museum Editor seams: `LayoutDocument` (authored truth),
  `compileLayoutGeometry()` (single geometry boundary), compiled query
  records / `PlanRenderModel` (only Plan geometry source), `SceneDocument`,
  session/history/transaction adapters;
- Required acceptance fixtures with **provenance**: the upstream failure each
  fixture guards (e.g. openPlan3D's generous-tolerance multi-room failures,
  timestamp IDs, resampled length measurement);
- License obligations and an explicit not-to-import list.

License rules for every pass: verify the upstream LICENSE file before relying
on anything; `PORT` (code + tests may be ported with license/attribution
retained) applies only to permissive licenses (MIT/Unlicense/Apache/Boost);
GPL/LGPL rows (LibreCAD, Sweet Home 3D, FreeCAD, SolveSpace) stay `STUDY` —
concepts, fixture ideas and behavior described in our own words, never
transcribed code; MPL-2.0 rows stay adapter-isolated. Always recheck upstream
file/version/license at harvest time and record it in the artifact.

Harvest artifacts are implementation aids like the research artifact: they
never override plan contracts, and a finding that conflicts with a plan
boundary goes to owner review instead of into the code.

Implementation consumption per increment — the flow is: required harvest
artifact completed and reviewed → child plan reconciled against the artifact
and the live repository → child plan marked `implementation-ready` → the
implementer reads **plan + the finalized child plan + current Museum Editor
code** and implements only that slice. A harvest artifact is never a signal to
implement directly.

**Harvest sequencing rule:** a required READ FIRST harvest artifact must be
completed and reviewed, and the child plan reconciled to `implementation-ready`,
before implementation of that increment begins. Harvest, reconciliation and
implementation are separate passes; do not discover/port upstream code ad
hoc while writing the increment.

| Increment | Required pre-implementation harvest (READ FIRST) |
|---|---|
| P23.1 | Complete `P23-H1` (openPlan3D `wallEditing.ts` + its tests first) → reconcile/finalize P23.1 to `implementation-ready` → implement P23.1 |
| P23.2 | Complete `P23-H2` (LibreCAD snapper concepts; openPlan3D `hitTesting.ts`, `alignment.ts`) → reconcile/finalize P23.2 → implement P23.2 |
| P23.3 | Complete `P23-H1` (Sweet Home 3D wall-relative opening semantics; openPlan3D opening tests) → reconcile/finalize P23.3 → implement P23.3 |
| P23.4 | No gating harvest. Optional context: `P23-H1` clone/remap lessons once complete. Reconcile against the live repository → mark `implementation-ready` → implement P23.4 |
| P23.5 | No gating harvest. Optional context: `P23-H1` (`roomPresets.ts`) once complete. Reconcile against the live repository → mark `implementation-ready` → implement P23.5 |
| P23.6 | Complete `P23-H2` (Plan visual-language rows in the table above) → reconcile/finalize P23.6 → implement P23.6 |
| P23.7 | Complete `P23-H3` (degeneracy fixture provenance from the T-fixture set) → reconcile/finalize P23.7 → implement P23.7 |
| Offset/trim follow-up | Complete `P23-H4` (only when scheduled) → finalize the follow-up plan → implement |

The same discovery/harvest split applies to later plans' research artifacts as
separate streams (P23 harvest = CAD/layout code; a P24 harvest would separately
inspect 3D scene/material/lighting/asset-editor implementations) — registering
that pattern here creates no P24 tickets.

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

Progressive-planning structure: each slice below keeps its durable product
contract here (harvest findings must not change these semantics without owner
review); implementation detail migrated to the linked child-plan seed. A child
plan becomes implementation-ready only after its required evidence is completed
and reconciled (harvest sequencing rule in the references section).

### P23.1 — Precise placement and dimensions

**Outcome:** the creator authors exact architectural dimensions numerically —
object position/rotation/dimensions, room frames, straight-wall length, and
rectangular-room width/depth — with explicit validation and atomic rejection.

**Must:** extend the existing numeric controls (explicit meters/degrees,
finite/positive checks, inline rejection reasons, consistent Apply/Escape;
blank input is invalid, not zero; radians stay canonical); manual numeric
values are exact and bypass gesture snapping; publish a clear reason when an
operation is unsupported. Straight-wall sizing exposes exact length with an
explicit `Start | End` fixed-endpoint choice, preserves the segment ID, updates
the closed room boundary through the canonical room-editing path, keeps opening
offsets in meters, validates adjacent segments/openings/topology, and rejects
the whole change if invalid. Rectangular-room sizing works along room-local
axes anchored at the current local minimum corner, only for a verified
four-line rectangle (rotated included), preserving segment IDs, connectivity
and ownership; owned objects and Scene contents do not scale or move on room
resize. Room frame edits use `transformLayoutRoomUnit` and its existing pivot
semantics. Reuse the existing 3D gizmo path where already supported.

**Must not:** introduce a general persistent geometric-constraint system
(FreeCAD/SolveSpace-class solver state, DOF/conflict UX and constraint graphs
are outside P23/product scope); create a second geometry pipeline; mutate Scene
to compensate for Layout edits; add numeric curved-wall length mutation or a
general wall-angle command (`auto-bezier` arc length is a readout only);
expand floor-wide height/elevation semantics (existing thickness/height fields
keep their owning scope); replace Arrange's X/Z/Yaw contract or make its
dimensions editable (dimension editing belongs to Layout).

→ Implementation detail, verified seams, fixtures and evidence plan:
[P23.1 child plan](2026-09-08-P23.1-precise-placement-and-dimensions.md)
(status `seed — pre-evidence`; requires P23-H1).

### P23.2 — Predictable Plan snapping and alignment

**Outcome:** Plan drafting snaps predictably — a configurable grid plus
semantic reference snapping (endpoints, midpoints, intersections, nearest-span,
orthogonal, opening edges, object bounds) and one-to-one alignment — all
derived from compiled geometry.

**Must:** extend the existing Plan snap controls, not global editor preferences
(keep the 0.25 m default; expose a finite positive grid step with the existing
validation pattern); reconcile the hard-coded quarter-meter paths so the
configured step reaches affected placement/translation gestures; derive snap
candidates from **`CompiledLayoutGeometry.queries` plus transient gesture
guides**; linear scan first (spatial index only on measured evidence); choose
winners deterministically (tool/context validity → semantic priority → screen
distance → stable ID) within a fixed CSS-pixel acquisition radius stable
across zoom; reference snap wins over grid; a visible guide/marker identifies
the winner; snap-off disables both; guides clear on cancel; alignment is one
selected supported object to one reference (object world AABB, room compiled
Plan bounds, or straight-wall reference with bounded **Center on wall**),
translating only the selected object; the Inspector reference picker keeps the
active selection intact; no-op alignment adds no history.

**Must not:** silently change Scene/Camera snapping or existing angle
modifiers; let Plan/SVG code independently reconstruct or resample authored
geometry into a second snap truth; serialize persistent constraints; invent a
multi-selection owner; add Flatten.js for feature parity or `robust-predicates`
except behind a layout-core adapter proven necessary by degeneracy fixtures
(P23.7).

→ Implementation detail, verified seams, fixtures and evidence plan:
[P23.2 child plan](2026-09-08-P23.2-snapping-and-alignment.md)
(status `seed — pre-evidence`; requires P23-H2).

### P23.3 — Openings that fit

**Outcome:** openings fit their walls predictably — numeric center/
clearance placement plus straight-segment direct manipulation (body drag,
width handles) — without changing the meter-based attachment model.

**Must:** build on existing door/window offset, width, height, sill and
profile controls; expose segment length and remaining clearance; make explicit
that offset is the opening's start measured in **meters along the segment**;
add Center on segment and distance-from-end placement by converting to the
existing offset representation; for straight segments add body drag (slides
along its owning segment only) and left/right width handles, with the gesture
keeping `segmentId`/height/sill/profile unchanged unless the edited field owns
the value, transient preview, one history commit on pointer-up, and clean
cancellation; validate the whole candidate (finite positive dimensions,
segment limits, vertical fit, overlapping intervals) using canonical geometry
rules; expose the existing optional door `connectsRoomIds` through an explicit
room choice (codec-enforced doors-only/existing-members/owner-first invariants
mean the picker offers only valid non-owner rooms); show the actual compiled
result.

**Must not:** migrate the schema to normalized `t`; add door-leaf meshes or
open/close behavior; clamp overflow silently (numeric and direct edits
reject); change curved-segment behavior (the body-drag/width-handle assistance
may be straight-only with a stated reason); infer relations from adjacency,
create camera edges, or promise a relation cuts a second wall; leave kind
changes silently resetting fields (preserved-only-valid-fields with explicit
UI); two physical wall openings remain explicit authored openings.

→ Implementation detail, verified seams, fixtures and evidence plan:
[P23.3 child plan](2026-09-08-P23.3-openings-that-fit.md)
(status `seed — pre-evidence`; requires P23-H1, shared with P23.1).

### P23.4 — Duplicate and linear repeat

**Outcome:** the creator duplicates or linearly repeats supported structure —
one object, one opening, or one room with its owned Layout structure — as
independent canonical records in one atomic, undoable operation.

**Must:** support one authored non-profile layout object, one opening on its
current segment, or one room with its owned supported layout objects; copies
are independent canonical records; duplicate is repeat with one copy; the
creator supplies translation X/Z (objects/rooms) or spacing in meters along
the segment (openings); repeat adds an integer 1–50 copies (deliberate cap,
raised only with measured evidence); generate from `index × delta`, not
accumulated rounded offsets; allocate unique IDs and remap internal
references; preview and validate the whole batch once — any invalid copy
rejects the operation with the failing target/reason; one commit and one Undo
cover the batch; select the first new top-level target after success.

**Must not:** copy furniture, Scene entities or camera tours with a room
(state it beside the action); silently strip read-only profile objects or
external door relations from room copies (reject until the creator removes
them; never link clones back to originals); allow linked doors on standalone
opening copies; add persistent array relations, definition/instance overrides
or a component framework (research precedent: bake independent normal
entities); create multi-selection because repeat creates several records.

→ Implementation detail, verified seams, fixtures and evidence plan:
[P23.4 child plan](2026-09-08-P23.4-duplicate-and-linear-repeat.md)
(status `evidence complete — reconciliation pending`; no gating harvest —
reconcile against the live repository, mark `implementation-ready`, implement).

### P23.5 — Small architectural preset set

**Outcome:** three labeled creation presets — **Column** (cylinder),
**Platform** (box), **Plinth** (box) — that drop in as ordinary Layout objects
with sensible editable dimensions.

**Must:** use existing shapes and primitive placement/preview/validation/
cancellation paths; presets are creation defaults with editable dimensions and
floor-relative placement; use existing native number inputs and
toolbar/Inspector placement; Plan, 3D and the published runtime consume the
exact same objects through the compiler.

**Must not:** ship a generic box preset called `Partition` in this minimum
slice (a wall-like box cannot own openings or participate in room-boundary
semantics — a misleading second-class wall concept; register a display
partition later as an explicit fixture/template with truthful semantics if it
becomes a repeated need); create linked prefab instances, new serialized
object kinds, a preset editor, library service, dependency or metadata schema.

→ Implementation detail, verified seams, fixtures and evidence plan:
[P23.5 child plan](2026-09-08-P23.5-architectural-presets.md)
(status `evidence complete — reconciliation pending`; no gating harvest —
reconcile against the live repository, mark `implementation-ready`, implement).

### P23.6 — Architectural drafting visual pass

**Outcome:** Scene → Plan → Layout reads like a deliberate architectural
drafting surface — wall/room/opening hierarchy, architectural dimensions, snap
markers and distinct invalid/preview states — across shipped themes and
working zooms.

**Must:** run **after** the semantic behaviors (P23.1–P23.5) are stable;
remain **presentation/interaction projection only**; keep
`PlanRenderModel`/compiled query data as the source and `PlanSvg.svelte`/
existing Plan chrome as the renderer; make authored hierarchy and interaction
state obvious (walls, rooms, openings with selected-only body/width handles
matching P23.3, selected straight-wall/rectangular-room dimensions, snap
winner markers, object footprint hierarchy, grid major/minor readability,
distinguishable invalid/preview states); reuse P21 theme tokens and Plan paper
identity; maintain keyboard focus visibility and contrast across all shipped
editor themes; bound label/dimension placement to simple offset/collision
avoidance.

**Must not:** add durable Layout fields, a second Plan geometry model, a new
selection system, or consumer-owned geometry; invent door swing/hinge/
handedness graphics until those semantics are authored; introduce a new CAD
theme, hard-coded per-theme palettes, decorative gradients/shadows or a second
visual system; build a general annotation-layout solver or persistent
annotation/dimension state; let visual density/zoom change snap coordinates,
world coordinates or documents.

→ Implementation detail, verified seams, fixtures and evidence plan:
[P23.6 child plan](2026-09-08-P23.6-architectural-drafting-visual-pass.md)
(status `seed — pre-evidence`; requires P23-H2, after P23.1–P23.5).

### P23.7 — Integration, robustness and closeout

**Outcome:** the new CAD-like behavior is proven deterministic under geometric
degeneracy and the whole slice passes end-to-end integration, regression and
bundle gates with contracts updated.

**Must:** cover degeneracy fixtures — near-collinear intersections, nearly
coincident endpoints, zero/tiny wall length, endpoint intersection,
deterministic snap ties, opening-invalidating wall resize; keep interaction
tolerance separate from authored-geometry validity (four separated classes per
the robustness policy); run the end-to-end author/save/preview/publish checks,
regression/bundle gates and contract updates; record actual command results.

**Must not:** introduce a general geometry kernel; adopt a broad geometry
framework; let a single magic `EPSILON` control both pointer UX and topology.
If fixtures prove current math insufficient, prefer a focused
`robust-predicates` adapter in `layout-core` (the one permitted focused
dependency) before anything broader.

→ Implementation detail, verified seams, fixtures, manual integration flow and
evidence plan: [P23.7 child plan](2026-09-08-P23.7-integration-closeout.md)
(status `seed — pre-evidence`; requires P23-H3 for fixture provenance; may be
consulted earlier if P23.2 fixtures expose a genuine robustness problem).

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
integration/closeout — each slice only after its required evidence is complete
and its child plan is reconciled to `implementation-ready` (child-plan statuses
and the harvest sequencing rule live in the references section). Evidence
ordering, per the evidence-selection rule (no research for research's sake):

```text
Approve P23 umbrella
→ complete H1 → reconcile/finalize P23.1 → implement P23.1
→ complete H2 → reconcile/finalize P23.2 → implement P23.2
→ reuse H1 + current repo → finalize P23.3 → implement P23.3
→ finalize P23.4 → implement P23.4
→ finalize P23.5 → implement P23.5
→ use H2 → finalize P23.6 → implement P23.6
→ complete/reconcile H3 → finalize P23.7 → integration closeout
```

H3 may be consulted earlier if P23.2 degeneracy/intersection fixtures reveal a
genuine robustness problem. H4 remains demand/schedule gated — do not run it
merely because its artifact path is registered. P23.4/P23.5 need no gating
harvest; their child plans record the explicit no-evidence-required decision.

For each semantic capability, demonstrate a headless call
over a plain document with explicit target IDs, then its UI adapter. Existing
helpers count as headless operations; no transport or command registry is
required. For P23.1, author the straight-wall-length and rotated-rectangle
acceptance fixtures before implementation — starting from the harvest
artifact's provenance-tagged fixtures (research T1/T2 lineage) and the
openPlan3D wall-editing tests — the wall-editing path is the
highest-risk candidate in this set. P23.6 is rendering/presentation acceptance and must prove it introduces
no authored document or history changes.

The acceptance table below is the umbrella's **high-level acceptance gate**;
the detailed test/fixture lists per slice live in the child plans and must
agree with it. Conflicts resolve toward the umbrella contract.

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

## Progressive-planning migration accounting

The 2026-09-08 progressive-planning restructure moved implementation detail
from this umbrella into child-plan seeds. Classification of every substantive
pre-existing detail (umbrella contract / child seed / evidence context /
deferred with reason) — nothing was discarded:

| Existing detail | Old location | New owner | Class | Notes |
|---|---|---|---|---|
| User outcome, scope, exclusions, dependencies | §User outcome / intro | this umbrella | umbrella contract | unchanged |
| Path convention, seam table, maturity recheck | §Existing implementation | this umbrella (+ child seeds carry their slice's seams) | umbrella contract | children quote verified seams |
| Harvest passes H1–H4, artifact contract, license rules, READ FIRST table, sequencing rule | §External research references | this umbrella | evidence context | governance stays central |
| Operation/ownership contract, transaction rules | §Operation and ownership | this umbrella | umbrella contract | unchanged |
| P23.1 numeric input semantics, wall-length candidate steps, rectangle rules, room-frame pivot warning, openPlan3D port notes | §P23.1 | [P23.1 seed](2026-09-08-P23.1-precise-placement-and-dimensions.md) | child seed | umbrella keeps Must/Must-not |
| P23.2 grid-step reconciliation, snap candidate list, acquisition/priority rules, alignment modes | §P23.2 | [P23.2 seed](2026-09-08-P23.2-snapping-and-alignment.md) | child seed | " |
| P23.3 clearance/center/end placement, body-drag/width-handle gesture rules, relation picker guidance | §P23.3 | [P23.3 seed](2026-09-08-P23.3-openings-that-fit.md) | child seed | codec invariants kept in both |
| P23.4 delta/remap mechanics, two-pass clone shape, restrictions | §P23.4 | [P23.4 seed](2026-09-08-P23.4-duplicate-and-linear-repeat.md) | child seed | " |
| P23.5 preset semantics, Partition exclusion rationale | §P23.5 | [P23.5 seed](2026-09-08-P23.5-architectural-presets.md) | child seed | Partition exclusion kept in both (durable) |
| P23.6 eight-element visual language, token rules, collision policy | §P23.6 | [P23.6 seed](2026-09-08-P23.6-architectural-drafting-visual-pass.md) | child seed | " |
| Robustness policy, tolerance classes, robust-predicates adapter rule | §Geometry robustness policy | this umbrella + [P23.7 seed](2026-09-08-P23.7-integration-closeout.md) | umbrella contract + child fixture targets | policy is durable; fixtures live in P23.7 |
| UI/state/lifetime rules | §UI, state and lifetime | this umbrella | umbrella contract | unchanged |
| Per-increment acceptance table, 50-copy fixture rule, test-location rules | §Acceptance and sequencing | this umbrella (high-level gate) + child seeds (detailed lists) | umbrella contract + child seeds | children must agree; conflicts resolve toward umbrella |
| Manual integration fixture + final check commands | §Acceptance and sequencing | [P23.7 seed](2026-09-08-P23.7-integration-closeout.md) | child seed | umbrella keeps the gate list |
| Follow-up ladder, boundaries/fallback, rollback | §Follow-up / §Boundaries | this umbrella | umbrella contract / deferred | unchanged |
| Research reference table + precedents (openPlan3D, LibreCAD, SH3D, Blueprint3D, KittyCAD, robust-predicates, Flatten, JTS, Cavalier/clipper2) | §External research references | this umbrella → harvest artifacts at run time | evidence context | per-repo file/function/test detail moves into H-artifacts when produced |

Nothing was deleted. Where a rule is durably architectural it intentionally
appears in both umbrella and child (child restates, umbrella owns).

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