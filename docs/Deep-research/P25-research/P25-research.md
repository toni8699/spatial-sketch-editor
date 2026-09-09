# P25 Focused Experience Research

## 0. Executive conclusions

Current P25 hypothesis mostly survives. Main flaw: **`Destination + existing Camera Sequence` alone not enough once same spatial place can occur twice in one guided journey.** Mature tour systems treat journey position as its own semantic unit: StoryMaps uses movable/duplicable tour-place slides; STQRY exposes ordered stops with Next/Previous; Shepherd gives each step its own identity separate from attached UI target. ([ArcGIS Documentation][1])

Museum current implementation makes this sharper. Camera order lives directly on camera nodes through `nextNodeId` / `previousNodeId`; visitor flow derives a unique node chain from those links. Current visitor state tracks visited **rooms**, not sequence occurrences. Reusing the same Piano camera twice as two semantically different visits cannot be represented cleanly without either duplicating the camera node or changing the Camera Sequence representation. Both concern canonical Camera authority, not an Experience-owned second graph.

**Big revision:** P25 needs concept of a **guided Stop**, meaning one occurrence of a reusable Destination in canonical guided order. But Stop must remain **Sequence-relative**. It owns no XYZ, camera pose, path, transition timing, connectivity, or independent Next/Previous topology.

Best long-term shape:

```text
Camera / Spatial truth
Destination A ──────── canonical target/view

Canonical guided Sequence
Intro → Piano → Paris → Piano → Exit
          │               │
          ▼               ▼
       Stop A           Stop B
       context 1        context 2

Experience
adds visitor label/content/narration/rules
to Destination or guided occurrence
```

Exact durable owner of Stop identity must wait. Best architecture may be stable occurrence identity **inside evolved Camera Sequence**, with Experience only attaching metadata to that identity. Current Camera representation has no such occurrence record. Therefore:

> **ADD Stop as product semantics now.
> DO NOT freeze its schema/ownership now.
> POST-F0 / POST-P24 RECONCILIATION REQUIRED.**

Other conclusions:

| Area                                         | Decision                                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Destination                                  | **KEEP**, but define as reusable visitor-facing semantic reference to canonical navigation meaning |
| Guided Stop / occurrence                     | **ADD**                                                                                            |
| Independent Experience tour graph            | **REJECT**                                                                                         |
| One responsive Info Panel                    | **KEEP + REFINE**                                                                                  |
| Modal/card/sidebar as separate Content types | **REJECT for minimum**                                                                             |
| Constrained rich text                        | **ADD**                                                                                            |
| Arbitrary HTML/CSS/layout                    | **REJECT**                                                                                         |
| `Activate`                                   | **KEEP**                                                                                           |
| `DestinationReached`                         | **KEEP**, but runtime event needs guided-occurrence context when applicable                        |
| `ShowContent`                                | **KEEP**                                                                                           |
| `NavigateTo`                                 | **KEEP**                                                                                           |
| `OpenUrl`                                    | **KEEP**, but only from explicit visitor activation/native links in minimum                        |
| Multiple independent rules per event         | **ADD**                                                                                            |
| Ordered action arrays / waits                | **REJECT**                                                                                         |
| Narration                                    | **DEFER one level**, high priority                                                                 |
| `Once` / `FirstVisit`                        | **DEFER one level**                                                                                |
| `Highlight`                                  | **DEFER one level**                                                                                |
| Show/Hide Scene objects                      | **DEFER**                                                                                          |
| Generic variables/conditions                 | **REJECT**                                                                                         |
| Node graph                                   | **REJECT**                                                                                         |
| DOM companion navigation/content             | **ADD, mandatory platform contract**                                                               |
| Reduced-motion same Destination              | **KEEP + strengthen**                                                                              |
| Preview/Publish same visitor semantics       | **KEEP, mandatory**                                                                                |

P25 minimum therefore becomes slightly richer semantically but remains very narrow:

```text
Destination
+
Guided Stop / occurrence
+
Content → one platform Info Panel
+
Activate / DestinationReached
+
ShowContent / NavigateTo / OpenUrl
+
guided/free visitor navigation
+
automatic accessibility + motion contract
```

This stays aligned with North Star: same project, same world, same cameras, same runtime; Experience references Spatial instead of becoming another camera, scene, asset, or scripting system. 

---

# 1. Evidence method

Research brief treated as task definition, not evidence. Museum docs/code treated as current product context. Existing Phase 5 report treated as prior evidence to challenge rather than restate. 

Current Museum context inspected included P25 umbrella/research, P22 shipped visitor runtime, tracker/P23-P24 sequencing, North Star, current `NavigationNodeData`, visitor runtime state, `VisitorCameraDirector`, `VisitorPreviewSurface`, and `VisitorEntities`. Current tracker has P22 shipped, P23 F0 active, P24 reconciliation ahead of implementation, and P25 still research/reconciliation only.

Existing Phase 5 research already reached roughly “Destination + Content + click/arrival actions,” but leaned toward Camera Sequence alone for guided flow and ranked `once`, audio/video and broader action vocabulary fairly early. This focused pass stress-tests those calls against repeated occurrences, actual Museum runtime seams, media-browser constraints, and accessibility.

Primary external evidence emphasized:

* ArcGIS StoryMaps map tours.
* STQRY and VoiceMap tour/audio behavior.
* Matterport guided/free experience patterns.
* Kuula hotspots/cards.
* Figma and Webflow interaction systems as complexity counterexamples.
* Shepherd.js source for step/target separation.
* W3C WCAG/APG/XAUR.
* MDN browser media/motion/user-activation behavior.
* Apple touch-target guidance.

Important limitation: commercial product docs reveal visible semantics, not their private persistence models. So recommendation for stable Stop identity is partly **architecture inference**, not claim that StoryMaps/STQRY use one exact internal schema.

---

# 2. Destination vs occurrence

## Evidence

StoryMaps guided tours explicitly contain numbered **tour places**, each represented by a slide. A slide has its own title, description, media and location; authors can duplicate, reorder, hide and delete it. Explorer tours use the same broad place concept but let visitors jump freely. This is strong evidence that “place in journey” needs separate authoring context from raw location. ([doc.arcgis.com][1])

