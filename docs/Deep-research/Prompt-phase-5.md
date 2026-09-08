# Deep Research Phase 5 — Experience Authoring Capability Harvest for P25

Conduct deep technical/product research into **interactive spatial-experience authoring systems, virtual-tour platforms, 3D storytelling tools, museum/exhibition viewers, game-engine interaction models, web-based spatial navigation systems, contextual-content systems, accessibility patterns, semantic trigger/action architectures, and agent-addressable experience models** that can inform Museum Editor's future:

# P25 — Experience Foundation

This is **Phase 5** of the Museum Editor research program.

Previous phases:

```text
Phase 1 — reusable spatial ecosystem / strategic platform direction
Phase 2 — exact 3D asset/material/HDRI acquisition + ingest research
Phase 3 — Layout / architectural Plan capability harvest → P23
Phase 4 — Scene / rich 3D staging capability harvest → P24B
Phase 5 — Experience authoring capability harvest → P25
```

The central question is:

> **What is the smallest reusable Experience authoring vocabulary that turns Museum Editor's built spatial project into a compelling, navigable, contextual and interactive visitor experience, without turning Museum Editor into a generic website builder, visual scripting environment, game engine or no-code app platform?**

The result should be detailed enough to guide a later P25 implementation brief, but **must not assume that the research itself makes P25 implementation-ready**.

Research first.

Then reconcile findings against Museum Editor's live implementation.

Then identify remaining capability-maturity studies.

Only after that should an implementation-ready P25 brief be frozen.

---

# 1. Product context

Museum Editor is a web-native spatial authoring environment built with:

```text
SvelteKit
Svelte 5
TypeScript
Threlte
Three.js
```

Its long-term authoring flow is:

```text
Build
→ Stage
→ Direct
→ Interact
→ Preview
→ Publish
```

Current roadmap framing:

```text
Spatial
├─ Scene
│  ├─ Plan
│  └─ 3D
└─ Camera
   ├─ Plan
   └─ 3D

Future:
Experience
├─ Navigation
├─ Content
└─ Interactions
```

Project-level future hierarchy is directionally:

```text
Project
├─ Spatial
├─ Experience
│  ├─ Navigation
│  ├─ Content
│  └─ Interactions
├─ Assets
└─ Publish
```

P25 is the first deliberate **Experience** slice.

It should compose the Spatial system rather than replacing it.

---

# 2. Current roadmap intent for P25

P25 should begin after the **minimum useful P23/P24 capabilities**, before their optional depth tails.

Its first goal is a narrow but complete visitor-authoring slice.

Directionally:

```text
destination
+
visitor navigation
+
contextual content
+
small semantic trigger/action set
+
visitor-safe motion/accessibility behavior
```

This is intentionally **not**:

```text
general app builder
general visual scripting system
game engine
website builder
node graph
workflow automation product
```

Research should challenge and refine the exact minimum.

---

# 3. Existing systems must be inspected before recommending replacements

Museum Editor already contains substantial behavior in areas relevant to Experience, including:

* authored camera nodes
* camera connections
* curved camera paths
* Camera Plan
* Camera 3D
* ordered Camera Sequence
* Preview Camera
* Preview Edge
* Preview Sequence
* free/guided navigation concepts
* one canonical navigation system
* one canonical camera-motion system
* project Preview
* visitor runtime
* Publish boundary
* Scene objects
* project assets
* existing selection/history/editor architecture

Do **not** assume:

> “Experience research mentions navigation, therefore Museum Editor needs a new navigation system.”

Likewise do not assume:

> “A camera/navigation capability already exists, therefore its visitor UX is already mature enough for P25.”

Use the maturity principle:

> **“Shipped” answers whether Museum Editor already has a canonical implementation. It does not answer whether the capability is sufficiently usable, expressive, accessible, discoverable or reusable for the Experience goal.**

Every recommendation should distinguish:

```text
PRESERVE CURRENT AUTHORITY
POLISH
DEEPEN
ADD NEW EXPERIENCE SEMANTIC
FOLLOW-UP
REJECT / WRONG PRODUCT
```

---

# 4. Hard architecture invariants

Every recommendation must preserve these unless a concrete architecture problem is demonstrated and explicitly called out for owner review.

## One navigation system

Do not create:

```text
ExperienceNavigation
VisitorNavigationV2
TourNavigation
StoryNavigation
```

as parallel authorities.

Experience navigation must compose the existing navigation/camera system.

---

## One camera-motion system

Existing authored camera nodes, connections, paths and preview/playback remain the canonical spatial-motion system.

Experience may **reference or trigger** camera destinations/motion.

It must not invent another animation/motion graph.

---

## Separate LayoutDocument and SceneDocument ownership

Do not move architecture into Scene or Experience.

Do not put Experience semantics into Layout merely because an interaction references a room or wall.

---

## Experience should reference Spatial identity

Prefer semantic references:

```text
roomId
sceneEntityId
cameraNodeId
cameraEdgeId
sequenceId
assetId
future contentId
```

over duplicated coordinates.

Do not serialize a second copy of spatial truth into Experience.

---

## Room-local transforms remain authoritative

Experience references Scene objects by stable semantic identity.

Do not infer identity from world coordinates.

---

## One chronological authoring history

One logical Experience edit should result in one logical history entry.

Examples:

```text
bind click → show panel
→ one history result

change destination
→ one history result

create contextual info entry
→ one history result
```

No parallel Experience undo stack.

---

## Visitor/editor isolation

Visitor runtime must not require:

```text
EditorApp
selection stores
gizmos
Inspector
authoring history
editor drag/drop
Experience editor panels
debug trigger overlays
```

unless explicitly required for runtime interaction.

