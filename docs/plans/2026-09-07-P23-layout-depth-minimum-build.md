# P23 — Layout Depth: minimum useful Build set

**Ratified cross-view direction:** [Unified Plan / 3D authoring addendum](2026-09-09-P23-P24-unified-plan-3d-authoring-addendum.md) — read alongside this plan for entity-owned mutations, selection continuity, gesture cancellation and PlanProxy/placement ownership. Existing scope, status and dependency gates remain unchanged.

**Created:** 2026-09-07 · **Status:** approved (tracker authoritative)  
**Depends on:** P22 complete, including hosted cold-visitor acceptance.  
**Owner reconciliation ratified:** 2026-09-09.  
**Evidence basis:** completed `P23-H1`, `P23-H2`, `P23-H3`, `P23-H5`, current Museum Editor code, and the staging wall-first proposal.  
**Implementation status:** not started. Current product behavior remains room-owned / room-local until the P23 Foundation Gate ships.

This is the reconciled P23 umbrella. The accepted reconciliation — informed by the harvests — supersedes conflicting earlier P23 and North-Star direction. Harvest artifacts remain evidence, not implementation authority.

## User outcome

A creator can sketch a small architectural layout from explicit Walls, divide it into persistent semantic Rooms, add doors/windows and non-room-dividing partitions, dimension and snap architecture precisely, place reusable architectural objects, and preserve the result through Undo, Save/Load, Preview and Publish.

The minimum is deliberately architectural rather than BIM/CAD-complete. It establishes one durable wall-first spatial model that later Build depth can extend.

## Ratified product direction

```text
LayoutDocument
├─ floors
│  ├─ Junctions
│  ├─ Walls
│  ├─ Openings → Wall
│  └─ Rooms → persistent semantics over derived enclosed faces
└─ objects → document-level, project/world-local

SceneDocument
└─ entities / clusters → project/world-local target

Camera
└─ nodes / targets / path data → project/world-local target
```

Core principles:

> **Walls define architecture. Junctions define explicit connectivity. Rooms describe enclosed semantic regions. Objects inhabit the broader project world. Cameras navigate that broader world.**

- `LayoutDocument` and `SceneDocument` remain separate sources of truth.
- `LayoutObject[]` remains document-level; P23 does not move Layout objects under Floors.
- A physical Wall exists once even when it bounds two Rooms.
- Openings are hosted by Walls, not duplicated Room-owned segments.
- `boundary` Walls participate in Room face extraction.
- `partition` Walls use the same canonical physical/compiler machinery but do not split semantic Rooms.
- Scene/Camera physical placement migrates to project/world-local coordinates; Room containment becomes derived or optional semantic context where useful.
- Moving/editing architecture does not implicitly move staged Scene/Camera content after the migration.
- Plan, 3D and visitor all consume one canonical `compileLayoutGeometry()` pipeline.

## Current implementation versus target

Current code still stores Room-owned boundary segments/openings and requires Room ownership for Scene entities, clusters and Camera nodes. Current Room frames still resolve Scene/Camera world meaning. Existing component/architecture docs that describe those mechanics remain correct **current-behavior documentation until P23 Foundation ships**.

P23 changes the target architecture; it does not pretend that target already exists.

## Evidence authority

Read before implementation:

- `docs/Deep-research/P23-Staging-Research/harvest/P23-H1-wall-room-geometry.md`
- `docs/Deep-research/P23-Staging-Research/harvest/P23-H2-snapping-selection-guides.md`
- `docs/Deep-research/P23-Staging-Research/harvest/P23-H3-robust-geometry.md`
- `docs/Deep-research/P23-Staging-Research/harvest/P23-H5-room-identity-migration.md`
- `docs/Deep-research/P23-Staging-Research/P23-wall-first-replan-proposal.md` — staging decision record only; superseded as planning authority by this reconciled umbrella.

No additional broad research gate is required. Capability-local implementation rechecks remain required where a touched code seam has changed.

# Foundation Gate F0 — P23.0 + P23.8 are one ship gate

P23.0 and P23.8 are separate child plans for responsibility clarity but **they do not independently enable wall-first writes**.

```text
F0.1 — P23.0a
schema / IDs / compatibility scaffolding
NO new-schema writes
        ↓
F0.2 — P23.8
straight-wall topology + face extraction + Room reconciliation
        ↓
F0.3 — P23.0b
legacy migration + Scene/Camera world migration + compiler/query/runtime/editor-adapter integration
        ↓
F0 acceptance
        ↓
ENABLE WALL-FIRST WRITES
```

