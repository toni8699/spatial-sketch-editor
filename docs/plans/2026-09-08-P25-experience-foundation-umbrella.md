# P25 — Experience Foundation umbrella

**Created:** 2026-09-08 · **Status:** proposed (tracker authoritative)  
**Depends on:** accepted minimum useful P24 Stage set; P24 itself depends on the P23 minimum useful Build set.  
**Detail status:** P25 is an umbrella/research-reconciliation plan, not an implementation-ready brief. Phase 5 external capability research has been reviewed directionally and is strong enough to narrow the product thesis, but exact persistence ownership, Destination semantics, guided-occurrence semantics, Narration scope, and the minimum implementation contract remain unfrozen pending focused studies and live-code reconciliation.

## Outcome

P25 turns an authored Spatial project into a complete visitor-facing experience without turning Museum Editor into a general website builder, CMS, visual-scripting environment or game engine.

The leading product model is:

```text
Experience
├─ Navigation
│  └─ Destinations over existing Spatial / Camera meaning
├─ Content
│  └─ reusable contextual information, with Narration studied as high-value depth
└─ Interactions
   └─ bounded semantic Event → Target → Action rules
```

P25 should prove that a creator can take the useful P23/P24 environment, direct the visitor through existing Camera semantics, present contextual interpretation, bind a small set of visitor interactions, Preview the same runtime, and publish the same canonical project through P22.

The first complete proof should remain dramatically simpler than authoring equivalent behavior in Unity/Godot/custom Three.js code.

## Research basis and evidence status

Phase 5 external research was intentionally run as a capability-exploration pass rather than a Museum Editor code audit. It surveyed spatial tours, museums/exhibitions, spatial storytelling, narrative tools, web-3D systems, game-engine interaction UX, accessibility patterns and semantic interaction models.

The research source artifact used for the 2026-09-08 review is **not yet checked into `main`**. This umbrella therefore records only the reviewed directional conclusions and must not claim repository-backed provenance for exact external source citations until that artifact is added under `docs/Deep-research/`.

Broad P25 ecosystem discovery is now sufficiently mature to stop another generic “what can Experience be?” survey. Remaining work should be focused comparison, prototype evidence and Museum Editor reconciliation.

Accepted directional conclusions from Phase 5:

- **Destination + Content + bounded Interaction** is the strongest current core vocabulary hypothesis.
- Existing Camera/Direct semantics should be composed, not replaced by an Experience-owned camera graph/timeline/motion engine.
- The first guided journey should preferentially reuse the existing Camera Sequence rather than introduce a second tour-motion structure.
- `Activate` is a better semantic event candidate than pointer-specific `Click`; mouse/touch/keyboard/future gaze/controller inputs may map to one semantic activation.
- `DestinationReached` is a strong core event candidate because it composes explicit authored navigation.
- `ShowContent`, `NavigateTo` and `OpenUrl` form a plausible first action set; richer media/Scene mutation belongs behind evidence gates.
- Structured reusable Content is preferable to arbitrary HTML/page-builder state.
- A small opinionated Info presentation primitive may cover a large fraction of museum/portfolio/product/architecture use cases without becoming a generic layout system.
- Accessibility and responsive visitor behavior should be platform guarantees wherever possible rather than repeated per-project configuration.
- Inspector/rule-card/direct-selection authoring is a stronger minimum UX hypothesis than a node graph.
- Arbitrary variables, generic conditions, visual scripting, workflow graphs and general state machines are outside the P25 minimum and likely wrong-product territory.

These are **planning hypotheses**, not frozen schema/API decisions.

## Hard architecture boundaries

P25 must preserve the existing product contracts unless focused evidence proves a concrete architectural limitation.

### One navigation and camera-motion system

Experience navigation intent resolves through existing Camera/navigation meaning. Do not introduce parallel durable copies such as:

```text
ExperienceCameraGraph
TourMotionGraph
ExperienceTimeline
VisitorNavigationV2
```

A visitor-facing Destination may reference a Camera node/view or other semantic Spatial identity, but Experience does not own duplicate route/path geometry.

### Spatial ownership remains Spatial

`LayoutDocument` continues to own Layout semantics through the single `compileLayoutGeometry()` path. `SceneDocument` continues to own placed Scene/staging truth. Experience references those identities; it does not absorb them.

Room-local transforms remain authoritative. Experience must not infer durable object identity from world coordinates.

### Same project, same assets, same runtime

Experience consumes the shared project asset registry. It does not get a separate upload/media store.

Preview and Publish should use the same visitor-safe runtime semantics with editor-only debugging/presentation layered outside the visitor bundle.