---

## Semantic authored truth

Persist domain data.

Do not persist:

```text
DOM elements
Svelte component references
Three Object3D handles
event listeners
raycasters
animation controllers
UI state
```

as Experience truth.

---

## Svelte 5 / Threlte

Recommendations should fit current architecture rather than importing React-centric editor frameworks wholesale.

---

# 5. Primary product question

Research should determine the correct minimum Experience vocabulary.

A candidate conceptual model is:

```text
Trigger
→ Target
→ Action
```

Examples:

```text
click painting
→ info card
→ show

reach camera node
→ narration
→ play

click door marker
→ camera destination
→ navigate

enter room
→ ambient content
→ reveal

click CTA
→ external URL
→ open
```

But do **not** assume this model is correct.

Compare alternatives such as:

```text
Event → Condition → Action

Trigger → Action

Interaction → Effect

State machine

Story step

Destination + presentation

Component + behavior
```

Determine what gives enough expressive power without becoming visual-programming infrastructure.

---

# 6. Research target classes

Deeply inspect strong systems from multiple categories.

## Virtual tours / spatial storytelling

Study where accessible/inspectable:

* Matterport
* Kuula
* 3DVista
* Pano2VR
* Artsteps
* Kunstmatrix
* Spatial
* Mozilla Hubs lineage
* open museum/exhibition viewers
* open virtual-tour frameworks
* architectural walkthrough systems

Focus on:

```text
destinations
navigation
hotspots
labels
content panels
media
guided tours
wayfinding
visitor controls
```

---

## Web 3D authoring

Study:

* Spline
* A-Frame Inspector / ecosystem
* Three.js experience projects
* React Three Fiber authoring projects
* Threlte projects
* Babylon.js
* PlayCanvas
* web-based scene/story editors

Focus on:

```text
events
object interactions
camera transitions
content overlays
interaction bindings
runtime representation
```

---

## Game engines

Study the useful concepts from:

* Godot
* Unity
* Unreal
* Bevy tooling where relevant

Do **not** assume their complexity belongs in Museum Editor.

Focus narrowly on:

```text
signals/events
trigger areas
target references
interactions
navigation destinations
UI overlays
state
editor visualization
```

---

## Narrative systems

Study lightweight narrative/state concepts from:

* Twine
* Ink
* Yarn Spinner
* Ren'Py concepts where useful
* interactive-document/story frameworks

Question:

> Can any of their simple state/story representations improve guided spatial experiences without importing branching-game complexity?

---

## Interactive museum/exhibition systems

Search aggressively for:

* open-source digital museum platforms
* exhibition builders
* cultural heritage viewers
* museum kiosk software
* gallery virtual tours
* educational spatial storytelling tools
* annotation systems for 3D cultural objects
* IIIF + 3D integration experiments

Prioritize systems that deal with:

```text
objects + interpretation
spatial context + information
guided visitor paths
accessibility
multimedia
```

---

# 7. Exact source inspection requirement

For serious open-source references, inspect actual repositories.

Record:

```text
Repository:
URL:
Commit/release inspected:
License:
Language/framework:

Exact relevant files/modules:
- ...

Architecture:
- ...

Useful capability:
- ...

Reuse mode:
REUSE
ADAPT
PORT CONCEPT
STUDY UX
REFERENCE ONLY
AVOID
```

Do not invent paths.

Do not rely solely on marketing/product screenshots.

---

# 8. Destination model

Research what a **destination** should mean.

Potential destination kinds:

```text
camera node
room
Scene entity
named spatial point
camera sequence stop
future custom destination
```

Questions:

* Should every navigable destination resolve to a camera node?
* Can rooms be destinations without a dedicated camera?
* Should Scene objects be navigable directly?
* Should a destination own a preferred camera/view?
* Is destination a new Experience entity or a derived reference?
* How does destination naming work?
* How does visitor navigation discover destinations?
* How do agents refer to destinations?
* Can multiple destination labels reference the same camera node?
* Should destination ordering be independent of Camera Sequence?

This is one of the most important P25 architecture decisions.

---

# 9. Existing Camera Sequence vs Experience navigation

Museum Editor already has Camera Sequence.

Research must establish the distinction between:

```text
Camera graph
Camera Sequence
Experience navigation
guided visitor journey
```

Possible interpretation:

```text
Camera graph
= possible spatial motion topology

Camera Sequence
= authored ordered camera playback

Experience navigation
= visitor-facing choices/destinations referencing camera semantics

Guided journey
= Experience-level use of Camera Sequence + content/interaction
```

Prove or improve this model.

Do not duplicate sequence ordering unnecessarily.

---

# 10. Free navigation vs guided navigation

Research visitor UX for:

```text
free exploration
guided journey
hybrid
```

Questions:

* Should a creator choose a global mode?
* Can the visitor switch modes?
* Can a project begin guided then allow free exploration?
* Does guided navigation use Camera Sequence directly?
* How are unsequenced branches exposed?
* What happens when visitors deviate?
* How does “Next” know where to go?
* Is Back history-based or sequence-based?
* How does mobile differ?

Recommend a bounded model.

---

# 11. Wayfinding

Study:

* destination lists
* minimaps
* breadcrumbs
* room names
* progress indicators
* next/previous
* overview maps
* spatial markers
* directional cues

Do not automatically add all of them.

Determine the smallest visitor wayfinding surface required to avoid disorientation.

Museum Editor already has Plan internally.

Research whether visitor Plan/minimap belongs:

```text
P25 MINIMUM
FOLLOW-UP
LONG-TERM
REJECT
```

---

# 12. Hotspots

Research hotspot systems.

Potential:

```text
object hotspot
world-space hotspot
screen-space annotation
camera-attached hotspot
room hotspot
```