The editor must keep writing the existing canonical format until all F0 acceptance gates pass. A migrated wall-first document is not considered installable/editable merely because new types can be decoded.

## F0.1 — schema and identity scaffolding

Target concepts:

```ts
type LayoutJunction = {
  id: string;
  point: LayoutVec2;
};

type LayoutWall = {
  id: string;
  startJunctionId: string;
  endJunctionId: string;
  role: 'boundary' | 'partition';
  thickness: number;
  height: number;
  // exact compatibility geometry representation for legacy curves is bounded below
};

type LayoutOpening = {
  id: string;
  wallId: string;
  kind: 'door' | 'window';
  offset: number; // physical meters from canonical Wall start
  width: number;
  height: number;
  sillHeight: number;
  profile: 'rectangular' | 'rounded' | 'pointed';
  connectsRoomIds?: [string, string];
};

type OrientedWallRef = {
  wallId: string;
  direction: 'forward' | 'reverse';
};

type LayoutRoom = {
  id: string;
  name: string;
  boundary: OrientedWallRef[];
  floorThickness: number;
  ceilingThickness: number;
};
```

This is the contract shape, not permission to invent unrelated schema fields.

Required identity rules:

- Junction IDs are document-authoritative connectivity. Proximity may offer a snap, never implicit ownership.
- Wall IDs survive deformation and never derive from coordinates.
- Canonical Wall direction is stable; endpoint edits do not silently reverse opening offsets.
- Opening IDs are document-global in the new schema.
- Room IDs remain persistent semantic identities; topology never allocates them by itself.
- New IDs allocate deterministically from the pre-commit document, never timestamps/randomness.

Introduce explicit new Layout and Scene format identification. Do not freeze a numeric version until historical format usage is rechecked during implementation. Missing format version identifies the currently supported legacy shapes only where the compatibility decoder explicitly recognizes them.

## F0.2 — topology and persistent Room reconciliation

H3 owns straight-segment topology; H5 owns product identity.

```text
explicit Wall/Junction graph
        ↓
H3 candidate faces + diagnostics
        ↓
Museum Room correspondence
        ↓
persistent LayoutRoom IDs + metadata
```

Geometry/topology may derive candidate faces. It must not allocate, regenerate, retire, split, merge or otherwise own persistent Room identity.

Initial automatic correspondence is bounded **per affected correspondence component**:

- `0 → new faces` first enclosure creation — foundation-owned, deterministic IDs/names and 0.1 m floor/ceiling defaults;
- `1 → 1` lineage-preserving deformation — automatic;
- `1 → 2` simple split — automatic;
- `2 → 1` simple merge — automatic subject to metadata policy;
- Wall subdivision with unchanged Room topology — automatic;
- broader many↔many in one component — reject with diagnostics.

One user command may affect several independent simple components. If every affected component is supported, the complete candidate may commit atomically. If any component is unsupported/ambiguous, the whole command rejects before commit.

Room correspondence evidence order:

```text
explicit authoring-operation Wall/Junction lineage
→ candidate-face boundary lineage
→ predecessor/candidate overlap area
→ temporary predecessor interior witness as secondary tie evidence
→ canonical candidate face key
```

Never use Room count, traversal order, array order, timestamps or randomness as identity evidence.

### Wall subdivision contract

For `W(A → B)` split at `X`:

```text
A────────────B
A────X───────B
```

- `A → X` retains Wall ID `W`;
- `X → B` gets one deterministic new Wall ID;
- affected oriented Room boundaries replace `W` in the correct forward/reverse order;
- opening wholly before split keeps host/offset;
- opening wholly after split keeps Opening ID, moves to the new Wall, and uses `offset' = offset - splitDistance`;
- split through an opening interior rejects;
- split at opening start/end follows the H5 boundary rules;
- selection, validation, compiled/query identities and history reconcile atomically.

### Split / merge identity

Simple `1 → 2`:

- greatest predecessor-overlap child retains old Room ID;
- exact tie: unique predecessor interior witness if decisive, otherwise canonical `faceKey`;
- other child gets a deterministic new Room ID;
- survivor keeps name; new Room gets deterministic default naming;
- floor/ceiling thickness duplicates to both children.

Simple `2 → 1`:

- predecessor contributing greatest area retains its Room ID;
- exact tie uses stable existing Room ID ordering;
- survivor keeps name;
- equal floor/ceiling thickness merges automatically;
- conflicting floor/ceiling thickness rejects until an explicit resolution flow exists.

Room disappearance retires Room identity only after topology confirms no enclosed descendant face remains and all semantic references can be explicitly resolved.

`LayoutObject.roomId?` remains an optional explicit semantic association, never containment or transform ownership. Migration preserves valid associations and world transforms. On 1→1 edits/subdivision retain it; on split retain the predecessor ID (the surviving Room), without choosing by object position; on merge remap retired IDs to the surviving Room; on disappearance clear the association. These Layout-only changes are part of the same candidate/history snapshot. Never move or delete an object because its associated Room changes. Unassociated objects stay unassociated; do not infer associations from containment. Validate every remaining reference before commit.

## Umbrella-level rejection policy

These are product contracts, not hidden P23.8 implementation details:

- collinear Wall overlap in normal new wall-first authoring → reject;
- zero/tiny invalid Wall → reject under canonical authored-size policy;
- non-noded invalid straight-wall topology → reject;
- proximity-only connectivity repair → reject;
- unsupported nested/hole region topology in the initial minimum → reject with diagnostics unless a separately specified simple case is proven safe;
- ambiguous Room correspondence → reject;
- many↔many affected correspondence component → reject;
- split through opening interior → reject;
- conflicting Room floor/ceiling metadata on merge → reject pending explicit resolution;
- unresolved portal semantic remap → reject;
- invalid/no-op/cancelled operation → no history.

H3 owns predicate/tolerance policy. H5 must not introduce a second epsilon or geometry kernel.

# Compatibility and migration contract

Compatibility is part of F0, not a P23.7 afterthought.

## Full Project migration

For a recognized legacy Project with known original Layout + Scene context:

```text
strict legacy decode
→ capture legacy Room frames
→ resolve every Room-local Scene/Camera spatial value to project/world space
→ migrate Layout segments/openings to Wall/Junction/Openings
→ H3 candidate faces
→ bind existing Room IDs through H5 reconciliation
→ validate one canonical new Project candidate
→ install editable state
```

Migration runs before normal editor history is established and never installs a partially mixed schema.

World conversion includes at minimum:

- Scene entity position;
- Scene entity rotation using the actual legacy transform composition;
- Scene cluster ownership assumptions while preserving cluster identity/member order;
- Camera node eye position;
- Camera node target;
- position-path anchors with Room ownership;
- target waypoints with Room ownership;
- directional view-key targets with Room ownership.

Records already authored in project/world space remain unchanged.

## Trustworthy legacy Room-frame context

A matching Room ID in the currently open project is **not sufficient evidence** that it is the original frame used to author an imported legacy Scene.

Legacy Room-local Scene conversion is permitted only when the converter has trustworthy source context, for example:

- the Scene and Layout came from the same recognized legacy Project snapshot/version;
- a package format explicitly carries or cryptographically/structurally binds the required frame context;
- the user supplies an explicit Room-ID → legacy-frame mapping through an import flow designed for that purpose.

If the required original frame context is absent or untrustworthy, reject conversion with a specific missing/untrusted-frame-context diagnostic. Never reinterpret legacy local coordinates as world coordinates and never guess by matching IDs alone.

## Standalone `scene.json` / `.scenepack`

Current `.scenepack.zip` exports `scene.json` without Layout Room frames. The current Scene codec also has no live version field/migration dispatcher.

Therefore P23 must introduce Scene-format identification alongside Layout-format identification.

- new Scene format → project/world-local spatial values;
- recognized legacy Scene format → Room-local values requiring trustworthy original Room-frame context for migration;
- legacy standalone Scene without trustworthy frame context → reject conversion;
- new world-local Scene packages no longer require Room frames to interpret physical placement.

Package-format version and Scene-document version remain separate concerns.

## Read-only legacy compatibility path

Not every valid legacy document is losslessly migratable. Ambiguous coincident walls/openings and preserved curved geometry require a concrete compatibility path.

```text
raw saved / published data
        ↓
compatible decode
        ↓
prepare runtime/compile source
        ↓
compileLayoutGeometry()
        ↓
Plan / 3D / visitor
```

