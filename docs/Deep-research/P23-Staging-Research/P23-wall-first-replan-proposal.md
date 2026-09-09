# P23 Wall-First Re-plan Proposal

**Status:** staging architecture proposal; pending H3 topology harvest and a bounded Room-identity / migration study before final P23 reconciliation.

**Repository baseline reviewed:** `1f0d02b64c1701f6d48a7704e0e08abcb2fd659a`

**Evidence already available:** completed P23-H1 and P23-H2 harvests plus current P23 research/plan material.

## 1. Proposed direction

Reframe P23 from a room-owned polygon editor into a **wall-first spatial layout system**.

Current conceptual model:

```text
Floor
└─ LayoutRoom
   ├─ boundary segments
   └─ openings

Scene / Camera entities
└─ room-associated placement
```

Target conceptual model:

```text
Floor
├─ Junctions
├─ Walls
├─ Openings
└─ Rooms        semantic enclosed regions over wall topology

SceneDocument
└─ Objects      spatial content

Camera system
└─ Camera nodes spatial/navigation content
```

Core product principle:

> **Walls define architecture. Rooms describe enclosed spatial regions. Objects inhabit the broader world. Cameras navigate the broader world.**

`Room` remains first-class semantic state, but should no longer be the owner of physical wall geometry or the mandatory root container for all spatial placement.

## 2. Product rationale

The current room-first model constrains architectural authoring:

- non-rectangular layouts center on explicit polygon-room construction;
- adjacent rooms duplicate coincident wall geometry;
- doors between adjacent rooms become a synchronization problem;
- inserting a complete dividing wall does not naturally create two enclosed regions;
- room-owned placement is increasingly artificial for cameras and future exterior content.

The intended Plan workflow is closer to conventional floor-plan drafting:

1. draw an outer wall chain;
2. draw internal walls;
3. derive enclosed room regions;
4. add doors/windows to walls;
5. add non-room-dividing exhibition partitions;
6. place Scene content and Camera nodes without hard room containment.

This also aligns with the broader product direction beyond enclosed interiors: courtyards, sculpture gardens, backyards, outdoor installations, multiple buildings, campuses and eventually larger spatial environments. P23 does not need to implement those hierarchies, but it should avoid making `Room` the root container for the authored world.

## 3. Verified current implementation constraints

The current repository establishes the following relevant behavior:

- Floors contain Rooms; Rooms contain boundary segments, openings and wall thickness data.
- Boundary endpoints are already expressed in layout/world X/Z; room frames separately support room-local content resolution.
- Layout objects already use world transforms with optional `roomId`.
- `compileLayoutGeometry()` compiles Rooms independently and emits room walls, openings, floor and ceiling geometry.
- Geometry validation checks closed room rings, self-intersection and opening fit per Room; it is not yet a planar wall-network validator or face extractor.
- Scene entities, clusters and Camera nodes currently require room ownership, while several Camera-related anchors/targets already have world-local seams.
- One chronological history stack supports separate Scene and Layout entries; concurrent domain transactions are blocked.
- Current project/Layout/Scene codecs do not provide a general serialized-schema migration dispatcher.
- Cold visitor preparation validates the saved project, compiles Layout and resolves Scene through the room registry.

Consequences:

- wall/opening promotion requires explicit identity and compatibility migration;
- shared walls must compile once rather than once per Room;
- room-region extraction and topology validation are new canonical responsibilities;
- world-local Scene/Camera placement is architecturally plausible but has a meaningful migration blast radius;
- visitor compatibility and published snapshots are part of the migration contract.

## 4. Canonical wall-first Layout model

Evaluate a straight-wall minimum conceptually similar to:

```ts
type LayoutJunction = {
  id: JunctionId;
  point: Vec2;
};

type LayoutWall = {
  id: WallId;
  startJunctionId: JunctionId;
  endJunctionId: JunctionId;
  role: 'boundary' | 'partition';
  thickness: number;
  height: number;
};

type LayoutOpening = {
  id: OpeningId;
  wallId: WallId;
  offset: number; // meters from canonical wall start
  width: number;
  height: number;
  sillHeight: number;
  kind: 'door' | 'window';
  profile: 'rectangular' | 'rounded' | 'pointed';
};

type OrientedWallRef = {
  wallId: WallId;
  direction: 'forward' | 'reverse';
};

type LayoutRoom = {
  id: RoomId;
  boundary: OrientedWallRef[];
  // semantic room metadata, floor/ceiling properties, etc.
};
```

This is a direction, not a final schema. Existing curve fidelity and current serialized fields require explicit reconciliation.

### Required invariants

- **Junction IDs own connectivity.** Proximity may offer a snap/join, but accepted connectivity is explicit.
- **Wall IDs survive deformation.** IDs must not derive from endpoint coordinates.
- **Wall start direction is stable.** Moving endpoints must not silently reverse opening offsets.
- **Room boundaries reference Walls.** They do not duplicate wall coordinates.
- **A physical shared wall exists once.** Zero, one or two Room faces may reference its sides.
- **Partitions share canonical wall/opening/rendering machinery** but do not participate in Room face extraction.
- **Openings are hosted by Walls**, not Room-owned segment copies.

## 5. Room semantics and face extraction

A Room corresponds to an enclosed face formed by `boundary` Walls.

```text
outer closed wall loop
→ one enclosed face
→ one Room

outer loop + complete boundary divider
→ two enclosed faces
→ two Rooms

same divider + door opening
→ still two Rooms
```

Openings change wall geometry, not room-separation semantics.

The required ownership boundary is:

```text
wall graph
   ↓
geometry/topology derives candidate faces
   ↓
Museum Room reconciliation
   ↓
persistent LayoutRoom identities
```

Topology code must not allocate disposable Room IDs during ordinary compilation or rendering.

## 6. Boundary Walls vs Partitions

Museum needs internal physical walls that do not necessarily create new semantic rooms.

```ts
role: 'boundary' | 'partition'
```

- `boundary`: participates in enclosed-face topology.
- `partition`: physical architecture that may render, collide and support staged content, but does not split the semantic Room.

This supports gallery/exhibition layouts without requiring confirmation dialogs for every internal wall.

## 7. Persistent Room identity

Derived geometry must not make Rooms disposable.

Required transaction shape:

```text
explicit wall/junction operation
→ complete candidate wall graph
→ candidate faces
→ deterministic Room correspondence
→ metadata/reference validation
→ canonical geometry validation/compiler checks
→ one Layout commit
```

Recommended initial correspondence semantics to validate through H5/spike:

- **deformation:** preserve Room identity when correspondence remains one-to-one;
- **wall subdivision:** preserve Room identity through edge lineage;
- **simple split:** child with greatest overlap keeps the prior Room ID; deterministic tie-break independent of traversal order;
- **simple merge:** predecessor contributing greatest area keeps its Room ID; deterministic tie by stable Room ID;
- **opened enclosure:** retire the Room while retaining Walls, subject to reference validation;
- **complex many-to-many topology change:** reject with diagnostics in the initial release rather than guessing.

Undo/Redo must restore the recorded result, including Room IDs and metadata, rather than rerunning reconciliation.

## 8. Deterministic wall split contract

Wall subdivision should have an explicit identity rule.

For a split at distance `d` from canonical wall start:

- fragment containing the original start retains the existing Wall ID;
- second fragment receives a new Wall ID;
- openings wholly after the split move to the second fragment and use `offset' = offset - d`;
- splitting through an opening interior rejects;
- affected Room boundary references update atomically;
- selection/history update in the same transaction.

This rule should become an acceptance contract, not renderer behavior.

## 9. Scene and Camera placement direction

Long-term target:

```text
Scene object → project/world-local transform
Camera node  → project/world-local transform
Room         → derived or optional semantic context
```