Questions:

* Should a hotspot be a durable entity?
* Can a Scene object itself be interactive without a hotspot entity?
* Are hotspots content, interaction bindings, or presentation?
* What happens when the referenced object moves?
* How are hotspot visibility and occlusion handled?
* Mobile hit target?
* keyboard accessibility?
* visitor focus?
* Plan representation?

Avoid duplicated geometry.

---

# 13. Scene-object interaction

Research direct semantic interaction with Scene objects.

Examples:

```text
click painting
click sculpture
click display case
click screen
```

Potential actions:

```text
show content
navigate
open URL
show/hide another object
play media
```

Questions:

* Does interaction bind directly to `sceneEntityId`?
* How is object hit authority derived?
* What about decorative objects?
* How does creator mark interactive eligibility?
* How is keyboard equivalent created?
* What if the object is replaced in P24B?
* Does replacement preserve Experience bindings?

This must reconcile with P24B asset-replacement semantics.

---

# 14. Contextual content

This is likely central to P25.

Research content types:

```text
title
short description
rich text
image
gallery
audio
video
external link
CTA
credits
metadata
```

But keep minimum bounded.

Questions:

* Is content a project-level resource?
* Can one content item be reused?
* Is content attached directly to Scene object/destination?
* Does content own presentation mode?
* Does the interaction reference content by stable ID?
* How does localization fit later?
* How does visitor accessibility consume the same content?

Determine minimum Content model.

---

# 15. Content presentation

Research patterns:

```text
side panel
bottom sheet
modal
floating card
world-space label
overlay caption
persistent HUD
```

Museum Editor should not become an arbitrary layout builder.

Determine whether P25 should provide **a small fixed presentation vocabulary** instead.

Potential:

```text
Info Panel
Compact Card
Caption
Media Overlay
```

or even smaller.

Research which forms work well on desktop + mobile.

---

# 16. World-space text

Research carefully.

Potential use:

* room labels
* artwork labels
* signage
* captions

Problems:

* readability
* occlusion
* scaling
* mobile
* accessibility
* performance
* orientation

Determine whether P25 minimum needs authored world-space labels at all.

Maybe:

```text
world marker
→ accessible screen-space content
```

is better.

---

# 17. Trigger vocabulary

Research useful triggers.

Candidate minimum:

```text
click
reach destination
enter room/area
sequence step reached
```

Potential follow-up:

```text
hover
leave area
timer
media ended
object state changed
```

Strongly classify.

Avoid adding triggers because game engines have them.

---

# 18. Click trigger semantics

Research:

```text
click Scene entity
click hotspot
click navigation item
click content action
```

Questions:

* pointer vs keyboard activation
* touch
* double click?
* overlap priority
* object selection vs visitor interaction
* mobile tap conflicts with navigation
* visible affordance
* cursor state
* event propagation

Visitor interaction must never reuse editor selection semantics.

---

# 19. Spatial reach / destination trigger

Potential:

```text
visitor arrives at CameraNode A
→ show content
```

This is probably high leverage because Camera already owns meaningful spatial destinations.

Research:

* exact arrival event
* motion completion
* tolerance
* cancelled navigation
* repeated visits
* once-only behavior
* forward/back traversal
* sequence playback

Keep trigger semantic rather than coupling it to animation-frame callbacks.

---

# 20. Room entry trigger

Research whether:

```text
enter Room A
```

is reliable/useful.

Questions:

* derive from camera position vs room geometry?
* boundary ambiguity
* multi-floor future
* room-local ownership
* transient crossing
* current navigation paths
* accessibility

Determine whether this is minimum or follow-up.

---

# 21. Trigger areas / volumes

Research generic trigger volumes but classify aggressively.

Could be useful:

```text
enter invisible region
```

but risks game-engine creep.

If considered, compare:

```text
room
camera destination
explicit box region
```

Likely defer custom volumes unless a compelling Experience use case exists.

---

# 22. Action vocabulary

Research candidate minimum actions.

Potential:

```text
Navigate to destination
Show content
Hide content
Show Scene object
Hide Scene object
Open URL
Play audio
Pause audio
```

Possibly:

```text
Play camera sequence
```

Questions:

* Which belong P25 minimum?
* Which introduce state complexity?
* Which require content/media infrastructure?
* Which can be composed safely?
* Should one trigger allow multiple ordered actions?
* Is action ordering necessary?
* What if one action fails?

Recommend bounded semantics.

---

# 23. Show / hide Scene objects

This sounds simple but creates authored state.

Research:

```text
initial visibility
runtime visibility
editor visibility
visitor-triggered visibility
```

These must remain distinct.

Do not conflate editor Hide with Experience runtime show/hide.

Questions:

* Does `SceneDocument` own initial authored visibility?
* Does Experience own runtime visibility transitions?
* Can a hidden object still be interactive?
* How does restart/reset work?
* Publish serialization?
* agent semantics?

This may pressure P24B visibility design.

Call that dependency out explicitly.

---

# 24. External links

Research visitor-safe link behavior:

```text
same tab
new tab
external warning
```

Accessibility/security:

* `noopener`
* keyboard
* visible URL/domain?
* author validation
* broken URL handling

Likely useful minimum action.

---

# 25. Audio

Audio is highly relevant to museums/exhibitions.

Research:

* narration
* ambient audio
* object-specific audio
* music
* autoplay restrictions
* mobile Safari/browser policy
* pause/resume
* volume
* mute
* accessibility transcript
* spatial vs non-spatial audio

Determine if P25 minimum should include:

```text
explicit user-initiated audio playback
```

while leaving spatial audio advanced.

Do not rely on autoplay.