STQRY is even clearer: a tour is a sequence of **stops**, with Next/Previous, swipe navigation, and a menu of all stops. Each stop may contain several screens. ([STQRY Support Portal][2])

Shepherd's open-source model separates a `Step` from the DOM element it attaches to. Steps have their own IDs, content and behavior even though they reference another target. That is conceptually close to Museum's need: journey occurrence ≠ spatial target. ([GitHub][3])

Museum today cannot simply represent:

```text
Intro → Piano → Paris → Piano → Exit
```

with one reusable Piano camera node in its existing linked-node Sequence. `NavigationNodeData` contains only one optional `nextNodeId` and `previousNodeId`; `visitorMainFlowNodeIds()` walks those node identities once and terminates on cycles/repeats.

### Direct answers

**1. Can minimum safely use only Destination + current Camera Sequence?**

No, not as durable P25 semantics. It works for a linear journey where every Destination occurs at most once. It fails the first realistic repeated-place case.

**2. Smallest additional concept?**

A **Stop**: one guided occurrence of a reusable Destination.

Not Chapter. Not Tour Graph. Not waypoint geometry. Just occurrence identity plus occurrence-specific Experience context.

**3. Must it have persistent identity?**

If nothing can reference occurrence-specific state, index can remain transient. But the moment P25 supports different content, narration, arrival behavior, progress, or authoring selection on the two Piano visits, **stable identity becomes necessary**.

Array index is not identity.

**4. Destination vs occurrence ownership**

| Meaning                         | Destination                         | Stop occurrence                     |
| ------------------------------- | ----------------------------------- | ----------------------------------- |
| Canonical visitor name          | Yes                                 | Optional contextual override        |
| Spatial/camera target reference | Yes                                 | References Destination              |
| Generic description/content     | Good default binding                | Optional journey-specific binding   |
| Narration                       | Possible free-explore default later | Best guided binding                 |
| Guided progress                 | No                                  | Yes                                 |
| Arrival-specific context        | Generic                             | Yes                                 |
| Next / Back                     | No                                  | Derived from canonical guided order |
| “Visited destination”           | Session-derived                     | Can contribute                      |
| “Completed step”                | No                                  | Session-only Stop state             |
| Camera pose/path/timing         | **Never**                           | **Never**                           |

**5. Can Stop remain Camera-Sequence-relative?**

Yes. It should.

Ideal authority:

```text
Camera domain
owns ordered traversal / occurrence position

Experience
attaches semantic visitor context

Camera route/motion
executes movement
```

Stop must never gain independent connectivity.

**6. Why array-index identity fails**

Suppose content binds to `sequence[3]`.

```text
0 Intro
1 Piano
2 Paris
3 Piano   ← second Piano content
4 Exit
```

Insert one Stop before Paris and second Piano becomes index 4. Any binding, narration progress, test fixture, selection state or analytics label attached to index 3 now points at wrong occurrence.

Reorder causes same failure. Delete causes index collapse. Duplicate produces ambiguous identity.

**7. Patterns to reject**

Duplicate Camera nodes only to make semantic duplicate Stops; independent Experience `nextId` / `previousId`; Experience-owned camera pose; arbitrary coordinates as destination identity; an Experience TourGraph parallel to Camera connectivity; binding occurrence metadata to mutable array index.

### Decision matrix

| Option                                                       | Benefits                                        | Failure cases                                      | Persistence implications | Camera duplication risk             | Disposition                    |
| ------------------------------------------------------------ | ----------------------------------------------- | -------------------------------------------------- | ------------------------ | ----------------------------------- | ------------------------------ |
| Destination + current Sequence only                          | Tiny model                                      | Repeated Destination cannot carry distinct context | Minimal                  | Low until authors duplicate cameras | **REJECT as full P25 minimum** |
| Destination + array-index occurrence                         | Easy prototype                                  | Insert/reorder/delete retarget bindings            | Fragile positional refs  | Low                                 | **REJECT**                     |
| Destination + stable Stop over canonical Sequence occurrence | Repeats, content, narration, progress all clean | Needs Sequence identity seam                       | Small stable identity    | Very low                            | **RECOMMENDED**                |
| Duplicate Camera node per occurrence                         | Works with current linked nodes                 | Duplicates same viewpoint; edits drift             | Bloats Camera truth      | **High**                            | **REJECT**                     |
| Independent Experience journey graph                         | Maximum flexibility                             | Two route authorities; branching creep             | Large new durable graph  | **Very high**                       | **REJECT**                     |

### Recommendation

Ratify **Stop semantics**, not implementation.

The preferred future shape is probably not “Experience creates ordered Stops.” Better:

```text
canonical Camera Sequence occurrence
        +
Experience metadata/reference
        =
visitor Stop
```

But current Camera Sequence lacks stable occurrence records, so exact arrangement stays:

**POST-F0 / POST-P24 RECONCILIATION REQUIRED.**

---

# 3. Content model / Info presentation

## Evidence

StoryMaps tour places use heading-like titles, formatted multi-paragraph descriptions, lists, links, images/video, attribution and alt text. Presentation layout can later switch between map-focused/media-focused/list/grid without redefining the content itself. ([doc.arcgis.com][1])

Kuula's Interactive Card is a useful narrower reference. One responsive card can contain media, text and a link; all are optional, and the same card adapts across screen sizes. Kuula permits much more visual customization and embedding, but those parts are not necessary to prove the primitive. ([Kuula][4])

StoryMaps explicitly does **not** allow arbitrary HTML/CSS/JavaScript in builder blocks while still supporting rich, accessible storytelling. That is strong counterevidence to any claim that P25 needs arbitrary authored web layout. ([ArcGIS Documentation][5])

## Recommended minimum

```text
Content
├─ title
├─ constrained rich body
├─ optional primary media
│  ├─ accessible description
│  ├─ caption
│  └─ attribution / credit
└─ optional link / CTA
```

No concrete TypeScript representation yet.

### Body format

**Constrained rich text**, not plain text and not durable arbitrary HTML.

Minimum semantic formatting:

```text
paragraph
heading
list
emphasis
inline link
```

Markdown may later be one authoring input. It should not automatically become persistence truth.

### Presentation primitive

Use exactly one authored presentation semantic:

> **Info Panel**

Platform decides responsive rendering.

Possible implementation presentation:

```text
wide screen → side-sheet-like dialog
small screen → bottom/full sheet
```

Author should not choose “modal vs bottom sheet vs side panel” as separate Content types in minimum. Those are responsive presentation decisions over one semantic content object.

WAI dialog guidance gives clear behavior for focus, Escape, tab containment and focus return, while responsive full-screen dialogs are a documented useful small-screen pattern. ([W3C][6])

### Platform owns

* responsive layout;
* typography;
* max readable width;
* scrolling;
* panel animation;
* focus behavior;
* close affordance;
* backdrop/modal behavior;
* breakpoints;
* media aspect-fit behavior;
* semantic HTML;
* safe external-link behavior.

### Author owns

* title;
* body semantics;
* media choice;
* useful alt text or decorative designation;
* caption;
* contextual credit where needed;
* CTA/link label and destination.

Museum should derive legal/provenance credit from canonical project asset metadata where possible rather than copy license truth into Experience. This matches North Star asset ownership. 

## Minimum / depth / wrong product

| Level                | Capability                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Minimum**          | title, constrained rich text, one primary image, caption/alt/credit, optional link/CTA, one Info Panel                        |
| **One level deeper** | video, small image gallery, related Destination link, secondary CTA, richer media captions                                    |
| **Deferred**         | standalone passive caption/label primitive, world-space interpretation labels, download attachment                            |
| **Wrong product**    | arbitrary HTML/CSS/JS, freeform page layout, iframe ecosystem, reusable arbitrary web-component trees, page-builder templates |

Media bytes must come through canonical project Assets. Current P22 release path is not yet general Experience image/audio/video infrastructure, so exact media record/pinning behavior remains **POST-P24 RECONCILIATION REQUIRED**.

---

# 4. Narration

Narration deserves its own semantics. Treating it as merely generic `PlayAudio` loses arrival, interruption, transcript and visitor-control behavior.

## External behavior

STQRY tours can start audio automatically on location arrival. Its authoring model explicitly has conflict policies when another track is playing: replace current track, skip new track, or queue it. Default is **replace**. Visitors may pause/replay stops. ([STQRY Guide][7])

VoiceMap similarly binds audio to ordered tour locations and automatically begins when a visitor reaches the location. It supports Start/Resume and manual skipping. ([VoiceMap Help Center][8])

Web changes key constraint: audible autoplay is generally blocked until visitor interaction or browser permission. P25 therefore cannot promise “DestinationReached always starts narration” on cold page load. ([MDN Web Docs][9])

Prerecorded audio-only content needs equivalent transcript at WCAG Level A. ([W3C][10])

## Conceptual model

Best distinction:

```text
Narration resource
= reusable narrated media + accessible transcript

Narration binding
= where/when that narration belongs
```

Best guided attachment: **Stop**.

Why:

```text
Piano visit 1 → history narration
Piano visit 2 → performance narration
```

Destination-level attachment alone cannot distinguish them.

Narration should not primarily be:

* a Content subtype: playback has its own lifecycle;
* a generic Interaction action: then interruption/resume rules become scattered;
* Camera Sequence global audio: too coarse;
* Scene truth: wrong owner.

## Recommended lifecycle for first narration slice

| Question                       | Recommendation                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| Start                          | On semantic Stop/Destination arrival, but only after visitor has enabled/started audio |
| New navigation                 | Stop prior narration                                                                   |
| Overlap                        | **Never by default**                                                                   |
| Resume after manual pause      | Resume current track                                                                   |
| Return to old Stop             | Restart from beginning initially                                                       |
| Jump elsewhere                 | Stop current narration                                                                 |
| Queue tracks                   | No                                                                                     |
| Background audio mixing        | No                                                                                     |
| Browser autoplay rejection     | Fall back to visible Play control                                                      |
| Transcript                     | Required                                                                               |
| Global volume/mute             | Visitor-session setting                                                                |
| Playback progress              | Ephemeral visitor-session state                                                        |
| Persist across visits/accounts | No minimum                                                                             |
| Reduced motion                 | Independent; do not mute audio because motion reduced                                  |

Important separation:

```text
normal motion
→ arrive at Stop
→ narration may begin

reduced motion
→ cut to same Stop
→ same arrival event
→ same narration behavior
```

Narration must bind to semantic arrival, not animation duration.

### P25 placement

**DEFER from absolute minimum. Highest-priority depth candidate.**

Reason: museum value high, but browser autoplay, media lifecycle, transcripts, global audio controls and interruption policy create a meaningful subsystem. Minimum visitor journey remains complete with visual Content.

Exact media ownership/resolution:

**POST-P24 RECONCILIATION REQUIRED.**

---

# 5. Bounded interaction vocabulary

## Scenario stress test

| Scenario                                     | Result                                             | Reason                                                             |
| -------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| 1. Activate artwork → ShowContent            | **Works cleanly**                                  | Core semantic interaction                                          |
| 2. Activate object → NavigateTo Destination  | **Works cleanly**                                  | Canonical nav executes movement                                    |
| 3. DestinationReached → ShowContent          | **Works cleanly**                                  | Core arrival behavior                                              |
| 4. Attribution link → OpenUrl                | **Works**, often no rule needed                    | Info Panel can render semantic link directly                       |
| 5. Guided arrival → contextual content       | **Works**                                          | Destination binding if unique; Stop binding if occurrence-specific |
| 6. Same Destination twice, different context | **Needs Stop extension**                           | Destination identity alone ambiguous                               |
| 7. Optional narration                        | **Needs one-depth semantic extension**             | Audio lifecycle > generic action                                   |
| 8. Reveal/highlight another object           | **Highlight: useful depth**                        | Transient emphasis can avoid Scene mutation                        |
| 9. First-visit-only message                  | **Depth**                                          | Adds bounded visitor state                                         |
| 10. Show/hide object                         | **Defer**                                          | Runtime visibility state, reset and a11y complexity                |
| 11. Navigate then ShowContent                | **Compose rules**                                  | `Activate→Navigate`, then `DestinationReached→ShowContent`         |
| 12. Two simultaneous outcomes                | **Multiple independent rules**, if non-conflicting | No ordered action list needed                                      |