This better supports exterior content, courtyards, gardens, multiple buildings and larger spatial scenes. Moving architectural Walls should not implicitly move staged content.

However, current Scene entities, clusters and Camera nodes depend on room ownership. The final P23 plan must determine whether migration is direct or staged.

Two strategies remain implementation options until the migration spike is complete:

### A. Transitional owner

```ts
type SpatialOwner =
  | { kind: 'room'; roomId: RoomId }
  | { kind: 'layout' };
```

### B. Project/world-local transforms

Scene and Camera transforms become project/world-local; Room association is derived or optional semantic metadata.

**Preferred target:** B. The migration plan must prove rotation composition, Camera eye/target conversion, path/waypoint conversion, cluster semantics, visitor compatibility and existing saved-project fidelity before finalizing sequencing.

## 10. Wall-first Plan authoring

Primary creation should become architectural drafting:

```text
Wall
→ click endpoint
→ preview segment
→ snap / dimension
→ click next endpoint
→ continue chain
→ close or finish
```

Supporting tools may include:

- Wall
- Partition
- Rectangle
- Polygon
- Door
- Window

Rectangle and Polygon remain useful convenience operations, but should create the same canonical Walls/Junctions rather than remain independent geometry systems.

A completed wall chain should be one transaction: clicks extend draft state, Backspace removes the latest draft segment, Finish/Close commits once, Escape cancels the draft. Valid open chains may persist without creating Rooms.

`Add Vertex` should be reinterpreted as wall subdivision with deterministic identity, opening, room-boundary, selection and history behavior.

## 11. Openings under wall-first architecture

P23.3 should move from:

```text
Opening → Room segment
```

to:

```text
Opening → LayoutWall
```

A shared wall between two Rooms therefore hosts one physical door/window and compiles one cut.

Retain H1's strongest semantics:

- `offset` remains physical meters from canonical wall start;
- width remains explicit;
- full candidate validation before commit;
- overflow/overlap/vertical errors reject rather than silently clamp;
- completed gesture produces one history result;
- invalid/cancelled/no-op produces none;
- compiled/query geometry remains interaction and placement truth.

## 12. Compiler and rendering architecture

The existing canonical compiler boundary remains mandatory:

```text
LayoutDocument
      ↓
compileLayoutGeometry()
      ↓
renderer-neutral compiled/query geometry
      ↓
Plan / 3D / selection / hit-testing / visitor consumers
```

Required compiler changes include:

- compile physical Walls once;
- derive Room regions separately;
- derive floor/ceiling surfaces from accepted Room faces;
- derive wall-side context for adjacent Rooms where needed;
- replace room-ring-dependent wall join geometry with canonical Junction join/cap geometry.

Do not introduce renderer-owned topology or a second Plan geometry interpretation.

## 13. P23 re-plan direction

Final numbering should be reconciled against the current umbrella. The following responsibilities are provisional.

### Foundation

- Junction/Wall/Opening schema;
- stable document-level identities;
- compiler/query/mesh contracts;
- serialized compatibility and migration;
- Scene/Camera transform migration strategy;
- transaction/history failure semantics;
- visitor parity.

### Room regions

- face extraction integration;
- persistent Room correspondence;
- subdivision/split/merge rules;
- metadata retention;
- deterministic fixtures.

### P23.1 — Precision

Reinterpret around:

- exact Wall length;
- fixed endpoint;
- endpoint coordinates;
- angle;
- Junction movement;
- wall subdivision;
- affected-network validation;
- rectangle sizing as a bounded multi-wall operation.

Retain compatible object numeric editing.

### P23.2 — Snapping/alignment

H2 is complete and largely reusable. Map it onto first-class Junctions, Walls, Openings and Partitions. Extend only where wall-first drafting requires additional bounded candidates such as midpoint/intersection/extension/parallel/perpendicular/angle-distance aids. No persistent constraint solver.

### P23.3 — Openings