---

# 26. Video

Research whether video is P25 minimum or follow-up.

Potential:

```text
show video in overlay
embedded screen in Scene
```

These are very different architectures.

Maybe overlay video is Content.

In-world screen is Scene/media-material complexity.

Classify separately.

---

# 27. Visitor state

Research whether P25 requires runtime state.

Examples:

```text
current destination
visited destinations
open content
visibility toggles
audio state
guided progress
```

Differentiate:

### Ephemeral runtime state

resets on reload.

### Persisted visitor state

cookies/local storage/account.

P25 likely needs only ephemeral runtime state.

Confirm.

---

# 28. Conditions

Research whether first Experience model needs conditions:

```text
if visited A
if object visible
if variable == ...
```

Strongly challenge.

Conditions push quickly toward programming/state-machine territory.

Likely:

```text
P25 MINIMUM: no general conditions
```

unless evidence shows an essential use case.

---

# 29. Variables

Likewise research enough to draw boundary.

Do not add arbitrary:

```text
score
boolean variables
counters
inventory
```

unless strong spatial-experience demand exists.

Likely wrong product for P25.

---

# 30. Multiple actions

Potential useful model:

```text
click object
→ navigate
→ show content
```

Research whether a trigger should support:

```text
one action
```

or:

```text
ordered action list
```

An ordered list is more expressive but adds failure/order semantics.

Determine minimum.

---

# 31. Action atomicity

If multiple actions exist:

```text
navigate
show panel
play audio
```

must they be transactional?

Probably not in the same sense as document mutations because visitor runtime behavior is ephemeral.

But authoring the binding must remain deterministic.

Research runtime failure semantics.

---

# 32. Interaction authoring UI

Research UX for binding interactions.

Potential Inspector:

```text
Interactions
+ Add Interaction

Trigger
Click

Target
This object

Action
Show content

Content
Chopin Piano
```

Alternative:

```text
Interactions workspace
```

or:

```text
graph
```

Strongly assess whether P25 needs a separate Experience workspace.

Current north star proposes Experience as a project-level creative mode.

Research:

* Inspector-first authoring
* dedicated Experience surface
* sidebar list
* trigger/action table
* node graph

Likely reject node graph for minimum.

---

# 33. Experience information architecture

Determine how P25 should appear in the shell.

Possible:

```text
Spatial
Experience
Assets
Publish
```

Inside Experience:

```text
Navigation
Content
Interactions
```

But research whether all three need visible top-level tabs.

Maybe:

```text
Experience
├─ Journey
├─ Content
└─ Interactions
```

or something simpler.

Do not blindly accept current conceptual labels.

Evaluate creator mental models.

---

# 34. Content management UX

Research how creators:

* create content
* reuse content
* bind content
* find content
* preview content
* delete content safely
* see usage references

Avoid building CMS complexity.

Determine minimum project-level content registry.

---

# 35. Navigation authoring UX

Research:

```text
destination list
navigation label
ordering
visibility
grouping by room
guided sequence
free nav
```

Question:

Should navigation hierarchy be:

```text
Experience-defined
```

or derived from:

```text
Camera nodes / rooms / sequence
```

Likely hybrid.

Avoid duplicate ordering systems where possible.

---

# 36. Visitor navigation UI

Research patterns for:

```text
menu
next/back
destination drawer
room list
breadcrumb
mini map
hotspot navigation
```

Determine minimum visitor chrome.

The runtime should not feel like an editor.

---

# 37. Mobile/touch

This must be first-class.

Research:

* touch orbit/free navigation
* tap object interaction
* bottom sheets
* menu
* fullscreen
* safe areas
* orientation
* gesture conflicts
* browser chrome
* performance

P25 acceptance should include mobile.

---

# 38. Keyboard

Research visitor keyboard behavior:

* Tab
* Enter/Space
* Escape
* arrow keys
* WASD?
* destination navigation
* content focus
* modal behavior

Do not require free-camera keyboard navigation if destination navigation provides a better accessible equivalent.

---

# 39. Screen readers

Research realistic accessibility model for WebGL experiences.

Questions:

* accessible DOM representation of destinations?
* object descriptions?
* alternative navigation list?
* content hierarchy?
* current destination announcement?
* motion state?
* media transcripts?

The goal is not “make canvas magically screen-reader accessible.”

The goal is:

> expose equivalent semantic visitor experience through accessible DOM.

Research best practices and current standards.

---

# 40. Reduced motion

Existing camera transitions make this critical.

Research:

```text
prefers-reduced-motion
```

and suitable behavior.

Potential:

```text
normal:
animated camera path

reduced motion:
instant destination jump / short fade
```

Must use same destination semantics.

Do not create separate navigation graph.

---

# 41. Motion sickness / comfort

Research:

* camera acceleration
* rotation
* FOV
* transition duration
* sudden vertical movement
* forced autoplay
* free-look
* field-of-view changes

Recommend runtime safety defaults.

Distinguish author freedom from visitor-safe guardrails.

---

# 42. Focus management

When:

```text
click object
→ content panel opens
```

what gets focus?

When:

```text
close panel
```

where does focus return?

When camera navigation finishes, should focus change?

Research accessible patterns for 3D + DOM hybrid experiences.

---

# 43. Visitor reset / restart

Research whether visitor runtime needs:

```text
Restart experience
Return to beginning
Reset
```

This interacts with:

* visibility
* audio
* content
* visited state
* guided progress

Likely useful.

---

# 44. Preview

Museum Editor already has Preview.

Research how Experience authoring should use it.

Potential:

```text
Preview Experience
```

but avoid creating another runtime.

Preferred architecture:

```text
same visitor runtime
+
editor-controlled preview entry point
```

