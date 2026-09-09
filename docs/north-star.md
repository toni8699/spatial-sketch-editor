# North star — final product vision

**Read when:** choosing product direction, defining long-term scope, or reviewing pitches.  
**Current sequencing:** [`plans/README.md`](./plans/README.md).  
**Current shell / Project Hub / Preview target IA:** [`Design-specs/Design-Plan(P21+).md`](./Design-specs/Design-Plan(P21+).md).

This document states the **destination architecture and product direction**. It does not claim every capability exists today. Current component/architecture docs remain authoritative for shipped behavior until their code changes.

**Ratified 2026-08-31:** project shell = **Spatial** + future **Experience**, with project-level **Assets** and **Publish**.  
**Ratified 2026-09-09:** P23 wall-first spatial ownership amendment — first-class Junctions/Walls, persistent Rooms over derived faces, Wall-hosted Openings, document-level world-local Layout objects, and project/world-local Scene/Camera physical placement as the target. Current Room-owned/Room-local implementation remains current behavior until P23 Foundation ships.

## Product vision

Museum Editor is a web-native platform for authoring, directing, revising and publishing **interactive spatial experiences**. Creators compose the world in Spatial mode, shape visitor understanding/navigation/behavior in Experience mode, then Preview and Publish without requiring external DCC tools, game-engine scripting or deployment knowledge for normal work.

Build, Stage, Direct and Experience are complementary capabilities, not a mandatory waterfall:

```text
Compose / Build
↔ Stage
↔ Direct
↔ Shape visitor experience
→ Preview / validate
→ Publish
→ Revise
```

Representative outcomes include museums/exhibitions, architectural and historical walkthroughs, spatial portfolios, product showrooms, educational experiences, interactive stories and guided 3D-first web experiences. The Chopin museum is a proving use case, not the product category.

The product is **not** a Blender replacement, game engine, BIM system, Webflow-style site builder, CMS or Figma/Canva-style 2D design suite. Its value is the combination of:

> **semantic spatial authoring + experience direction + visitor-facing web UI + portable publishable runtime**

## AI / reuse thesis

Assume frontier AI increasingly can generate geometry, stage scenes, author lighting/cameras/interactions, write Three.js, operate DCC tools and deploy applications. Museum Editor remains useful by owning reusable, tested behavior that both humans and agents can invoke instead of rebuilding bespoke infrastructure each time.

```text
human / agent intent
→ canonical spatial project
→ reusable semantic operations
→ inspect / revise
→ validation
→ visitor-safe runtime
→ publish
→ continue editing
```

AI is a client of the same project model, not a separate opaque generation mode. External models/generators supply intent, meshes, textures/worlds and proposed arrangements; the product supplies structure, operations, validation, runtime and publishing. Provider identity may survive as provenance, never as a second project architecture.

Human direct manipulation and agent/API authoring should converge on the same semantic behavior:

```text
Human UI ───────┐
                ├→ validated semantic operation → canonical project state
Agent / API ────┘
```

The reuse/economic advantage is a hypothesis to measure, not a claimed moat.

## Project shell and modes

```text
Project Shell
├─ Spatial
├─ Experience          future
│  ├─ Navigation
│  ├─ Content
│  └─ Interactions
├─ Assets
└─ Publish
```

`Spatial` and `Experience` are the two primary creative modes. `Assets` and `Publish` are project-level supporting surfaces.

Inside Spatial, the canonical workspace axes remain:

```text
Spatial
├─ Scene
│  ├─ Plan
│  │  ├─ Layout
│  │  └─ Arrange
│  └─ 3D
└─ Camera
   ├─ Plan
   └─ 3D
```

These are views/lenses over one project, not separate apps. The product-level shell does not rename or flatten `Scene | Camera` × `Plan | 3D`.

# Build — architectural authoring

Scene Plan grows into a practical architectural authoring surface for spaces that can be experienced directly.

P23's ratified minimum is **wall-first**:

```text
LayoutDocument
├─ floors
│  ├─ Junctions
│  ├─ Walls
│  ├─ Openings → Wall
│  └─ Rooms → persistent semantic regions over derived boundary-Wall faces
└─ objects → document-level, project/world-local
```

Principles:

- Junction IDs own explicit connectivity; proximity may suggest a join but never becomes ownership by itself.
- A physical shared Wall exists once.
- Openings belong to Walls.
- `boundary` Walls split semantic Room regions; `partition` Walls are physical architecture that do not.
- Rooms remain persistent product identities/metadata, not disposable face-extractor output.
- `LayoutObject[]` remains document-level/project-world-local; floor/Room context may be used for placement or semantics without becoming mandatory transform ownership.
- Architecture edits do not implicitly move Scene/Camera content after P23's world-space migration.

Every architectural addition extends `LayoutDocument` and one canonical geometry pipeline:

```text
LayoutDocument
→ compileLayoutGeometry()
→ renderer-neutral geometry/queries
→ Plan + 3D + visitor
```

No second mesh-authoring or Plan geometry system.

P23 minimum includes the wall-first foundation/migration, bounded Room identity reconciliation, exact Wall/Junction dimensions, deterministic snapping/alignment, continuous Wall/Partition sketching, Wall-hosted openings, duplicate/repeat, small architectural presets and a drafting visual pass.

Later Layout depth — stairs, railings, richer parametrics, curve topology, profile/extrude/sweep/revolve, roofs and deeper constraints — stays evidence/demand gated and is not prerequisite for the first Experience proof.

The product remains semantic architecture authoring, not a general DCC/BIM modeler.

# Stage — Scene composition and shared assets

Scene 3D owns scene-object composition: imported models, primitives, materials, lights, placement, transforms, visibility and authored object properties. Scene Plan Arrange is the 2D counterpart for supported Scene/Layout content without merging document ownership.

## Spatial coordinate target

P23 changes **physical coordinate ownership**, not document ownership:

```text
Scene entity / cluster members → project/world-local physical placement
Camera node / target / path values → project/world-local physical placement
Room → derived or optional semantic context where useful
```

This supports courtyards, gardens, exterior exhibits, multiple buildings/campuses and other worlds where Room containment is not a universal root.

**Current behavior note:** until P23 Foundation code ships, current Scene entities/clusters/Camera nodes still use Room-local storage and Room frames. Current implementation docs remain correct for that baseline. Future P24 implementation must consume the spatial coordinate model actually shipped by P23 rather than treating Room-local storage as a permanent invariant.

Layout and Scene still remain separate authored domains.

## Assets

The finished product supports one unified asset library/registry consumed by Spatial and Experience:

```text
Project Asset Registry
        ↓
   ┌────┴─────┐
Spatial    Experience
```

Broad source classes:

```text
Built-in
Upload
Online
```

Once accepted, an asset resolves through the same Scene placement, selection, transforms, history, packaging and publish path regardless of origin.

Useful asset metadata may include dimensions, placement rules, provenance/license, thumbnails, bounds/footprints, optimization derivatives, animation clips and semantic capabilities. Heavy bytes/derivatives live in asset/storage infrastructure rather than authored project truth.

Procedural assets remain semantic where editable parameters materially matter; generated meshes/caches are derived runtime data. Layout-owned procedural architecture extends `LayoutDocument`; Scene-owned procedural assets remain Scene entities/assets. Neither creates a parallel geometry authority.

Lighting remains `SceneDocument`-owned authored staging truth, not global shell configuration.

P24 Stage depth is staged: first useful asset supply/ingest plus richer Scene arrangement/material/light/environment workflows, with deeper DCC-like staging only when evidence supports it.

# Direct — Camera / experience direction

The existing Camera graph remains the sole camera/navigation foundation.

```text
Graph    → where movement is possible
Sequence → which connected traversal is the primary guided experience
```

There remains **one camera graph, one route system and one motion evaluator**.

Long-term Camera authoring may layer semantic direction over current manual controls:

```text
View / Shot
→ Transition
→ Attention Beat
→ Cue
→ optional Branch
```

Manual position/path/target/FOV/timing/framing remain canonical. Assisted/AI direction resolves into the same inspectable state.

Spatial transitions and editorial cuts/fades may coexist; these extend the existing Camera domain rather than creating another timeline/navigation engine.

Room containment is **not** the long-term Camera coordinate root. The P23 target stores Camera physical placement in project/world space while preserving one canonical Camera topology/motion system. Room context may still be derived for labels, semantic destinations or interaction logic.

# Experience — visitor understanding/navigation/interaction

Experience is a distinct project-level authoring surface over the same Spatial project, assets and runtime. It answers:

> How does the visitor understand, navigate and interact with the authored spatial experience?

Conceptual structure:

```text
Experience
├─ Navigation
├─ Content
└─ Interactions
   └─ Event → Target → Action
```

Experience is not a general web builder. It composes visitor-facing navigation/content/behavior over existing Spatial truth.

Example:

```text
Navigation: "Piano" → canonical Camera/destination
Content: Piano Info = title + image + Learn More
Interaction: Reach Piano destination → Show Piano Info
```

Navigation defines where the visitor can go. Content defines what can be presented. Interaction defines when/why actions occur.

P25 begins after the useful P23/P24 minima, before optional depth tails:

```text
P23 useful Build
+
P24 useful Stage
↓
P25 narrow complete Experience foundation
↓
bounded agent/reuse proof
↓
evidence-led deeper capabilities
```

`ExperienceDocument` remains a future ownership hypothesis until P25 explicitly designs it. No schema is implied here.

## Same world, different authoring lens

Spatial and Experience operate on the same project/world/cameras/assets/runtime.

Experience never creates duplicate `ExperienceScene`, `ExperienceCameraGraph`, `ExperienceCameraPath`, Room geometry or equivalent truth.

```text
Experience navigation intent
→ canonical Spatial Camera/navigation system
```

Never:

```text
Experience UI
→ independent XYZ/FOV interpolation
```

Reduced-motion preferences alter transition presentation, not destination/spatial truth.

## Interaction semantics

Prefer semantic events over copied raw timing:

```text
Enter / Leave region
Reach destination / Camera
Transition Start / End
Cue Reached
Sequence Start / End
Click Object
```

Advanced relative timing may evaluate against canonical transitions, but must not copy Camera timing into a second source of truth.

Interaction authoring should autocomplete from actual project identities/capabilities and reject invalid operations semantically.

# Preview and Publish

Publishing is a first-class outcome:

```text
Build → Preview → Publish → public URL
```

Published output combines visitor-safe spatial runtime, Experience UI and project data/assets.

Visitors never receive editor session infrastructure: selection, history, gizmos, Inspector, authoring stores or asset-management UI.

The preferred architecture is one generic runtime + project data/assets, not one bespoke app deployment per project.

Potential long-term delivery modes:

- hosted public URL;
- custom domain;
- embed;
- downloadable/static build where appropriate;
- runtime SDK/headless integration later.

Published project versions are immutable historical truth. Compatibility/migration must preserve old releases without rewriting stored bytes.

# Developer / export direction

The same project should eventually support:

```text
Non-developer      → hosted Publish
Developer          → downloadable/static build
Experienced dev    → project package + runtime SDK
Advanced           → headless runtime + project data
```

A future SDK consumes the same visitor-safe runtime and canonical Camera systems. It never exports editor internals or forces developers to reimplement interpolation.

Portable project/package ownership remains important for import/export, backup, migration and local-first workflows.

# Accounts, backend and collaboration

Cloud persistence wraps canonical project truth rather than replacing it:

```text
project_versions
→ versioned ProjectDocument JSONB
```

Database/platform layers own users, projects, versions, asset metadata/references, permissions and published versions. Heavy bytes belong in object storage.

Do not normalize the editor into relational `walls`, `scene_objects`, `camera_nodes`, etc. unless a concrete later query requirement justifies it.

Identity remains external; the Museum backend owns app session/product authorization.

Collaboration may later add presence/shared editing/comments/version workflows, but must preserve deterministic project ownership and mutation/history semantics. Versioned Save is not conflict detection. No CRDT/event-sourcing assumption is made.

# AI / agent surface

Preferred loop:

```text
inspect
→ propose
→ apply semantic operations
→ preview
→ validate
→ refine
→ checkpoint/version
→ publish
```

Preferred agent surface is semantic operations, not raw JSON mutation, direct Three.js mutation, generated Svelte trees or pointer automation when a domain operation exists.

Candidate capabilities include architecture creation, asset placement, Scene transforms/lights/materials, Camera edits, Experience interactions, inspection, validation, preview, versioning and publish.

AI-generated work must remain ordinary project state: inspectable, editable, versionable, permission-aware and subject to the same architecture/runtime constraints.

After P22 + useful P23/P24 + narrow P25, run a bounded agent/reuse proof using a small set of existing semantic operations before broad platform expansion.

# Shared authoring operations

New authoring capabilities should, where practical, be expressible as deterministic domain operations independent of toolbar/button presentation:

```text
semantic intent
→ explicit inputs
→ validation/preconditions
→ deterministic candidate/mutation
→ one transaction/history result
→ canonical render/runtime
```

Illustrative operations:

```ts
createWall(...)
splitWall(...)
createOpening(...)
setLayoutObjectTransform(...)
placeAsset(...)
setSceneTransform(...)
createLight(...)
createCamera(...)
connectCameras(...)
setSequence(...)
```

No universal command bus is required. Extract only the abstraction real P23/P24/P25 code pressure justifies.

An agent must not need to mutate human selection to edit project state.

Current history has separate Layout/Scene entries; if a real future cross-domain operation needs atomicity, explicitly design one complete candidate/commit rather than pretending several commits are already one transaction.

# Project truth

```text
Project
├─ layout       ← semantic architecture / parametric spatial structure
├─ scene        ← entities, materials, lights, Camera-domain data
└─ experience   ← future ownership boundary only
```

`LayoutDocument` and `SceneDocument` remain distinct sources of truth.

### Target spatial ownership after P23

- Layout Walls/Junctions/Openings/Rooms remain Layout-owned.
- `LayoutObject[]` remains document-level/project-world-local.
- Scene entities store project/world-local physical transforms.
- Camera physical values store project/world-local coordinates.
- Room association is derived or optional semantic context where useful; it is not required transform ownership.

This target does **not** merge Layout and Scene documents.

### Current implementation compatibility

Until P23 Foundation actually ships, current Room-local Scene/Camera storage and Room-frame resolution remain current behavior. Legacy read-only Projects may continue retaining Room frames/local values and resolve them through an explicit compatibility/runtime-preparation boundary exactly once.

Generated geometry, Three objects, renderer handles, gizmo proxies, selection/hover/transient gesture state and undo history are never authored project truth.

# Sacred contracts

1. **Semantic spatial authoring, not general mesh editing.** Layout depth extends semantic architecture and one geometry pipeline.
2. **One Spatial shell.** `Scene | Camera` × `Plan | 3D`, with Scene Plan `Layout | Arrange`; no duplicate workspace-specific project truth.
3. **Separate document ownership, world-local physical placement target.** `LayoutDocument` and `SceneDocument` remain distinct. After P23, Scene/Camera physical placement is project/world-local; Room context is semantic/derived where useful. Current Room-local mechanics remain compatibility/current behavior until migrated.
4. **One geometry compiler.** Plan/3D/visitor derive authored architecture from `compileLayoutGeometry()` or its evolved canonical successor, never competing consumer reconstructions.
5. **One Camera graph/motion system.** Camera direction, AI, previews and Experience navigation/interaction intent reuse the canonical route/motion pipeline; no independent Experience interpolation.
6. **Topology and Sequence stay different.** Connections describe possible movement; Sequence describes ordered guided traversal.
7. **Deterministic selection/history.** Canonical identity across representations; one completed command/gesture → one logical transaction/history result where history applies.
8. **Portable versioned project truth.** Import/export, cloud Save, publish and AI operate on the same project model; schema compatibility is explicit.
9. **Visitor/editor isolation.** Visitor runtime consumes safe project/runtime modules only.
10. **Greenfield product lane with explicit compatibility.** New projects use the product editor's canonical formats; legacy authored data may be compatibility-read but editor session/workspace state is not migrated as product truth.
11. **Experience references Spatial.** No duplicate camera/path/Room/Scene/Layout truth.
12. **Assets belong to the project.** One shared project asset registry; no per-mode asset systems.
13. **One semantic authoring path per intent.** Human/automation/agent clients converge on the same validated project mutation semantics where practical.
14. **Connectivity is explicit.** Geometry proximity may suggest snapping but never silently becomes Wall/Junction/Room ownership.
15. **Persistent Room identity is product-owned.** Geometry may derive candidate faces; it never independently allocates/recreates semantic Rooms.

# Technology gates

- SvelteKit + Svelte 5 + TypeScript remain product/UI foundation while they fit measured requirements.
- SVG remains Plan renderer; Three/Threlte remains production 3D renderer.
- Backend/auth/storage/providers remain replaceable platform boundaries around canonical project truth.
- External asset/tool/provider schemas and temporary URLs do not become durable Scene/Project state.
- WebGPU/WGSL stays bounded until a real requirement justifies promotion.
- Rust/WASM requires an isolated CPU bottleneck and boundary-inclusive proof.
- Optimization follows measured large-scene/runtime bottlenecks; instancing/LOD/culling/streaming/cached derivatives must not change authored ownership.