### Visitor/editor isolation

Published visitors must not require editor selection, gizmos, Inspector state, authoring history, editor overlays or authoring stores.

### Deterministic authoring/history

One logical Experience edit should produce one logical authoring history result. The UI must be a client of semantic operations rather than the sole place Experience mutations exist.

Do not create a universal command framework merely for P25.

---

# Study tracks — not implementation slices

`E0`–`E6` below are research/reconciliation tracks. They must not be converted mechanically into implementation tickets.

## E0 — Current Camera / visitor capability maturity audit

Reconcile the external Experience findings against the live post-P22 repository before freezing any P25 implementation contract.

Audit end-to-end:

- canonical NavigationGraph / Camera node identity and connectivity;
- Camera Sequence representation and ordering;
- Camera route/motion evaluator;
- Camera Timeline and Camera Preview scopes;
- visitor guided/free behavior;
- visitor current/target/visited state;
- pointer/touch/keyboard navigation;
- reduced-motion behavior;
- visitor shell/chrome;
- P22 Preview/publish/cold-runtime path;
- Scene-object visitor picking/activation seams, if any;
- shared project asset/media resolution relevant to Experience;
- existing accessibility/focus/semantic-DOM behavior.

For each capability classify:

```text
KEEP AS-IS
POLISH
DEEPEN
EXPERIENCE SHOULD REFERENCE IT
FOLLOW-UP
REJECT / WRONG PRODUCT
```

“Shipped” means a canonical seam exists; it does not mean the visitor/editor Experience around that seam is product-complete.

## E1 — Experience ownership + Destination / Navigation study

Determine the smallest durable Experience-owned navigation semantics that reference existing Spatial/Camera truth without duplicating it.

### Leading hypothesis

```text
Camera node / authored view
= spatial viewpoint truth

Experience Destination
= visitor-facing semantic reference to existing spatial meaning
```

Destination may need visitor-specific fields such as label, navigation visibility/grouping and presentation metadata while movement still resolves through canonical Camera/navigation systems.

### Questions to resolve

- Is `Destination` a new Experience entity or a derived/reference view over existing identities?
- Is a Camera/view target sufficient for the P25 minimum?
- Can a Room be a Destination directly, or must it resolve through a preferred authored view?
- Can a Scene entity be a Destination, and if so how is its preferred view resolved?
- Can multiple visitor-facing labels reference one spatial target?
- How are entry/Home/Back/Next semantics represented without duplicating Camera Sequence ordering?
- What visitor navigation grouping is required in the minimum?
- Should deep-link/share identity influence the Destination model now or remain follow-up?

Do not persist arbitrary XYZ destinations merely for convenience if an authored semantic target can be referenced.

## E2 — Content + presentation + Narration study

Determine the smallest reusable Content model that works across museum exhibitions, artist portfolios, product showcases, architecture walkthroughs and educational experiences.

### Leading hypothesis

A bounded contextual information resource is preferable to arbitrary authored HTML/layout.

Conceptually:

```text
Content
├─ title
├─ body / structured description
├─ optional project-asset media
├─ credits / attribution where relevant
└─ optional link / CTA
```

Exact fields and storage are not frozen.

Study whether one canonical **Info Panel** presentation primitive, responsive across desktop/mobile, covers the first useful slice before adding arbitrary cards/modals/world-space UI.

### Narration

Narration should receive a focused study rather than being treated as generic `PlayAudio`.

Compare attaching Narration to:

```text
Content
Destination
Camera Sequence occurrence / future Tour Stop
Interaction action
```

Evaluate transcript/accessibility, user-initiation/autoplay policy, interruption/resume and navigation-away behavior.

Narration is a high-value candidate for one level beyond the minimum, but is not automatically a P25 ship gate.

## E3 — Bounded Interaction model study

Research has narrowed the strongest minimum toward a small semantic rule system rather than generic scripting.

### Leading core hypothesis

Events:

```text
Activate
DestinationReached
```

Actions:

```text
ShowContent
NavigateTo
OpenUrl
```

Potential later depth:

```text
Narrate / PlayAudio
Highlight
Show / Hide Scene entity
RoomEntered
CueReached
Once / FirstVisit
```

Reject from the minimum unless new evidence proves necessity:

```text
arbitrary variables
arbitrary expressions
generic TriggerCondition graph
ordered workflow scripting
visual node graph
custom JavaScript actions
generic state machine
physics/game-mechanic events
```

### One action vs multiple actions

Do not assume an ordered action-list engine is required.