Research how to inspect/preview triggers without leaking editor logic into visitor runtime.

---

# 45. Experience debug tools

Research bounded editor-only tools:

```text
show interactive targets
show trigger badges
show destination IDs
simulate event
inspect current Experience state
```

Could dramatically improve authoring.

But all must stay editor-only.

Determine minimum debugging affordances.

---

# 46. Publish semantics

P22 establishes publication.

P25 must use the same versioned project release.

Research:

* experience resources
* content media
* external links
* interaction validation
* missing target references
* visitor cold boot

Experience should not introduce a second publish mechanism.

---

# 47. Reference integrity

Experience bindings may reference:

```text
Scene entity
Camera node
Room
Content
Asset
```

Research delete/replace behavior.

Examples:

```text
delete referenced object
→ block deletion?
→ warn?
→ remove binding?
→ leave invalid diagnostic?
```

Strong preference:

> do not silently cascade-delete Experience meaning.

Recommend deterministic reference integrity.

---

# 48. Asset replacement interaction

P24B may support asset replacement.

Research whether:

```text
replace chair model
```

should preserve:

```text
Experience interaction attached to the placed Scene entity
```

Likely yes if the Scene entity identity survives.

This is an important reason for interactions to target placed entity ID, not asset ID.

Call out dependencies.

---

# 49. Camera changes and Experience references

Likewise:

```text
delete camera node referenced by destination
```

requires predictable handling.

Determine whether destructive edits should:

```text
reject
warn + explicit repair
```

rather than silently rebind.

---

# 50. Validation

Research useful Experience diagnostics.

Examples:

```text
interaction references missing target
content references missing asset
destination has no reachable camera route
external URL invalid
audio missing transcript warning
hidden object used as interaction target
guided sequence empty
navigation destination has no label
```

Keep validation actionable.

Do not build one giant abstract validator.

---

# 51. Empty and fallback states

Research runtime behavior when:

* content fails
* image missing
* audio unavailable
* WebGL unavailable
* destination route invalid
* interaction target missing

Visitor runtime should fail gracefully.

---

# 52. Offline / slow connection behavior

Research practical asset/content loading:

* progressive loading
* content before 3D?
* destination loading
* image/audio lazy loading
* preload next guided stop
* fallback UI

Do not turn P25 into offline-first platform work.

---

# 53. Navigation performance

Research implications of:

* long camera paths
* repeated transitions
* destination count
* helper geometry
* mobile

P25 should reuse the existing camera-motion system.

Performance recommendations should improve that system rather than create another.

---

# 54. Experience semantic operations

Research a human/agent-shared operation vocabulary.

Potential conceptual operations:

```ts
createDestination(...)
updateDestination(...)
deleteDestination(...)

createContent(...)
updateContent(...)
deleteContent(...)

bindInteraction(...)
updateInteraction(...)
deleteInteraction(...)

setNavigationLabel(...)
setGuidedEntry(...)

validateExperience(...)
```

If actions are first-class:

```ts
bindClickToShowContent(...)
bindDestinationArrival(...)
```

may be too specialized.

Research appropriate abstraction level.

Do not invent exact current APIs.

---

# 55. Headless operation requirement

Experience authoring should not live only in Svelte components.

Conceptually:

```text
intent
→ resolve IDs
→ validate
→ candidate
→ atomic project/document commit
→ history
```

The same semantic behavior should be available to:

```text
UI
tests
future agent
migration
```

Do not create a universal project command framework merely for P25.

---

# 56. Experience ownership model

One of the key outputs must propose where durable Experience data lives.

Potential:

```text
ExperienceDocument
```

may eventually be justified.

But do not assume.

Compare:

### New ExperienceDocument

Pros:

* clean domain ownership
* portable
* references Spatial identity
* independent validation/versioning

Cons:

* cross-document references
* transaction semantics
* more project envelope complexity

### Fields inside existing project metadata

Possibly too weak.

### Fields inside SceneDocument

Likely wrong because interactions/content/navigation cross Scene/Camera.

Research and recommend.

This is one of the most important Phase 5 architecture questions.

---

# 57. Cross-document transactions

If Experience references Camera/Scene but does not normally mutate them, authoring can remain Experience-owned.

Research cases that could require cross-document mutation.

Prefer:

```text
Experience binding references existing IDs
```

rather than:

```text
creating Experience interaction secretly mutates Camera/Scene
```

If a future operation creates multiple domain records, transaction semantics must be explicit.

---

# 58. Experience deletion semantics

Research:

```text
delete content
delete destination
delete interaction
```

References should behave predictably.

Recommend:

* precondition validation
* usage inspection
* explicit repair
* one history result

No silent dangling refs.

---

# 59. Guided journey model

Research whether guided experience should reference:

```text
Camera Sequence
```

directly.

Possible:

```text
ExperienceJourney {
  cameraSequenceId
  contentBindings
}
```

But do not freeze.

Questions:

* Can there be multiple journeys?
* Does P25 minimum need one?
* Is “guided mode” just visitor playback of existing Sequence plus Experience bindings?
* Do we need an Experience-level step object?
* Can content attach to Camera Sequence occurrences without duplicating spatial nodes?

Important because Camera Sequence can revisit/reorder topology.

---

# 60. Sequence occurrence semantics

If Camera Sequence is ordered subset / occurrences, content may attach to:

```text
camera node
```

or:

```text
specific sequence occurrence
```

These are different.

Example:

same room visited twice:

```text
first visit
→ historical introduction

second visit
→ summary
```

Research whether P25 minimum needs occurrence-level binding.

This could be high leverage for storytelling.

---

# 61. Story steps

Research whether an explicit:

```text
ExperienceStep
```