The compatibility preparation layer may normalize legacy records into the canonical renderer-neutral compile input, but there remains **one actual geometry compiler/output model**. No legacy SVG renderer, legacy Three renderer, visitor-only compiler or second Plan geometry interpretation is allowed.

For conflicting coincident legacy walls:

- preserve the distinct legacy physical records in compatibility preparation;
- do not silently collapse or discard one side;
- remain readable/renderable in read-only compatibility mode;
- block new-schema Save until the conflict is explicitly resolved.

For legacy `auto-bezier` boundaries:

- preserve authored curve fidelity;
- never flatten to straight segments and call it lossless;
- use a compatibility geometry variant or read-only compatibility representation until a fidelity-preserving canonical Wall representation exists.

## Legacy Scene runtime preparation

A read-only legacy Project may intentionally retain legacy Room frames and Room-local Scene/Camera data.

Runtime preparation must distinguish state explicitly:

```text
legacy-compatible Scene + legacy Room frames
→ resolve local values exactly once for runtime

migrated/new world-local Scene
→ consume project/world values directly
```

No consumer may apply a Room transform to already migrated world-local content. The compatibility/result type must make coordinate-space state explicit enough that editor Preview and visitor cold runtime cannot double-transform content.

Published legacy snapshots remain immutable. Compatibility occurs in shared decode/runtime preparation; stored release JSON is never rewritten in place and visitor code never imports editor session/history/gizmo infrastructure.

## Legacy portal compatibility

Current legacy `connectsRoomIds` allowed relations that were not proven physically adjacent. The stricter wall-first portal contract must not make old saved/published projects unreadable.

- compatibility mode preserves the recognized legacy relation interpretation exactly enough for old runtime behavior;
- legacy nonadjacent relations are not silently cleared during read-only load;
- such a relation blocks new-schema Save until it is explicitly resolved to the new contract or intentionally removed;
- old immutable publications continue loading through compatibility preparation.

# Portal semantics in the new schema

Physical adjacency and semantic portal intent are separate.

```text
Wall-side topology → physical adjacent Room(s)
door.connectsRoomIds? → explicit semantic inter-Room portal intent
```

For a **new-schema** relation to be valid:

1. the opening is a `door`;
2. it names two distinct persistent Room IDs;
3. both Rooms are the two physical Rooms adjacent to the hosting boundary Wall at the opening;
4. the tuple never creates adjacency by itself.

A door may exist without `connectsRoomIds`. Exterior doors and doors hosted by non-room-dividing partitions normally have no two-Room relation.

Topology edits must preserve/remap explicit relations when wall-side lineage gives one unambiguous result:

- split: map a referenced predecessor Room to the descendant actually adjacent on that opening side, not merely the child retaining the predecessor ID;
- merge: remap a side when two distinct adjacent semantic endpoints remain;
- if both tuple members collapse into the same surviving Room, clear the relation as an explicit planned semantic collapse while preserving the physical opening;
- disappearance/open enclosure: remap or clear only when operation lineage makes the consequence explicit;
- otherwise reject before commit.

# F0 editor-adapter cutover

New-schema writes must not be enabled while existing editor adapters still assume Room-owned geometry.

Before F0 enables wall-first authoring, rework or explicitly disable every supported old mutator/adapter that could write incompatible state, including:

- Layout selection/hit identity and selection reconciliation;
- Inspector Room/segment/opening fields;
- Room drag / whole-Room transform behavior;
- 2D Plan vertex editing / Add Vertex;
- 3D Layout gizmo adapters;
- opening creation/editing;
- object creation/placement paths that expose Room ownership;
- Scene creation/placement and Camera creation paths that currently require a Room-floor hit;
- cluster creation/member validation that currently requires same-Room ownership;
- unified project tree assumptions that structurally nest Scene content under Rooms;
- Room deletion reference blockers;
- project validation and visitor resolution paths.

Supported operations must write only the new canonical model. Unsupported legacy editing actions must be disabled with an explicit reason rather than left capable of mutating stale Room-owned data.

F0 does **not** have to deliver the richer precision/snapping/sketching UX of P23.1/P23.2/P23.9, but it must provide a coherent minimum editor state over the new schema before writers turn on.

# Child slices

## P23.0 — Wall-first schema, compatibility, spatial migration and cutover

[Child plan](2026-09-09-P23.0-wall-first-foundation-migration.md)