Prefer testing whether multiple semantic rules compose adequately, for example:

```text
Activate PianoMarker → NavigateTo Piano
DestinationReached Piano → ShowContent PianoInfo
```

before introducing action ordering, waits, durations, rollback/failure chains or workflow semantics.

### Interaction target identity

Prefer stable semantic IDs such as placed Scene entity, Destination and Content identity over geometry/raycast coordinates as authored truth.

A dedicated `Hotspot` entity is not automatically required for making an existing Scene object interactive. Study a distinct semantic hotspot only for cases where no existing target identity exists or where a visitor marker itself carries useful authored meaning.

## E4 — Guided journey + visitor UX + accessibility study

### First guided journey

The leading hypothesis is:

```text
existing Camera Sequence
+ Experience Destination / Content / Interaction bindings
= first guided visitor journey
```

Do not add a second Experience timeline merely to represent the first tour.

### Critical unresolved question: Destination vs occurrence

Study repeated visits explicitly.

Example:

```text
Sequence
Intro → Piano → Paris → Piano → Exit
```

The reusable Destination `Piano` may need different contextual meaning on its first and second occurrence.

Determine whether future guided meaning needs a distinct occurrence/Stop concept without prematurely adding `Tour`, `Chapter`, `Step` or narrative-graph hierarchy.

### Visitor UX / wayfinding

Study minimum visitor chrome for:

- destination/menu navigation;
- guided/free coexistence;
- Back/Next/Home behavior;
- visited/progress feedback where useful;
- mobile/touch behavior;
- optional derived visitor map/minimap as follow-up;
- onboarding/control help.

### Accessibility contract

Separate:

```text
AUTOMATIC PLATFORM GUARANTEE
AUTHOR-REQUIRED SEMANTIC INPUT
OPTIONAL AUTHOR ENHANCEMENT
```

Strong automatic candidates include:

- keyboard-equivalent activation/navigation;
- semantic DOM representation of visitor destinations/content;
- visible focus and deterministic focus return;
- reduced-motion navigation through the same destination semantics;
- responsive visitor Content presentation;
- touch-target sizing;
- safe overlay/modal semantics.

Do not require authors to configure separate mouse/touch/keyboard behaviors for one semantic `Activate` interaction.

## E5 — Authoring UX + Preview / Publish + reference integrity study

### Authoring UX

Prioritize testing:

```text
same project / same 3D world
+
Experience semantic overlays
+
Inspector / rule cards
```

Example presentation only:

```text
Interactions

When
Visitor activates this object

Do
Show “Piano Information”
```

Study Destination/Content/Interaction trees, badges/markers, direct selection and small wizards before introducing a node graph.

Editor-only overlays may expose Destination badges, interaction markers, content bindings and invalid-reference diagnostics; they must not become visitor truth.

### Preview

Experience Preview should execute the same visitor runtime semantics as Publish, with editor-only diagnostics outside the runtime contract.

Useful editor-only simulation candidates:

- jump to Destination;
- simulate `Activate` / `DestinationReached`;
- reset visitor session;
- simulate first visit / reduced motion;
- show interaction targets;
- inspect invalid references.

### Reference integrity

Define deterministic behavior for:

- deleting a referenced Scene entity;
- replacing the asset on a referenced placed entity;
- deleting a referenced Camera node;
- removing/reordering Camera Sequence occurrences;
- deleting Content;
- renaming/re-grouping a Destination.

Prefer explicit warning/rejection/repair over silent semantic retargeting or cascade destruction.

## E6 — Persistence / operations / implementation-brief gate

Only after E0–E5 should P25 freeze an implementation-ready contract.

### Persistence ownership

A separate Experience-owned document is now a **credible architecture hypothesis**, because Navigation/Content/Interaction state crosses references into Camera, Scene and project Assets.

It is not yet ratified.

Compare at least:

```text
A. separate ExperienceDocument
B. bounded Experience section in the canonical project envelope
C. smaller resources owned by existing project-level persistence boundaries
```

Reject putting Experience truth into GLB/glTF `extras` merely because assets use glTF. Asset format is not the canonical cross-domain project model.

### Operation model

The eventual authoring surface should support semantic operations usable by UI/tests/future agents, conceptually such as:

```text
createDestination
updateDestination
createContent
updateContent
bindInteraction
removeInteraction
setExperienceEntry
validateExperience
```

Names are illustrative only. Exact APIs wait for live-code reconciliation.

For every proposed operation require:

```text
owner
stable semantic inputs
preconditions / reference validation
deterministic mutation scope
one logical history result
actionable errors
visitor-runtime consumption
```