is useful.

Potential:

```text
destination
content
allowed actions
next
```

But this may duplicate Camera Sequence.

Compare carefully.

Do not introduce ExperienceStep unless it provides clear semantics not already represented by Sequence + bindings.

---

# 62. Branching

Research visitor branching:

```text
choose A or B
```

Potentially powerful.

But likely follow-up.

Determine whether free navigation already provides enough branching without authored story branches.

---

# 63. Multiple experiences per project

Research but likely defer.

Could one project host:

```text
General Tour
Kids Tour
Architecture Tour
```

This pressures reusable Experience definitions.

Do not include in P25 minimum without strong evidence.

---

# 64. Personalization

Research enough to reject/defer:

* user profile
* remembered progress
* adaptive content
* language
* accessibility preferences

Runtime preferences may be valuable.

Personalized narrative logic likely later.

---

# 65. Localization

Research structural implications only.

Content IDs should allow future localization without requiring schema rewrite.

But P25 minimum may remain one language.

Do not build translation workflow yet.

---

# 66. Analytics

Research whether Experience should emit semantic events:

```text
destination visited
content opened
interaction activated
journey completed
```

Could be useful later.

But analytics backend should likely not be P25 minimum.

Ensure event semantics do not make analytics part of authored truth.

---

# 67. Accessibility metadata

Research whether content/destinations need:

```text
label
description
alt text
transcript
```

and which can be required/derived.

Strongly prefer accessible semantic fields over custom HTML.

---

# 68. Content sanitization

If rich text exists:

* XSS
* HTML
* Markdown
* links
* embeds

Research safe representation.

Potential:

```text
structured limited rich text
```

or sanitized Markdown.

Do not allow arbitrary user HTML as the easiest path.

---

# 69. External embeds

YouTube, Vimeo, iframe, etc.

Research but likely defer.

Security/CSP/privacy complexity is significant.

---

# 70. Media asset integration

P20/P24A establish project asset registry.

Experience media should use that same project asset identity.

Do not create a separate “Experience uploads” storage system.

Research required MIME/resource expansion if needed.

---

# 71. Authoring preview fidelity

Research must insist:

```text
Editor Experience Preview
≈ published visitor
```

not separate logic.

Same:

* destination resolution
* interactions
* content
* reduced motion
* runtime state

with editor-only debugging layered outside.

---

# 72. Theme / branding

Research only bounded needs.

Potential P25 minimum:

```text
project title
logo
accent
basic visitor chrome style
```

But do not turn Experience into website theme builder.

Determine if branding belongs P25, Publish, or later.

---

# 73. Visitor shell

Research what visitor UI should contain.

Potential:

```text
project title
navigation
content layer
audio controls
fullscreen
help
back/next
```

Keep bounded.

No arbitrary layout.

---

# 74. Onboarding / controls help

3D visitors often do not know how to navigate.

Research:

```text
first-run controls
tooltips
touch instructions
navigation mode
```

Could be runtime-generated rather than authored.

Determine automatic platform responsibility.

---

# 75. Cursor / interaction affordance

Research visible indication that something is interactive.

Possible:

* cursor
* hover outline
* hotspot
* label
* focus ring

Do not depend on hover only.

---

# 76. Accessibility-first visitor affordance

For every interaction, answer:

```text
How does mouse user activate it?
How does touch user activate it?
How does keyboard user activate it?
How does screen-reader user discover it?
What happens under reduced motion?
```

This should be a P25 acceptance philosophy.

---

# 77. Browser history / URL state

Research whether destinations should map to:

```text
URL fragments / routes
```

Potential advantages:

* deep link
* browser back
* share destination

Potential complexity:

* SPA routing
* camera state
* content state

Determine minimum.

Deep linking could be high product value.

---

# 78. Shareable destinations

Research:

```text
project URL
project URL#destination
```

Could make exhibitions/portfolios much more useful.

Classify minimum vs follow-up.

---

# 79. Restart / home destination

Research whether every Experience should define:

```text
entry destination
```

Camera already has sequence/root concepts.

Avoid duplicate “start” semantics unnecessarily.

Determine relationship.

---

# 80. Public runtime authoring safety

Research must specify validation before publish.

Potential hard failures:

```text
missing referenced ID
invalid content asset
unresolvable navigation target
```

Potential warnings:

```text
no transcript
very long content
too many interactive targets
```

Distinguish.

---

# 81. Agent-friendly Experience editing

Future agent should be able to say:

```text
add a short info panel to the piano
make the sculpture clickable
take the visitor to Camera C after they select Continue
create a guided tour through these 5 destinations
add narration to the second stop
```

without writing frontend code.

Research what semantic representation enables this.

---

# 82. Inspectability

Research what an agent or developer needs from:

```text
inspectExperience()
```

Potential output:

```text
destinations
content
interactions
journeys
invalid references
navigation entry
runtime warnings
```

Do not dump rendered HTML or Three scene graph.

---

# 83. Natural-language mapping

Research agent/LLM systems enough to identify which semantic operations are easy to map from intent.

Do not build a prompt planner.

The purpose is to test whether the Experience model is **addressable**.

---

# 84. Reference projects for agent operations

Inspect where relevant:

* KittyCAD/Zoo typed operations
* Godot editor scripting/scene APIs
* Unity editor command patterns
* Blender operators
* USD/OpenUSD edit concepts
* structured scene DSLs
* LLM game-engine integrations
* Blender MCP projects
* semantic scene editing research

But maintain focus:

> semantic operation design, not transport/MCP implementation.

---

# 85. Capability classification

Every capability must end in:

```text
P25 MINIMUM
P25 FOLLOW-UP
LONG-TERM
REJECT / WRONG PRODUCT
```