# Permanent non-goals

- general-purpose DCC mesh editing/sculpting/UV/rigging/character-animation authoring;
- a second Layout geometry compiler or consumer-owned architectural truth;
- a second Camera/navigation/motion graph;
- persisting renderer/Three objects, generated geometry, gizmo/selection/session state as project truth;
- making game-engine/code scripting mandatory for ordinary spatial experiences;
- becoming a general 2D design suite, BIM system, game engine, CMS or Webflow clone;
- generic AI agent framework or proprietary general 3D/world model as the product core;
- Experience duplicating Spatial Camera/geometry/Room/Scene systems;
- separate Spatial/Experience asset stores;
- proximity-derived implicit topology/ownership;
- silently flattening incompatible legacy geometry/data during migration.

Use this test before expanding authoring depth:

> Does the capability describe, compose, direct or validate a spatial web experience at a reusable semantic level?

Walls, openings, stairs, platforms, dimensions, alignment, asset placement, lighting, Camera shots and interactions are strong candidates. Mesh topology, sculpting, UV editing, rig authoring, general character animation and arbitrary shader-node DCC work remain upstream/external-tool territory.

# Deferred scope is not a non-goal

Potential future value includes:

- multi-story architecture and larger building/district/campus workflows;
- richer parametric architecture, terrain/roads/vegetation;
- deeper curve topology/offset/trim/constraint tools;
- procedural asset libraries + cache/bake derivatives;
- richer provider search/import/provenance/credits;
- AI-assisted layouts/staging/tours/interactions/full drafts;
- multiple tours/branches/conditional/free-roam rejoin;
- typed Experience interaction/behavior authoring;
- richer visitor UI/content/navigation/localization/analytics/state;
- runtime SDK/headless integration;
- user-wide reusable assets;
- collaboration/teams/permissions/comments/version history;
- marketplace/licensing and advanced DCC round-trip;
- custom domains/embeds/downloadable web builds;
- community/gallery surfaces;
- agent/MCP/API authoring + automated preview/validation;
- reusable room/lighting/camera/interaction kits that resolve into normal project primitives/operations.

Absence from today's tracker means unscheduled, not rejected.

# Agent-readiness acceptance direction

Future acceptance principles — not claims that all pass today:

1. Human UI and equivalent headless semantic operation produce the same authored delta.
2. One completed operation produces one logical history result where history applies.
3. Layout operations mutate Layout; Scene operations mutate Scene; cross-document operations require an explicit atomic contract.
4. Plan-level transforms preserve state owned exclusively by 3D authoring.
5. Spatial ownership/topology is explicit: new Scene/Camera physical placement is project/world-local after P23, and Room/Junction relationships are never inferred merely from coordinates. Legacy Room-local data is handled only through explicit compatibility context.
6. Camera operations reuse the canonical route/motion system.
7. Generated assets enter the canonical Asset Registry/ingest path.
8. Visitor runtime consumes project truth without editor session/selection/history/gizmos.
9. Validation can run without pointer interaction.
10. Project changes remain serializable/versionable and contain no renderer objects.

# Strategic success test

Eventually compare the same capable model, brief, assets and acceptance criteria using:

```text
A. Museum Editor / canonical operations
B. strong reusable-code / Three.js starter baseline
```

Measure creation + revision time/intervention, cost/failed attempts, regression rate, cold publish success, manual editability and second-project reuse. Do not claim 2×/3×/10× wins until measured.

# Final conceptual hierarchy

```text
Public Product
├─ Landing / Learn / Community                future
└─ User Workspace
   └─ Project
      ├─ Spatial
      │  ├─ Scene
      │  │  ├─ Plan → Layout | Arrange
      │  │  └─ 3D
      │  └─ Camera
      │     └─ canonical spatial/path/timing authority
      ├─ Experience                            future
      │  ├─ Navigation
      │  ├─ Content
      │  └─ Interactions → Event → Target → Action
      ├─ Assets → shared project asset registry
      └─ Publish → visitor-safe runtime / hosted version / export later
```

**Same project, same world, same cameras, same assets, same runtime — different authoring lenses. Spatial defines spatial truth; Experience defines how the visitor navigates, understands and reacts to it. Assets and publishing belong to the project, and all surfaces operate on one portable canonical project truth.**