## Core remains strong

```text
Events
├─ Activate
└─ DestinationReached

Actions
├─ ShowContent
├─ NavigateTo
└─ OpenUrl
```

`Activate` should unify pointer, touch, keyboard and accessible DOM activation. No separate authored `Click`, `Tap`, `KeyPress`.

### Occurrence refinement

No new `StopReached` event required immediately.

Runtime may conceptually emit:

```text
DestinationReached
  destination = Piano
  guidedOccurrence = PianoVisit2 | null
```

Then rules can scope arrival behavior to Destination or occurrence.

This keeps vocabulary small.

## Multiple actions?

Figma allows unlimited actions on one trigger, but immediately needs explicit top-to-bottom ordering; changing action order can change outcome. Conditions and variables then layer on top. ([Figma Help Center][11])

Webflow goes further: complex interactions gain chronological timelines, sequential/parallel execution, durations and conditions. ([Webflow Help Center][12])

That is exactly boundary Museum should avoid.

Recommended:

```text
one rule
=
one semantic Event
→ one Target/context
→ one Action
```

But several rules may listen to same event.

```text
Activate Piano
→ ShowContent PianoInfo

Activate Piano
→ Highlight Score
```

No ordering promised.

If two rules conflict, validator rejects combination rather than inventing an ordering system.

Examples:

```text
same activation
→ NavigateTo Paris
→ NavigateTo Exit
```

invalid: two competing navigations.

Likewise two `ShowContent` actions targeting one single-panel presentation should be invalid unless a future explicit arbitration rule exists.

### Causal composition

Prefer semantic events:

```text
Activate object
→ NavigateTo Piano

DestinationReached Piano
→ ShowContent PianoInfo
```

Not:

```text
Activate
→ Navigate
→ wait 3.6 s
→ ShowContent
```

This survives authored motion changes and reduced-motion substitution.

## `OpenUrl` constraint

Opening a new browser context requires transient user activation and may be blocked otherwise. External URLs therefore should not fire from automatic `DestinationReached` in minimum. ([MDN Web Docs][13])

Info-panel links should preferably be real semantic anchors. If Museum deliberately opens new tabs, it should clearly warn visitors because unexpected new windows can disorient users. ([W3C][14])

## Boundary

```text
KEEP
Activate
DestinationReached
ShowContent
NavigateTo
OpenUrl

ADD
multiple independent rules
guided-occurrence event context

DEFER
Highlight
Once / FirstVisit
Narration

DEFER HARDER
ShowObject / HideObject
MediaEnded
CueReached until Camera cues actually ship

REJECT
ordered action lists
wait
duration
variables
expressions
arbitrary conditions
custom JS
workflow graph
```

---

# 6. Visitor navigation UX

## Current Museum

Current visitor runtime already has `guided | free`, canonical route requests, Next/Back through Camera order and reduced-motion state. But `goBack()` means prior Camera node, and its visited gate uses `visitedRoomIds`. There is no Stop occurrence model.

Current public/Preview surface exposes keyboard instructions around WebGL, but has no authored DOM Destination menu, visible Next/Back surface, semantic content navigation, or accessible interactive-object companion.

## Evidence

StoryMaps makes a clean distinction:

* Guided = numbered sequential places.
* Explorer = jump among places freely.

Matterport similarly combines curated guided viewpoints with visitor-controlled exploration. ([ArcGIS Documentation][1])

STQRY guided Stop UX explicitly uses Next, Previous and full-stop menu. ([STQRY Support Portal][2])

## P25 minimum semantics

### Home

`Home` = canonical guided entry Destination/Stop.

Not world origin. Not Room 0. Not browser home.

### Next

In guided mode:

> next **Stop occurrence**, executed via canonical Camera navigation.

Not necessarily next raw Camera node.

### Back

In guided mode:

> previous **Stop occurrence**.

This is strongest answer to unresolved Back question.

Not:

* previous room;
* previous arbitrary free navigation;
* previous physical intermediate node;
* browser history.

### Destination menu

Lists reusable visitor-visible Destinations.

Selection executes:

```text
menu selection
→ NavigateTo Destination
→ canonical Camera route/motion
```

Repeated Piano need not appear twice in a general “Places” menu merely because guided flow visits it twice.

A guided tour outline may expose occurrences separately:

```text
1 Intro
2 Piano — The Instrument
3 Paris
4 Piano — The Performance
5 Exit
```

### Guided/free deviation

Minimum visitor session needs small ephemeral concept:

```text
currentGuidedStop
```

If visitor leaves guided flow through free navigation, **Resume Tour** returns to current/next guided occurrence. It does not mutate Camera Sequence.

No durable rejoin graph needed.

### Progress

Add platform-derived:

```text
Step 2 of 5
```

No author state needed. This naturally maps to `aria-current="step"`, which WAI defines for current item in a step sequence. ([W3C][15])

Visited checkmarks can wait. `FirstVisit` can wait.

### Browser Back

Do not overload browser Back in minimum.

Internal movement stays inside one published experience URL. Browser Back retains normal page/session-history meaning. Deep-link-per-Destination and `pushState` integration belong with future sharing/deep links.

This avoids creating a second navigation history model before Museum actually needs URL-addressable destinations.

### Minimum visitor surface

Semantically required, regardless exact screen design:

```text
Home
Back
Next
Destinations
current location/step
guided/free/resume state
Help
motion preference
```

A map/minimap remains derived Spatial presentation and can wait.

---

# 7. Accessibility contract

This should be platform contract, not optional author polish.

W3C XR guidance specifically calls for accessible identification of locations/objects, device-independent interactions, orientation mechanisms and alternatives to sickness-triggering movement. ([W3C][16])

## AUTOMATIC PLATFORM GUARANTEE