Do not turn research coverage into commitment.

---

# 86. Likely minimum hypothesis

Use this only as a hypothesis to challenge:

```text
P25 minimum

1. Experience-owned destination/navigation representation
2. visitor navigation over existing Camera semantics
3. contextual Content resource
4. click interaction
5. destination-arrival interaction
6. Show Content
7. Navigate
8. Open URL
9. possibly Show/Hide Scene object
10. one guided journey using existing Camera Sequence
11. mobile/keyboard/reduced-motion visitor behavior
12. Experience Preview using real visitor runtime
13. actionable validation
14. publish/cold-runtime parity
```

Research should improve or reject items.

---

# 87. Likely follow-up hypothesis

Potential:

```text
audio narration
room-entry triggers
custom hotspots
multiple actions
show/hide
shareable destinations
visitor minimap
branching journeys
multiple tours
world-space labels
media-rich content
localization
analytics
```

Rank based on evidence.

---

# 88. Likely reject / defer

Potential:

```text
arbitrary variables
general conditions
visual scripting node graph
custom JavaScript actions
physics events
game mechanics
inventory
scoring
arbitrary HTML/CSS layout builder
general state machine
full workflow automation
general app builder
```

Research should validate the boundary.

---

# 89. Required Deliverable A — Executive findings

Give **15–25 implementation-changing conclusions**.

Examples:

> Existing Camera Sequence should remain motion/order truth; Experience should reference it rather than introducing another path timeline.

> Contextual Content should be a reusable semantic resource, not arbitrary DOM authored inside a Scene object.

> A generic trigger volume is unnecessary for the first Experience slice because destination arrival + object activation cover most target workflows.

> Reduced-motion behavior should be guaranteed by the runtime rather than authored separately per transition.

---

# 90. Required Deliverable B — top reference systems

Rank at least **15 serious systems/projects** if enough useful references exist.

| Rank | Project | Main value | Exact relevant modules | License/access | Reuse mode | P25 relevance |

Separate:

* open-source code references
* inspectable products
* UX references
* conceptual references

---

# 91. Required Deliverable C — capability matrix

For each:

| Capability | Current Museum equivalent | Best external reference | Maturity gap | Complexity | Bucket |

Cover:

```text
destination
free navigation
guided navigation
navigation menu
next/back
hotspots
object click
destination arrival
room entry
content
content presentation
audio
video
external links
show/hide
visitor state
conditions
multiple actions
guided journey
sequence occurrence binding
mobile
keyboard
screen reader
reduced motion
focus management
Preview
validation
deep linking
```

If current Museum behavior cannot be inspected, mark it as requiring repo inspection rather than guessing.

---

# 92. Required Deliverable D — current capability maturity audit framework

Before P25 planning, propose an audit matrix for the live repo.

At minimum:

```text
Camera graph/navigation
Camera Sequence
Preview Camera
Preview Edge
Preview Sequence
visitor navigation runtime
visitor UI/chrome
Scene interaction/picking
Publish/cold visitor
asset/content resolution
existing accessibility/reduced-motion behavior
```

Each gets:

```text
current behavior
canonical owner
known limitation
reference comparison
maturity disposition
```

---

# 93. Required Deliverable E — recommended Experience data model

Propose the smallest semantic representation.

Answer explicitly:

* Is a separate `ExperienceDocument` warranted?
* How are destinations represented?
* How is content represented?
* How are interactions represented?
* How are actions represented?
* How are Spatial references encoded?
* How does Camera Sequence integrate?
* What runtime state is ephemeral?
* What persists?
* How are IDs validated?
* How does deletion behave?

Do not persist renderer/UI state.

---

# 94. Required Deliverable F — destination architecture

Design the semantic relationship among:

```text
Room
Scene entity
Camera node
Camera Sequence
Experience destination
visitor nav item
```

Avoid duplicate truth.

---

# 95. Required Deliverable G — guided journey architecture

Compare:

```text
Camera Sequence directly
```

vs:

```text
Experience Journey references Camera Sequence
```

vs:

```text
Experience Step list
```

vs alternatives.

Recommend minimum.

Account for sequence occurrences/revisits.

---

# 96. Required Deliverable H — trigger/action model

Recommend exact minimum trigger/action vocabulary.

Example candidate:

```text
Triggers:
Activate
DestinationReached

Actions:
ShowContent
NavigateTo
OpenUrl
```

Maybe Show/Hide Scene.

Research decides.

For each:

```text
semantic input
target identity
runtime behavior
failure case
visitor accessibility behavior
agent suitability
```

---

# 97. Required Deliverable I — Content architecture

Recommend:

* content resource schema
* supported minimum content types
* asset references
* presentation mode
* accessibility metadata
* reuse
* deletion
* visitor rendering

Do not design generic CMS.

---

# 98. Required Deliverable J — Visitor UI architecture

Specify minimum visitor chrome.

Answer:

* navigation UI
* content UI
* Back/Next
* mobile adaptation
* fullscreen
* audio controls if included
* accessibility
* project branding

Keep fixed semantic components rather than arbitrary layout editor.

---

# 99. Required Deliverable K — accessibility contract

Propose concrete platform guarantees.

For every project, ideally:

```text
keyboard-reachable destinations/interactions
visible focus
reduced-motion navigation
accessible content DOM
semantic destination labels
screen-reader equivalent navigation
focus return after overlays
touch-size targets
motion controls
```

Distinguish:

```text
runtime-provided automatically
author-required metadata
author-optional enhancement
```

---

# 100. Required Deliverable L — Preview architecture

Show:

```text
Experience authoring
→ canonical Experience data
→ same visitor runtime
→ editor Preview wrapper
```