Owns F0.1 and F0.3: format/version identification, document-global identities, shared compatibility decode/runtime preparation, Scene/Camera project-space migration, compiler/query source cutover, visitor parity, editor-adapter cutover, and the final writer-enable gate.

P23.0 cannot ship independently of P23.8.

## P23.8 — Straight-wall topology + persistent Room regions

[Child plan](2026-09-09-P23.8-wall-topology-room-regions.md)

Owns F0.2: robust straight-wall classification/noding, boundary-wall face extraction, diagnostics, Wall subdivision lineage, bounded Room reconciliation, metadata retention and topology-reference remapping.

P23.8 consumes P23.0a schema scaffolding and must complete before P23.0b migration/compiler cutover can enable writes.

## P23.1 — Precise Wall, Junction and Layout dimensions

[Child plan](2026-09-08-P23.1-precise-placement-and-dimensions.md)

Retain exact numeric LayoutObject editing. Reinterpret architectural precision around Junction X/Z, exact straight-Wall length, fixed endpoint, bounded angle editing, Wall thickness where supported, and rectangle sizing as a multi-Wall/Junction operation. `LayoutRoom.frame` is not a target authoring primitive after world-space migration. Rectangle resize fixes an explicit anchor Junction and incident width Wall; P23.1 defines stable defaults and corner mapping, including squares and rotated rectangles.

## P23.2 — Predictable Plan snapping and alignment

[Child plan](2026-09-08-P23.2-snapping-and-alignment.md)

Keep H2's deterministic snap/acquisition/guide model and map it to Junctions, Walls, Openings, Partitions and compiled object geometry. Snap suggestions never create topology until the committed operation records explicit Junction/Wall relationships.

## P23.9 — Wall / Partition sketching

[Child plan](2026-09-09-P23.9-wall-partition-sketching.md)

Primary architectural authoring workflow: continuous Wall/Partition chains, ephemeral draft, Backspace, Finish/Close, Escape, H2 snap/precision integration, and Rectangle/Polygon convenience tools that produce the same canonical Walls/Junctions. Valid open chains need not create Rooms.

## P23.3 — Wall-hosted openings that fit

[Child plan](2026-09-08-P23.3-openings-that-fit.md)

Retain physical-meter offset, size/profile validation, body drag, width handles, center/end-clearance helpers and reject-not-clamp semantics. Host one physical opening on one Wall. Apply the new portal contract above.

## P23.4 — Duplicate and linear repeat

[Child plan](2026-09-08-P23.4-duplicate-and-linear-repeat.md)

Keep deterministic two-pass clone/remap semantics for objects/openings. Room duplication is limited to an isolated Room whose bounded Wall/Junction/Opening subgraph can be cloned without detaching shared architecture; shared-boundary Room duplication rejects in the initial minimum.

## P23.5 — Small architectural preset set

[Child plan](2026-09-08-P23.5-architectural-presets.md)

Column / Platform / Plinth remain creation defaults over existing Layout object kinds. Do not ship a fake box `Partition`; Partition is first-class Wall authoring in P23.9.

## P23.6 — Architectural drafting visual pass

[Child plan](2026-09-08-P23.6-architectural-drafting-visual-pass.md)

Presentation only through compiled geometry / `PlanRenderModel` / existing Plan SVG authority. Add wall-first Wall/Junction/Room/Opening/Partition hierarchy, topology diagnostics, truthful dimensions and transient snap/draft feedback. Do not invent door handedness/swing semantics that are absent from authored data.

## P23.7 — Integration, compatibility and closeout

[Child plan](2026-09-08-P23.7-integration-closeout.md)

Runs last. Proves the complete Build loop, exact IDs/history, old save/publication compatibility, standalone Scene migration rejection/success cases, Scene/Camera exterior placement, Plan/3D parity, Save/Load, Preview and Publish.

# Execution order

```text
Foundation Gate F0
  P23.0a
      ↓
  P23.8
      ↓
  P23.0b + F0 compatibility/editor-adapter acceptance
      ↓
  ENABLE NEW WRITES
      ↓
P23.1
      ↓
P23.2
      ↓
P23.9
      ↓
P23.3
      ↓
P23.4 ─┐
P23.5 ─┘
      ↓
P23.6
      ↓
P23.7
```

P23.4/P23.5 may overlap where their concrete dependencies permit. Numeric child IDs preserve planning history; dependency order, not numeric order, governs execution.

# Canonical mutation/history contract

Every durable authoring intent follows:

```text
explicit target + intent
→ complete pure candidate
→ topology/Room correspondence where applicable
→ semantic/reference validation
→ canonical geometry compile/validation
→ one transaction commit
```

- invalid/cancelled/no-op → zero history;
- a completed command/gesture → at most one logical history result;
- current snapshot history restores exact committed IDs/metadata on Undo/Redo;
- redo never reruns Room correspondence or allocates fresh IDs;
- selection is an editor input/result, never an implicit mutation target for headless domain operations.

# Canonical compiler/query contract

```text
LayoutDocument or explicit legacy-compatible source
        ↓
shared compatibility/runtime preparation
        ↓
compileLayoutGeometry()
        ↓
renderer-neutral compiled/query geometry
        ↓
Plan / 3D / hit / snap / visitor
```

Wall-first compiler consequences:

- compile each physical Wall once;
- derive Junction join/cap geometry canonically;
- derive accepted Room floor/ceiling surfaces separately;
- compiled/query identity pivots from `(roomId, segmentId)` to canonical `wallId`, `junctionId`, `openingId` where physical geometry is concerned;
- Room-derived semantic/floor records retain persistent `roomId`;
- Plan/SVG never reconstructs topology.

# Acceptance gates

F0 must pass before new-schema writes:

- new Layout/Scene formats identified explicitly;
- legacy Project with trustworthy Room frames migrates Scene/Camera world transforms exactly;
- arbitrary Scene entity rotation preserves world transform, not only yaw;
- standalone legacy Scene with trustworthy supplied/source-bound frame context migrates;
- standalone legacy Scene without trustworthy frame context rejects specifically;
- read-only legacy Project resolves Room-local Scene exactly once;
- migrated/new Scene is not Room-transformed again;
- compatible exact shared walls/openings can migrate without changing Room IDs;
- conflicting coincident walls/openings remain readable without silent collapse and block new-schema Save;
- legacy curves remain readable without flattening;
- old active published release cold-loads without rewriting stored bytes;
- legacy nonadjacent portal relation remains readable in compatibility mode and blocks new-schema Save until resolved;
- Wall topology/Room fixtures cover first-enclosure creation (including Partition→boundary), 1→1, 1→2, 2→1, subdivision and rejected many↔many components;
- Layout-object semantic associations preserve/remap/clear according to P23.8 without moving/deleting objects, with exact Undo/Redo;
- editor selection/Inspector/gizmo/creation adapters either write new canonical records or are explicitly disabled;
- one canonical compiler/query output remains the Plan/3D/visitor truth.

Whole P23 closeout additionally proves:

- empty floor → outer Wall loop → one Room;
- add dividing boundary Wall → two persistent Rooms;
- add one shared-Wall door → one physical Opening;
- add interior Partition → physical Wall without Room split;
- exact Wall/Junction dimensions and deterministic snaps;
- Scene object and Camera may exist outside every Room;
- architecture edits do not move world-local staged content;
- split/merge preserves H5 identities and exact Undo/Redo;
- object/opening repeat and isolated Room duplicate behave deterministically;
- Plan/3D, Save/Load, Preview and Publish remain coherent;
- visitor/editor isolation and existing camera route/motion authorities remain intact.

# Deferred scope

Do not expand the minimum into:

- general persistent constraint solving;
- automatic topology repair/proximity ownership;
- arbitrary many↔many Room identity solving;
- general nested/hole region authoring;
- complex curved-wall topology/intersections;
- flattening legacy curves;
- multi-floor topology workflow expansion;
- BIM assemblies/structural semantics;
- stairs/railings/roof systems;
- profile/extrude/sweep/revolve depth;
- terrain/building/campus/town hierarchy;
- automatic move-architecture-plus-staged-content coupling;
- persistent Room identity anchors solely for correspondence;
- a new command bus, CRDT/event sourcing, or second compiler;
- a second Camera/navigation/motion system.

A later explicit grouped operation may move architecture and selected/staged content together, but ordinary Wall/Room topology edits do not.

# Documentation reconciliation rule

The accepted 2026-09-09 reconciliation is the architecture decision. H1/H2/H3/H5 informed it; they do not themselves supersede product contracts.

North Star is amended in the same documentation reconciliation to state the destination architecture. Existing architecture/component docs continue to describe current room-owned/room-local implementation until code changes land, and must be updated as each F0 cutover actually ships.