| Guarantee                       | P25 meaning                                                                 |
| ------------------------------- | --------------------------------------------------------------------------- |
| One semantic Activate           | Mouse, touch, keyboard and accessible DOM invoke same event                 |
| DOM companion UI                | Visitor never depends exclusively on raycast/WebGL interaction              |
| Semantic Destination navigation | `<nav>`/controls expose visitor destinations to assistive tech              |
| Current-state semantics         | Current Destination/Stop represented programmatically, e.g. `aria-current`  |
| Visible keyboard focus          | Navigation, content and controls always show focus                          |
| Logical focus order             | Spatial UI does not create arbitrary tab order                              |
| Info Panel focus contract       | Move focus into modal; Escape closes; restore focus to invoker              |
| Touch target floor              | WCAG 24×24 CSS px minimum; product should target comfortable ~44px controls |
| Reduced motion                  | Detect user preference and offer visitor control                            |
| Same semantic Destination       | Reduced motion changes transition presentation, never destination/nav state |
| Semantic arrival                | `DestinationReached` fires after both animated and no-motion transition     |
| Responsive readable content     | No horizontal reading dependence                                            |
| Contrast/text scaling           | Platform theme meets WCAG target                                            |
| Safe media controls             | Keyboard-operable play/pause/mute/volume                                    |
| External-link semantics         | Real links; warn when forced new context                                    |
| Same Preview/Publish semantics  | Accessibility behavior not Preview-only                                     |

WCAG requires keyboard-operable functionality, while APG buttons use Enter and Space as activation semantics. ([W3C][17])

WCAG 2.2 minimum target size is 24×24 CSS px. Apple's accessibility guidance recommends 44×44pt default iOS controls, useful as a stronger Museum touch default. ([W3C][18])

## AUTHOR-REQUIRED SEMANTIC INPUT

Author must provide:

```text
Destination label
interactive target label/name
Content title/body
meaningful link text
image alt text OR decorative declaration
caption where context requires it
Narration transcript
video captions where audio carries meaning
```

Pre-recorded audio-only transcripts are WCAG Level A; prerecorded synchronized video with meaningful audio needs captions. ([W3C][10])

## OPTIONAL AUTHOR ENHANCEMENT

Could include later:

* longer object descriptions;
* pronunciation;
* contextual landmark descriptions;
* richer media captions;
* related Destinations;
* optional orientation/help text;
* additional accessible descriptions of complex spatial relationships.

Authors should **not** be allowed to disable visitor reduced-motion preference.

## Reduced-motion decision

Current Museum already preserves destination truth: target node remains same, while `VisitorCameraDirector` accelerates motion when `reducedMotion` is enabled. That is directionally correct.

But current implementation uses very fast path traversal. That should be refined.

`prefers-reduced-motion` guidance explicitly calls out large panning/scaling as vestibular triggers and recommends removing, reducing or replacing motion. A 24× camera traversal still traverses the motion. ([MDN Web Docs][19])

P25 contract should become:

```text
Normal
Destination Piano
→ canonical authored camera motion
→ Piano

Reduced
Destination Piano
→ cut / non-spatial dissolve / minimal transition
→ same Piano
```

This answers critical question: **yes, exact same semantic Destination can and should remain reachable while motion presentation changes.**

No second route. No alternate destination.

---

# 8. Authoring UX

Leading Museum hypothesis survives:

```text
same 3D world
+
Experience overlays
+
Inspector / rule cards
```

Kuula offers strong direct evidence: select or create hotspot directly in spatial view, then edit behavior through right-side panel. Hotspots expose simple action selection rather than a node graph. ([Kuula][20])

StoryMaps provides complementary evidence for non-spatial journey state: ordered slides remain visible in an authoring strip so stops can be reordered, duplicated and edited. ([doc.arcgis.com][1])

Museum needs both patterns.

## Recommended conceptual authoring split

```text
World
→ select Spatial target / see Experience badges

Structured list
→ Destinations
→ guided Stops
→ reusable Content
→ rules

Inspector
→ edit selected semantic binding/rule/content
```

This does **not** require separate 3D truth.

### Why direct-world-only is insufficient

Content and Stop occurrences can be non-spatial or reusable. Second Piano occurrence occupies same world position as first. No overlay can show two journey occurrences cleanly at same physical target.

So Experience needs a small list/outliner-like representation of non-spatial authoring truth in addition to direct selection.

### Rule cards

Good for:

```text
Activate · Piano
Show · Piano information
```

or:

```text
Destination reached · Piano / Stop 4
Show · Performance context
```

Useful card data remains semantic and readable by humans/agents.

### When node graphs win

Node graphs become useful when graph structure itself carries meaning:

```text
branch
condition
wait
merge
variable
loop
ordered multi-action workflow
```

But all of those are outside P25 minimum.

Figma's complexity progression is instructive: ordinary trigger/action is simple; once multiple ordered actions, conditions and variables enter, outcome becomes dependent on execution order. Webflow then exposes a timeline to manage chronological complexity. ([Figma Help Center][11])

Therefore no meaningful evidence supports paying node-graph UX cost for P25 minimum.

No numeric “20 rules becomes hard” threshold can be defended from current evidence. Complexity threshold is **structural, not count-based**.

### Testing/Preview authoring needs

Research supports these capabilities later in P25 authoring:

```text
preview exact visitor runtime
jump to Stop/Destination for testing
activate selected target
reset visitor session state
test reduced motion
show invalid references
show active rule/event
```

These are test lenses around same runtime, not a second runtime.

Current `VisitorEntities` contains rendering only, with no visitor activation handler seam yet. `Activate` therefore represents real new visitor-runtime behavior, not rebranding something already implemented.

---

# 9. P25 minimum hypothesis — revised