No second Experience renderer.

Describe editor-only debugging overlay separately.

---

# 101. Required Deliverable M — operation surface

Propose conceptual human/agent-shared operations.

Example:

```ts
createDestination(...)
updateDestination(...)

createContent(...)
updateContent(...)

bindInteraction(...)
removeInteraction(...)

setExperienceEntry(...)
setJourney(...)

validateExperience(...)
```

Do not invent current function names.

For each:

```text
Owner
Inputs
Preconditions
Mutation scope
History behavior
Errors
Agent suitability
```

---

# 102. Required Deliverable N — schema pressure

For every recommended capability classify:

```text
NO SCHEMA CHANGE
SMALL EXTENSION
NEW EXPERIENCE ENTITY
NEW EXPERIENCE RESOURCE
NEW DOCUMENT
MAJOR PROJECT MODEL CHANGE
```

This is critical.

---

# 103. Required Deliverable O — reference-integrity rules

Propose behavior for:

```text
delete referenced Scene object
replace asset on referenced Scene object
delete Camera node
remove Camera Sequence occurrence
delete Content
rename destination
duplicate room/project objects
```

Prefer deterministic warnings/rejection/repair over silent semantic destruction.

---

# 104. Required Deliverable P — acceptance tests

Create concrete scenarios.

Examples:

## Destination

```text
create destination referencing Camera Node C
→ appears in visitor nav
→ activation uses canonical camera-motion system
→ no duplicate camera path data
```

## Content

```text
click painting
→ show accessible content panel
→ keyboard activation works
→ Escape closes
→ focus returns to activation source
```

## Reduced motion

```text
prefers-reduced-motion
→ destination navigation reaches same target
→ camera path animation is replaced by safe reduced-motion behavior
```

## Sequence

```text
guided experience references existing Camera Sequence
→ Next follows canonical ordering
→ revisited camera node can receive occurrence-specific content if supported
```

## Delete reference

```text
attempt to delete referenced Camera node
→ deterministic warning/rejection
→ Experience reference is not silently retargeted
```

## Publish

```text
published visitor cold boots
→ navigation/content/interactions work
→ no editor Experience stores/components required
```

---

# 105. Required Deliverable Q — visitor accessibility fixtures

Test at least:

```text
desktop mouse
desktop keyboard
mobile touch
prefers-reduced-motion
screen-reader/semantic DOM navigation
```

Use one small representative experience.

---

# 106. Required Deliverable R — “do not build” list

Explicitly identify attractive but wrong-scope capabilities.

Likely:

```text
general visual scripting
arbitrary condition graph
custom JavaScript
game-state variables
physics triggers
inventory
scoring
shader interaction systems
general website layout
full CMS
general form builder
workflow automation
```

Explain why.

---

# 107. Required Deliverable S — technical spikes

Recommend **4–7 bounded spikes** before P25 implementation freezes.

Candidates:

## Spike 1 — Destination reuse

Reference existing Camera node from Experience without duplicating spatial state.

## Spike 2 — Click → Content

Scene entity activation → accessible content overlay.

## Spike 3 — Destination reached

Canonical camera navigation completion → Experience trigger.

## Spike 4 — Guided journey

Reuse existing Camera Sequence + contextual content.

## Spike 5 — Reduced motion

Same destination semantics with alternate safe motion behavior.

## Spike 6 — Reference integrity

Delete/replace referenced Scene/Camera entities.

## Spike 7 — Cold visitor

Experience state + content + navigation through P22 publication without editor dependencies.

Refine based on research.

---

# 108. Required Deliverable T — P25 Minimum recommendation

Design the smallest coherent Experience slice.

For each capability provide:

```text
product value
current Museum seam
external reference
persistent state
runtime state
semantic operation
visitor behavior
accessibility behavior
history behavior
publish behavior
acceptance test
```

---

# 109. Required Deliverable U — Follow-up ranking

Rank later Experience depth by:

```text
visitor value
creator value
agent value
reuse
implementation cost
state complexity
accessibility burden
architecture risk
```

---

# 110. Required Deliverable V — P25 implementation-readiness gaps

Do **not** finish the report by declaring P25 ready.

Instead explicitly list:

```text
current-code audits still required
reference modules requiring direct verification
schema questions unresolved
UX studies unresolved
technical spikes required
owner decisions required
```

Only if evidence genuinely closes a question should it be marked resolved.

---

# 111. Final product boundary question

Answer:

> **Where should Museum Editor stop expanding Experience capability before it becomes a generic app/game-authoring platform?**

Draw four zones:

```text
Core Experience vocabulary
Advanced spatial-experience productivity
Later platform capabilities
Wrong-product territory
```

---

# 112. Final roadmap recommendation

End with a directional future structure such as:

```text
P25 — Experience Foundation

E0 — current capability / reference reconciliation
E1 — destinations + visitor navigation
E2 — contextual content
E3 — bounded interactions
E4 — guided journey integration
E5 — accessibility + visitor UX
E6 — Preview / Publish / integration
```

But **do not assume these are implementation increments**.

Treat them as study/planning tracks until current-code audit + reference study + owner review freezes the actual implementation brief.

---

# 113. Final decision question

The report must end by answering:

> **If Museum Editor already has Build, Stage, Camera direction, Preview and Publish, what is the smallest semantic Experience layer that lets a human or future agent turn that spatial project into a compelling visitor journey without writing application code?**

Then separately answer:

> **What additional current-code inspection, external-reference study and technical spikes are still required before P25 should be considered implementation-ready?**

The goal is that after Phase 5, we should not need another **broad** Experience-platform survey.

We may still need focused maturity audits and implementation-specific studies, just as P24B does.