Wall-hosted placement, body drag, width handles, clearances, profiles and full fit validation. Room adjacency derives from wall sides rather than independently edited room pairs.

### Wall sketching

Continuous Wall/Partition chains, draft preview, dimensions/snapping, close/finish/backtrack/cancel, and Rectangle/Polygon convenience creation through the canonical wall model.

### P23.6 — Architectural drafting visual pass

Retain and reinterpret around first-class Wall/Junction/Opening/Partition/Room-region presentation, truthful dimensions and transient guides.

### Integration

Prove author → save → load → preview → publish across legacy migration, exterior content and topology edits.

## 14. Harvest reinterpretation

### H1 — complete; reinterpret

Retain:

- candidate-first mutation;
- fixed-end editing;
- stable IDs;
- atomic validation/history;
- meter opening offsets;
- no silent clamping;
- opening-fit validation;
- adversarial fixtures.

Supersede the assumption that a room-owned ordered segment ring is the primary editing topology.

Blueprint3D oriented-side / wall / corner concepts and Sweet Home 3D explicit wall/join semantics become more relevant as references, while their renderer coupling, mutable model architecture, proximity repair and license restrictions remain excluded.

### H2 — complete; largely reusable

Preserve:

- deterministic snap ordering;
- screen-space acquisition;
- moving-target exclusion;
- selection/snap separation;
- transient guides;
- Plan visual grammar.

Re-map candidates and selection targets onto Junctions, Walls, Openings, Partitions and Room regions.

### H3 — next foundational evidence

Expand H3 around wall-first topology:

- robust segment intersection;
- endpoint-touch vs crossing classification;
- explicit noding;
- T/X junctions;
- wall subdivision;
- dangles and cut edges;
- oriented traversal;
- closed-face extraction;
- polygonization;
- nested-loop/hole diagnostics;
- deterministic tolerance policy;
- invalid-topology diagnostics.

Hard boundary:

> H3 may derive candidate faces. It must not allocate or reconcile persistent Museum Room identities.

### H5 — bounded identity/migration study

Add a focused study/spike for:

- deformation correspondence;
- subdivision lineage;
- Room split/merge;
- overlap tie-breaking;
- metadata conflicts;
- replay determinism;
- Scene/Camera world-transform migration;
- ambiguous legacy coincident boundaries/openings;
- compatibility with saved and published documents.

H4 curve/offset/trim research remains deferred unless required to preserve existing curved-layout fidelity.

## 15. Retained architectural constraints

The re-plan must preserve:

- `LayoutDocument` / `SceneDocument` ownership separation;
- visitor/editor isolation;
- one canonical `compileLayoutGeometry()` pipeline;
- no duplicate Plan/3D geometry interpretation;
- deterministic selection and history;
- atomic layout transactions;
- one chronological history model;
- single navigation system;
- single camera-motion system;
- Svelte 5 rune patterns;
- Threlte conventions.

## 16. Initial deferred scope

Do not expand the first wall-first P23 into full CAD/BIM.

Defer unless required by existing compatibility:

- general persistent constraint solver;
- automatic topology repair;
- aggressive proximity-based joining;
- complex curved-wall intersections/topology;
- multi-floor topology;
- BIM wall assemblies;
- structural engineering semantics;
- complex shared-room/group transforms;
- campus/building hierarchy;
- terrain or town-scale systems.

Initial topology should prefer straight Walls, explicit Junctions, valid open chains, simple enclosed faces and simple deterministic split/merge behavior. Unsupported complex topology should reject with diagnostics rather than guess.

## 17. Evidence sequence before final P23 reconciliation

1. Execute **P23-H3** against this wall-first direction.
2. Execute the bounded **H5 Room identity / migration** study.
3. Reconcile the P23 umbrella and affected child plans using H1/H2/H3/H5 evidence.
4. Finalize schema/migration sequencing and implementation order.

This document is staging architecture context, not an implementation plan and not a replacement for existing harvest artifacts.