| Capability                        | Decision                  | Why                                         |
| --------------------------------- | ------------------------- | ------------------------------------------- |
| Destination                       | **KEEP**                  | Reusable semantic navigation target         |
| Camera-node-backed minimum target | **REFINE**                | Avoid implicit room→camera heuristics       |
| Room as direct navigation target  | **DEFER exact semantics** | Needs explicit preferred-view contract      |
| Guided Stop / occurrence          | **ADD**                   | Repeated Destination needs context identity |
| Stable Stop identity              | **ADD conceptually**      | Index refs break under reorder              |
| Experience-owned order graph      | **REJECT**                | Duplicates Camera authority                 |
| Destination menu                  | **KEEP**                  | Free/direct navigation                      |
| Guided Home/Next/Back             | **ADD**                   | Complete visitor journey                    |
| Progress “x of n”                 | **ADD**                   | Derived, cheap orientation                  |
| Browser-history integration       | **DEFER**                 | Deep-link scope                             |
| Content resource                  | **KEEP**                  | Reuse across arrival/object interactions    |
| One responsive Info Panel         | **KEEP**                  | Covers broad first use                      |
| Constrained rich text             | **ADD**                   | Plain text too weak; HTML too broad         |
| Primary image                     | **KEEP**                  | High-value interpretation                   |
| Video/gallery                     | **DEFER depth**           | Useful, not needed first proof              |
| Arbitrary authored HTML/layout    | **REJECT**                | CMS/page-builder creep                      |
| `Activate`                        | **KEEP**                  | Unified pointer/touch/keyboard semantics    |
| `DestinationReached`              | **KEEP**                  | Natural causal composition                  |
| Guided occurrence context         | **ADD**                   | Repeated-stop rules                         |
| `ShowContent`                     | **KEEP**                  | Core                                        |
| `NavigateTo`                      | **KEEP**                  | Core                                        |
| `OpenUrl`                         | **KEEP**                  | Core external action                        |
| Multiple independent rules        | **ADD**                   | Allows safe composition                     |
| Ordered multi-action workflow     | **REJECT**                | Immediately creates execution semantics     |
| Narration                         | **DEFER one level**       | High value, meaningful subsystem            |
| `Highlight`                       | **DEFER one level**       | Useful low-state action                     |
| `Once` / `FirstVisit`             | **DEFER one level**       | Small but real session state                |
| Show/Hide object                  | **DEFER**                 | Visibility state + reset/a11y implications  |
| Generic conditions/variables      | **REJECT**                | Game/app-engine boundary                    |
| Node graph                        | **REJECT**                | No minimum problem demands it               |
| Accessible DOM companion          | **ADD mandatory**         | Canvas cannot be sole semantic interface    |
| Reduced-motion semantic parity    | **KEEP + strengthen**     | Same target, alternate presentation         |
| Preview/Publish same semantics    | **KEEP mandatory**        | Existing P22 architecture gives right base  |

### Smallest complete capability

```text
Experience
├─ Navigation
│  ├─ Destination
│  ├─ guided Stop occurrence
│  └─ Home / Next / Back / Destination navigation
│
├─ Content
│  └─ reusable Info Content
│     └─ constrained text + image + credit + link
│
└─ Interaction
   ├─ Activate
   ├─ DestinationReached
   ├─ ShowContent
   ├─ NavigateTo
   └─ OpenUrl

Visitor platform
├─ guided / free
├─ semantic DOM companion
├─ reduced motion
├─ keyboard + touch
└─ same Preview / Publish execution
```

This is enough for complete museum, portfolio, showroom and architecture experiences without becoming CMS, node editor, game engine, or second navigation system.

---

# 10. One-level-deeper candidates

|  Rank | Candidate                                 | Why high leverage                              | Main new complexity                              |
| ----: | ----------------------------------------- | ---------------------------------------------- | ------------------------------------------------ |
| **1** | Narration                                 | Museum/education value very high               | media lifecycle + transcripts + browser autoplay |
| **2** | Highlight                                 | Directs attention without mutating Scene truth | transient render state                           |
| **3** | `Once` / FirstVisit                       | Prevent repeated intro/prompt spam             | visitor-session state + reset/testing            |
| **4** | Video + small media gallery               | Product/portfolio interpretation               | media assets/player/accessibility                |
| **5** | Guided resume polish + visited indicators | Better detours/rejoin                          | session progress                                 |
| **6** | Deep links/shareable Destinations         | Strong web usefulness                          | URL/history semantics                            |
| **7** | Derived Spatial map/minimap               | Architecture/museum orientation                | post-P23 Spatial derivation                      |
| **8** | Camera Cue event binding                  | Powerful storytelling                          | depends on Camera cue feature actually existing  |

`Highlight` should be transient Experience/runtime presentation:

```text
Highlight SceneEntity X
```

not mutation of Scene material/visibility.

`Once` should initially mean visitor-session-only execution of one rule. No arbitrary condition syntax.

---

# 11. Questions that MUST wait for P23 F0 / accepted P24 minimum

These should not be answered in P25 schema today.

**POST-F0 / POST-P24 RECONCILIATION REQUIRED:**

| Question                                                          | Why wait                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Exact `ExperienceDocument` ownership                              | Product semantics now clear; persistence envelope still intentionally deferred |
| Exact Stop storage owner                                          | Current Camera Sequence has node links, not occurrence records                 |
| Exact Camera reference representation                             | P23 changes world/local semantics and Scene/Camera seams                       |
| Whether canonical Camera Sequence itself becomes occurrence-based | Camera-domain migration, not P25 shortcut                                      |
| Room Destination resolution                                       | Must not introduce implicit “first camera in room” heuristic                   |
| Exact Scene interactive-target reference API                      | P24 may change placement/entity seams                                          |
| Content/media durable representation                              | Shared asset/media path not fully settled                                      |
| Audio/video release pinning                                       | P22 existing resource contract must be extended intentionally                  |
| Exact Experience operation APIs                                   | Must reuse actual post-F0 mutation/history seams                               |
| Cross-domain atomic history behavior                              | Only design when first real operation requires it                              |
| Save/Load codec/version change                                    | Schema not ready to freeze                                                     |
| Experience Preview data extraction                                | Must preserve P22 cold/runtime isolation against final project model           |
| Publish validation reference closure                              | Depends on final Experience refs/assets                                        |

One fact can be ratified before those gates:

> A Stop may reference canonical Camera/Spatial meaning, but never own copied Camera/Spatial truth.

---

# 12. Acceptance narratives

## A. Museum artwork