### Implementation-ready gate

Before implementation tickets exist, P25 must have resolved or explicitly deferred:

1. persistence/document ownership;
2. minimum Destination target model;
3. first guided-journey relationship to Camera Sequence;
4. repeated-Destination / occurrence semantics;
5. minimum Content resource and presentation primitive;
6. minimum Event/Action vocabulary;
7. Narration minimum-vs-follow-up decision;
8. reference integrity for Scene/Camera/Content deletion/replacement;
9. automatic visitor accessibility/reduced-motion guarantees;
10. authoring UX entry points and same-runtime Preview contract;
11. P22 cold visitor resource/publish compatibility;
12. one complete acceptance fixture.

---

# Leading minimum hypothesis — not frozen implementation scope

Use this as the primary thing to challenge through E0–E6:

```text
P25 Foundation candidate

Navigation
- Destination references over existing Spatial / Camera meaning
- visitor label / grouping / entry
- first guided flow composed from existing Camera Sequence

Content
- reusable contextual information
- one opinionated accessible visitor presentation primitive

Interaction
- Activate
- DestinationReached
- ShowContent
- NavigateTo
- OpenUrl

Visitor / runtime
- keyboard + touch + reduced-motion semantics
- accessible DOM companion navigation/content
- same visitor runtime for Preview and Publish
- actionable reference validation

Authoring
- semantic operations + one history result per logical edit
- direct selection / semantic overlays / Inspector-rule-card UX
```

The minimum must prove a **complete visitor journey**, not merely an interaction demo.

Example acceptance narrative:

```text
visitor opens cold published project
→ sees an understandable visitor navigation surface
→ navigates to an authored Destination through the canonical Camera system
→ receives contextual Content on arrival
→ activates a Scene target to reveal related Content or navigate elsewhere
→ can use equivalent keyboard/touch behavior
→ reduced-motion preference reaches the same semantic destination safely
→ no editor-only systems are required
```

# One level deeper — evidence-gated candidates

After the minimum, the highest-leverage depth candidates currently appear to be:

1. Narration + transcript semantics;
2. bounded `Once` / `FirstVisit` visitor-state conditions;
3. richer visitor navigation grouping / wayfinding;
4. semantic hotspots where no existing Scene identity exists;
5. lightweight attention actions such as Highlight/Reveal;
6. deep-linked/shareable Destinations;
7. multiple tours or explicit occurrence/Stop semantics if real projects require them;
8. a visitor map/minimap derived from Spatial truth.

These are not hidden P25 minimum gates.

# Product boundary

## Core reusable Experience primitives

- Destination/navigation semantics;
- contextual Content;
- bounded semantic interaction;
- visitor-safe presentation/accessibility;
- same-runtime Preview/Publish.

## High-value spatial Experience depth

- Narration;
- richer wayfinding;
- bounded first-visit state;
- attention/reveal behaviors;
- semantic hotspots;
- deep links;
- multiple tours/occurrence semantics when proven.

## Later platform / specialist capabilities

- richer media orchestration;
- localization workflow;
- analytics;
- more advanced visitor-state persistence;
- XR-specific presentation/input;
- reusable Experience templates/presets;
- richer multi-tour/story structures.

## Wrong-product territory for P25

- generic visual scripting;
- arbitrary JavaScript actions;
- arbitrary variables/expression language;
- general state machines/workflow automation;
- physics/gameplay systems;
- inventory/scoring;
- arbitrary HTML/CSS page builder;
- general CMS;
- a second Camera/navigation/timeline system.

# Minimum gate from P23/P24

P25 waits for the **accepted useful minima**, not optional depth tails.

P23 must provide enough Build capability that the acceptance fixture is a credible authored environment. P24 must provide enough Stage capability that representative Scene content can be placed/revised/styled and delivered through P22. P25 does not wait for broad CAD depth, giant asset catalogues, DCC features, marketplace work or advanced lighting/material tails.

The exact P23/P24→P25 acceptance gate remains owned by those plans until their minima freeze.

# Closeout rule

P25 does not become implementation-ready because the external research identified attractive capabilities.

The sequence is:

```text
external capability research
        ↓
E0 live capability audit
        ↓
E1–E5 focused semantic/UX/runtime studies
        ↓
owner decisions + bounded prototypes where needed
        ↓
E6 persistence/operation reconciliation
        ↓
implementation-ready P25 brief / annex
```

At closeout, broad Experience ecosystem discovery should remain closed. Later research should be targeted only at unresolved semantics, UX, performance/accessibility evidence or implementation-specific seams.