Creator defines Piano Destination over canonical Piano view. Guided Stop 2 uses Piano with introductory Content. Visitor chooses **Next**, canonical Camera system moves there, then `DestinationReached` shows Piano Info Panel. Visitor closes it, activates Piano object, same `Activate` semantic opens deeper reusable Content. Attribution link is keyboard-accessible.

Visitor enables reduced motion. Returning Home then Next reaches exact same Piano Destination by cut/minimal transition. Content and event results unchanged.

Primitives:

```text
Destination
Stop
NavigateTo
DestinationReached
ShowContent
Activate
OpenUrl/link
Info Panel
reduced-motion parity
```

## B. Artist portfolio

Guide:

```text
Introduction
→ Sculpture A
→ Installation B
→ Contact
```

Visitor may ignore guide and select Installation B from Destination menu. Canonical navigation handles route. Activating sculpture opens description, one image and exhibition credit. Resume Tour returns to previous guided context without editing Sequence.

No page builder needed.

## C. Product showroom

Guide moves through Hero Product, Detail View and Accessories. Product itself is interactive:

```text
Activate Product
→ ShowContent
```

Info Panel holds product summary, image and **View specifications** external link.

No runtime material mutation, product-configurator variables, show/hide state or workflow engine required for first showroom proof.

## D. Architecture walkthrough

Destinations represent explicit authored views for Lobby, Kitchen, Courtyard and Bedroom. Menu lets visitor jump freely. Guided mode gives Home/Next/Back.

A keyboard/screen-reader visitor uses DOM destination list instead of WebGL camera gestures. `aria-current` indicates current location. Reduced-motion navigation cuts to same canonical camera target.

Layout geometry never becomes Experience truth.

## E. Educational repeated-place journey

Guide:

```text
Intro
→ Piano: Construction
→ Paris
→ Piano: Performance
→ Summary
```

Both Piano Stops resolve to same reusable Piano Destination.

First Piano occurrence shows construction Content. Second shows performance Content. Next/Back follow **Stop occurrence**, not unique Destination. Free menu contains one Piano place.

This narrative is the acceptance proof that P25 no longer assumes Destination and journey occurrence are identical.

---

# 13. Evidence table

| Claim                                                                         | Source                                    | Evidence type                      | Confidence | Museum implication                                                      |
| ----------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------- | ---------- | ----------------------------------------------------------------------- |
| Guided systems commonly model ordered Stops/places                            | StoryMaps, STQRY                          | Primary product docs               | **High**   | Add Stop/occurrence semantics                                           |
| One place/stop carries its own content                                        | StoryMaps                                 | Primary docs                       | **High**   | Occurrence-specific context valid                                       |
| Stops need not imply a second spatial graph                                   | STQRY/StoryMaps                           | Product pattern + Museum inference | **High**   | Keep canonical Camera authority                                         |
| A reusable target and guided step can have different identity                 | Shepherd `Step` + `attachTo`              | Open-source source                 | **High**   | Stable occurrence identity sound pattern                                |
| Current Museum Sequence order lives on Camera nodes                           | Museum `scene.ts`                         | Current code                       | **High**   | Repeat same node cannot cleanly become two contextual occurrences today |
| Current visitor flow walks unique linked node IDs                             | Museum runtime                            | Current code                       | **High**   | Stop representation needs reconciliation                                |
| Current visitor “visited” state is room-based                                 | Museum runtime                            | Current code                       | **High**   | Do not reuse it as Stop progress                                        |
| Current P22 uses one Camera route/motion system for public runtime            | P22 + Director                            | Repo plan/code                     | **High**   | Experience navigation must invoke, not replace it                       |
| Current visitor has no object Activate seam in `VisitorEntities`              | Museum code                               | Current code                       | **High**   | P25 must add visitor interaction semantics                              |
| Current visitor lacks semantic DOM Destination UI                             | Visitor surface                           | Current code                       | **High**   | Accessible DOM companion is real P25 work                               |
| One responsive Content card handles text/media/link well                      | Kuula                                     | Primary docs                       | **High**   | One Info Panel enough for minimum                                       |
| Rich storytelling does not require custom builder HTML/JS                     | StoryMaps                                 | Primary docs                       | **High**   | Reject arbitrary HTML in minimum                                        |
| Multiple actions quickly require ordering semantics                           | Figma                                     | Primary docs                       | **High**   | Prefer independent rules                                                |
| Complex action timing naturally creates timeline systems                      | Webflow                                   | Primary docs                       | **High**   | Reject waits/durations/workflow                                         |
| Location/Stop audio often interrupts or queues existing audio                 | STQRY                                     | Primary docs                       | **High**   | Narration needs lifecycle semantics                                     |
| Web audible autoplay cannot be relied on before user activation               | MDN                                       | Browser reference                  | **High**   | Audio must have explicit enable/play fallback                           |
| Pre-recorded audio-only needs transcript for WCAG A                           | W3C                                       | Standard guidance                  | **High**   | Narration requires transcript                                           |
| Immersive navigation should be device independent                             | W3C XAUR                                  | Accessibility guidance             | **High**   | One Activate + DOM companion                                            |
| Motion-sickness alternatives should exist                                     | W3C XAUR / MDN                            | Standards/reference                | **High**   | Same Destination, alternative transition                                |
| Fast traversal is not equivalent to eliminating problematic movement          | MDN reduced-motion guidance + Museum code | Reference + inference              | **High**   | Replace current 24× strategy with cut/replacement for P25 contract      |
| Current item/step can be programmatically indicated                           | WAI `aria-current`                        | Accessibility guidance             | **High**   | Accessible Destination/Stop progress                                    |
| Modal content requires focus entry/return discipline                          | ARIA APG                                  | Accessibility guidance             | **High**   | Info Panel focus platform-owned                                         |
| 24×24 CSS px is WCAG AA target floor; ~44 is strong touch default             | W3C + Apple                               | Standards/platform guidance        | **High**   | Platform owns target sizing                                             |
| New-tab links should warn and popup behavior needs activation                 | W3C + MDN                                 | Accessibility/browser docs         | **High**   | Constrain `OpenUrl` semantics                                           |
| Stable Stop identity specifically belongs in Camera vs Experience persistence | Museum architecture inference             | Architecture inference             | **Medium** | Must wait for reconciliation                                            |

---

# 14. Recommended next P25 research / reconciliation sequence

## Can do now

**E0 — Ratify semantic vocabulary**

Ratify product meaning only:

```text
Destination
Guided Stop / occurrence
Content
Interaction
visitor session state
```

State explicitly that Stop has no navigation graph authority.

**E1 — Ratify Destination/Stop boundary**

Acceptance stress fixture:

```text
Intro → Piano → Paris → Piano → Exit
```

Require two Piano contexts without duplicate Camera pose/path truth.

**E2 — Ratify Content + Info Panel envelope**

Close:

* constrained rich text;
* one platform presentation;
* image/credit/alt semantics;
* no arbitrary HTML/layout.

**E3 — Ratify bounded interaction grammar**

Close:

```text
Activate
DestinationReached

ShowContent
NavigateTo
OpenUrl

multiple independent rules
no ordered workflow
```

Also define semantic conflict classes at product level.

**E4 — Ratify accessibility platform contract**

Especially:

```text
DOM companion UI
keyboard/touch Activate equivalence
focus semantics
same Destination under reduced motion
author-required labels/alt/transcripts
```

**E5 — Place Narration**

Ratify it as first-depth concept, not generic `PlayAudio`, with no overlap by default and explicit visitor audio enable.

These decisions need no P23 transform schema.

## Requires P23 F0

Recheck:

* stable Camera node/reference identities after world-local migration;
* Room semantics relevant to Destination grouping;
* post-F0 Camera resolver;
* whether any Destination target form would accidentally encode old Room-local assumptions.

No P25 schema before this recheck.

## Requires accepted P24 minimum

Recheck:

* which Scene entity kinds can become `Activate` targets;
* canonical project media asset references;
* image/audio/video visitor resolution;
* normalized model/derived proxy semantics where authoring selection affects Experience;
* shared preview/public resource closure.

## Requires both

Only then design implementation-ready child slices:

```text
persistence ownership
→ exact schema / codecs
→ reference validation
→ Experience operations
→ authoring UI
→ visitor runtime integration
→ same Preview + Publish execution
→ accessibility acceptance
```

P25 should **not** create child implementation plans before those seams close, matching current tracker direction.

Final revised product boundary:

```text
Spatial
owns world + movement

Camera Sequence
owns guided traversal

Experience Destination
names reusable visitor meaning

Guided Stop
adds occurrence-specific journey context

Content
explains meaning

Interaction
binds small semantic events to small semantic actions

Visitor runtime
executes all of it through same canonical camera/runtime path
```

That is smallest version now supported by evidence. It fixes repeated-place journey hole while still refusing CMS, workflow engine, node graph, arbitrary scripting, duplicate Scene truth, and second Camera system.

[1]: https://doc.arcgis.com/en/arcgis-storymaps/author-and-share/add-guided-tours.htm?utm_source=chatgpt.com "Add and configure map tours | ArcGIS StoryMaps Help"
[2]: https://support.stqry.com/support/solutions/articles/153000136602-what-is-a-tour-?utm_source=chatgpt.com "What is a Tour? : STQRY Support Portal"
[3]: https://github.com/shipshapecode/shepherd/blob/main/shepherd.js/src/step.ts?utm_source=chatgpt.com "shepherd/shepherd.js/src/step.ts at main · shipshapecode/shepherd · GitHub"
[4]: https://kuula.co/help/interactive-cards?utm_source=chatgpt.com "Interactive Cards"
[5]: https://doc.arcgis.com/en/arcgis-storymaps/get-started/faq.htm?utm_source=chatgpt.com "Frequently asked questions | ArcGIS StoryMaps Help"
[6]: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/?utm_source=chatgpt.com "Dialog (Modal) Pattern | APG | WAI | W3C"
[7]: https://guide.stqry.com/support/solutions/articles/153000246011-frequently-asked-questions-faqs-?utm_source=chatgpt.com "Frequently Asked Questions About STQRY Guide : STQRY Guide"
[8]: https://support.voicemap.me/how-does-voicemap-use-my-location/?utm_source=chatgpt.com "How does VoiceMap use my location? | VoiceMap Help Center"
[9]: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay?utm_source=chatgpt.com "Autoplay guide for media and Web Audio APIs - Media | MDN"
[10]: https://www.w3.org/WAI/media/av/transcripts/?utm_source=chatgpt.com "Transcripts | Web Accessibility Initiative (WAI) | W3C"
[11]: https://help.figma.com/hc/en-us/articles/15253220891799-Multiple-actions-and-conditionals?utm_source=chatgpt.com "Multiple actions and conditionals – Figma Learn - Help Center"
[12]: https://help.webflow.com/hc/en-us/articles/42861689104531-Timeline-in-Interactions-with-GSAP?utm_source=chatgpt.com "Timeline in Interactions with GSAP – Webflow Help Center"
[13]: https://developer.mozilla.org/en-US/docs/Glossary/Transient_activation?utm_source=chatgpt.com "Transient activation - Glossary | MDN"
[14]: https://www.w3.org/WAI/WCAG21/Techniques/general/G201?utm_source=chatgpt.com "G201: Giving users advanced warning when opening a new window | WAI | W3C"
[15]: https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA26?utm_source=chatgpt.com "ARIA26: Using aria-current to identify the current item in a set | WAI | W3C"
[16]: https://www.w3.org/TR/xaur/?utm_source=chatgpt.com "XR Accessibility User Requirements"
[17]: https://www.w3.org/WAI/ARIA/apg/patterns/button/?utm_source=chatgpt.com "Button Pattern | APG | WAI | W3C"
[18]: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html?utm_source=chatgpt.com "Understanding Success Criterion 2.5.8: Target Size (Minimum) | WAI | W3C"
[19]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion?utm_source=chatgpt.com "prefers-reduced-motion CSS media feature - CSS | MDN"
[20]: https://kuula.co/help/hotspots?utm_source=chatgpt.com "Add interactive hotspots, connect photos, create Virtual Tours"
