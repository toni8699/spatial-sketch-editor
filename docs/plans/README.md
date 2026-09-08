# Plan tracker — single source of truth for plan status

**Created:** 2026-08-18 · **Pruned:** 2026-09-05 (owner decision: shipped
history lives on disk under `docs/archive/plans/`, not in this file).
**Status enum:** `proposed | approved | in-progress | shipped | archived`.
The tracker is authoritative when a plan doc's `**Status:**` drifts.

## Rules

1. **One flat namespace.** New plans are
   `docs/plans/YYYY-MM-DD-P<number>-<slug>.md` — the P-number is assigned on
   registration and written into the filename (e.g.
   `2026-08-18-P1-camera-overhaul.md`). No letter codes beyond the P-number.
2. **Numbers live in filenames and this tracker.** Sequential numbers
   (`P1`, `P2`, …) are assigned on registration and carried in the filename;
   this tracker is the register that owns them (status, depends-on, order)
   and never renumbers files. The renewal that created the tracker is an
   **unnumbered process row** (a tracker cannot number its own bootstrap).
3. **Dependencies by tracker number**, never by letter family.
4. **Archive on close.** When a plan ships, its doc moves to
   `docs/archive/plans/` and this tracker lists stubs for the **5 most recent
   archived artifacts only** (see `Archived plans`). Older history stays on
   disk, unlisted (owner decision 2026-09-05).
5. **Re-registration, not re-lettering.** Approved-but-unscheduled work keeps
   its content and gains a tracker number; that content lives **folded into
   the plan's umbrella doc**. Only shipped/superseded docs archive.
6. Execution order is **pinned in the table's depends-on column**, not implied
   by the numbers (registration order ≠ priority).
7. **No narrative in this tracker.** Rows and stubs stay one line each;
   shipped detail lives in the plan doc (archived on close), never here.
8. **Collapse on ship.** Archiving a doc and collapsing its Active row happen
   in the same edit — shipped rows never linger in the table.

## Model routing

Per-increment difficulty (1–100) and model routing live in the living
assessment doc — [`model-assessment.md`](model-assessment.md) — not in this
tracker. Update it as increments ship.

Policy rules:

- **DeepSeek V4 Flash substitution (2026-08-20):** Luna max ≈ DeepSeek V4
  Flash. Any increment rated at **Luna difficulty (any effort)** routes to
  **DeepSeek V4 Flash** — the Luna effort is retained as the capability
  reference, not replaced. Sol tiers unchanged.
- **Never route to Terra (all efforts) or Sol low** — dominated points on the
  cost/intelligence frontier.
- **Escalate by evidence, not habit:** start at the cheapest tier clearing the
  required index; escalate one tier on a demonstrated capability failure,
  sending the stronger model the original failure state (not a summary).
- **Margin** = chosen tier index − required index. Margin 0 → escalate on
  first failure; don't pre-pay.
- Adjacent tiers differ 2–8% capability for 1.3–2.6× per-task cost — pay the
  jump only when the threshold matters.

## Active (live work only)

| # | Plan | Status | Depends on | Doc |
|---|------|--------|------------|-----|
| P13 | Sequence stop-at-node playback | proposed — nice-to-have, unscheduled (owner 2026-08-27) | P12 | [2026-08-27-P13-stop-at-node-playback.md](2026-08-27-P13-stop-at-node-playback.md) |
| P22 | Basic Publish + visitor runtime | proposed — brief written assuming P21 complete (owner 2026-09-07) | P21 | [plan](2026-09-07-P22-basic-publish-visitor-runtime.md) |
| P23 | Layout Depth — minimum useful Build set | proposed — brief written assuming P22 complete (owner 2026-09-07) | P22 | [plan](2026-09-07-P23-layout-depth-minimum-build.md) |
| P24 | Scene / Staging Depth umbrella — P24A asset supply + P24B rich 3D staging | proposed — umbrella registered; detailed subtrack briefs TBD Phase 2/4 research (owner 2026-09-08) | P23 | [plan](2026-09-08-P24-scene-staging-depth-umbrella.md) |
| — | Branch rejoin — experiment, no schedule | proposed | P8 conceptually | [2026-08-21-branch-rejoin-experiment.md](2026-08-21-branch-rejoin-experiment.md) |
| … | future work re-registers here | | | |

**Pending archival (live files for shipped work — not tracked rows; owner follow-up):**

- Done 2026-09-05: P7 umbrella + P7.6 annex + P8 umbrella moved to
  `docs/archive/plans/` (moved as a set — the annex link at umbrella `:1179`
  is relative and survives); byte-identical P11.2 annex deleted (archive holds
  the copy); 0-byte P12.2 live husk deleted (archive holds the content).
- Reconcile-then-delete (live copy has **diverged** from the archived copy —
  diff before dropping either side): `2026-08-18-P1-camera-overhaul.md`.
- Done 2026-09-05: `hand-off/designer-context-packet.md` moved to
  `docs/archive/designer-context-packet-2026-09-03.md` (one-off 2026-09-03
  packet; its output already landed as the P21.5 brief; `hand-off/` holds
  `CURRENT.md` only per the folder map).
- Done 2026-09-05: superseded `Design-specs/Camera-plan-objects-brief.md`
  moved to `docs/archive/plans/`, stub left behind pointing at frozen
  `Camera-layout-design.md`.
- Done 2026-09-08: P19 umbrella + P19.4 annex, P20 umbrella + S2/S3/S4 briefs,
  and the P21 set (umbrella + P21.4 + P21.5 + P21.6 + slice-2B annex) moved to
  `docs/archive/plans/` as sets at P21 closeout (cross-links survive — each
  set's relative links stay inside the set, same as the P7 precedent).

## Gate status

Ship narrative for P1–P21 (execution order, scope decisions, the P12/P3B hard
gate) now lives in the archived docs, not here.

- Next: P21 shipped 2026-09-08 (final acceptance gate passed — six-reference
  visual comparison + axe/contrast sweep + Slice C focus/DPR rows, full Vitest
  + `check` + `build` + bundle gates green); next is P22 implementation.
  P22 brief is registered under the owner's P21-complete planning assumption.
- Long-term tiers renumbered 2026-09-05 (owner): P23 Layout Depth, P24
  Scene/Staging Depth, P25 Experience Foundation, P26+ platform expansion;
  typed DB is conditional infrastructure, not a tier. Owner reconciliation
  2026-09-06: P23/P24 are staged (minimum useful slices first, optional
  depth tails later); P25 may follow the minima before the tails; a bounded
  agent/reuse proof follows the first complete visitor-authoring slice. P24
  umbrella registered 2026-09-08 with internal P24A asset-supply/canonical-
  ingest and P24B rich-3D-staging subtracks; detailed contracts await Phase
  2/4 research. See Long-term roadmap.
- Deferred / non-blocking: P3B.7b (incl. the P3.4/P3.5 acceptance tail).
- Proposed / unscheduled: P13, branch rejoin.
- Shipped baseline: P12 + core P3B gate 2026-08-28; P14–P18 extraction slice;
  P19 live smoke 2026-09-03; P20 local-vs-R2 smoke 2026-09-04
  (production-topology smoke deferred); P21 acceptance gate 2026-09-08.

## Archived plans (recent 5 only)

- `archived → [2026-09-04-P21-unified-project-shell-spatial-reconciliation.md](../archive/plans/2026-09-04-P21-unified-project-shell-spatial-reconciliation.md)` (shipped 2026-09-08 — P21.1–P21.6 + final acceptance gate; set includes P21.4, P21.5, P21.6, slice-2B annex)
- `archived → [2026-08-19-P20-Project-assets-registry-R2.md](../archive/plans/2026-08-19-P20-Project-assets-registry-R2.md)` (shipped 2026-09-04 — local live smoke vs real R2; set includes S2/S3/S4 briefs)
- `archived → [2026-08-30-P19-project-persistence.md](../archive/plans/2026-08-30-P19-project-persistence.md)` (shipped 2026-09-03 — live smoke passed; set includes P19.4 annex)
- `archived → [2026-09-06-scope-decision-roadmap-reconciliation.md](../archive/plans/2026-09-06-scope-decision-roadmap-reconciliation.md)` (scope decision — audit-review roadmap reconciliation: broad category, staged P23/P24, narrow P25 after minima, early bounded agent/reuse proof; ratified 2026-09-06)
- `archived → [2026-08-31-scope-decision-experience-interaction-boundary.md](../archive/plans/2026-08-31-scope-decision-experience-interaction-boundary.md)` (scope decision — Experience/Interaction authoring boundary; ratified 2026-08-31)

Older history — P14 and earlier, the letter-era A–H tracks, prior scope
decisions — lives on disk under `docs/archive/plans/` (renewal era) and
`docs/archive/plans/pre-h1-letters/` (letter era), unlisted by owner decision
2026-09-05. When a plan ships, its stub enters this list and the oldest stub
drops off (Rule 4).

## Long-term roadmap (registered plans above; future tiers are direction only)

Ratified 2026-08-31 with the north-star amendment: the project shell has two
primary creative modes — **Spatial** (the current editor) and **Experience**
(future) — plus project-level **Assets** and **Publish** surfaces, all
operating on one portable project truth. Direction lives in
[`../north-star.md`](../north-star.md) and its final conceptual hierarchy;
this section records the sequencing tiers. The Active table owns registered
P-numbers; future numbered tiers below are next-free-number reservations
(direction only) that become registered only when their plan docs are filed
(owner roadmap revised 2026-09-03; tiers renumbered 2026-09-05 — authoring
depth owns the P23/P24 slots, Experience moved to P25, typed DB demoted to
conditional infrastructure):

- **Now — Design track in parallel** (no P-number; design only — no major
  implementation yet): product flow / IA / shell / Hub / editor UX concepts
  running alongside the implementation tiers. Concepts and specs land in
  [`../Design-specs`](../Design-specs/); nothing commits to implementation
  until its plan doc is filed.
- **P20 — Project Asset Registry + R2.** Shipped 2026-09-04 (local live smoke
  vs real R2 passed; production-topology smoke deferred).
- **P21 — Product shell + Project Hub + core editor UX polish.** Shipped
  2026-09-08 (P21.1–P21.6 + final acceptance gate; see the archive).
- **P22 — Basic Publish + visitor runtime.** Registered above. Publish an owned project, resolve
  project assets, hosted visitor-safe output, and basic preview/publish
  status. Brief written assuming P21 complete (owner 2026-09-07); implementation
  depends on P21 closeout. Strategic rationale: P22 establishes the
  reusable execution target for every human- or agent-authored project
  (canonical project → deterministic asset resolution → cold visitor-safe
  runtime → published version → URL) while protecting visitor/editor
  isolation. The eventual proof is a cold boot in a fresh browser without
  `EditorApp`, editor stores, selection, history, gizmos, or editor-only
  asset setup. No Experience authoring, no agent API, no general Assets
  workspace, no collaboration, no generic SDK.
- **P23 — Layout Depth family (staged).** Minimum useful Build plan registered
  above assuming P22 complete (owner 2026-09-07). First the minimum useful Build
  set: numeric placement/dimensions, stronger snapping, alignment, better
  openings/doors/windows, duplicate/repeat of supported structure, simple
  reusable architectural primitives. Optional depth tail (stairs, railings,
  richer parametric components, curved-wall tooling, profile/extrude, sweep,
  revolve, roof helpers, general constraint sophistication) is
  demand/evidence-gated and registered later — never a prerequisite for
  Experience. Everything extends `LayoutDocument` →
  `compileLayoutGeometry()` → Plan + 3D; no second geometry path. Stays
  `LayoutDocument`-owned — never promoted into Scene merely because it
  renders 3D. Kept separate from P24 because Layout and Scene have different
  document ownership and implementation risk. P23 expands the **Build
  vocabulary** (semantic architecture an agent can request directly instead
  of reconstructing geometry/code). Its future plan requires an
  operation-first review per capability: durable data change, owning
  document, deterministic operation, validation/preconditions, one history
  transaction, Plan+3D consumption, headless invocability — no premature
  universal command framework.
- **P24 — Scene / Staging Depth umbrella (registered, staged).** The umbrella
  is registered above and split internally into **P24A — Asset Supply +
  Canonical Ingest** and **P24B — Rich 3D Scene / Staging Editor**. P24A is
  informed primarily by Phase 2 research and owns the bounded starter supply
  and normalization side: reusable models, PBR materials/textures, HDRIs,
  provenance/license metadata, web-ready derivatives, dimensions/placement
  metadata, thumbnails and Plan representation where eligible, all converging
  on the existing project asset registry rather than a new Scene-only store.
  P24B is informed primarily by Phase 4 research and owns the authoring side:
  asset place/replace, strong transforms, duplicate, multi-select where
  justified, align/distribute, floor/wall/support-aware placement, material
  assignment/editing, authored Scene lighting, environment/HDRI authoring,
  one useful lighting/environment setup, and bounded 3D-editor polish. The
  exact minimum, sequencing/parallelism and acceptance contracts are **TBD
  until the owner supplies Phase 2 + Phase 4 research**; directional bullets
  are not implementation tickets. Material/texture/HDRI assets may originate
  in P24A while assignment/editing/light/environment operations belong to
  P24B. Both preserve one project asset registry, `SceneDocument` ownership,
  room-local transforms, canonical selection/history, existing gizmo/transform
  authority, Threlte patterns and visitor/editor isolation. P25 waits only for
  the accepted useful minimum from both subtracks, never for catalogue/DCC
  depth tails. See [P24 umbrella](2026-09-08-P24-scene-staging-depth-umbrella.md).
- **P25 — Experience foundation (narrow, after P23/P24 minima).** Navigation
  · Content · Interactions, referencing existing Spatial / camera / assets
  work. Begins once the P23/P24 minimum useful slices exist, before their
  optional depth tails: first prove one complete visitor journey
  (destination + visitor navigation + contextual content + small semantic
  trigger/action set, e.g. reach-camera → show info, click → show/hide,
  click → link, nav item → spatial destination) with visitor-safe
  motion/accessibility behavior — not a general app builder. Its `Event →
  Target → Action` model composes existing project meaning rather than
  compensating for missing Spatial capabilities. No schema now (see
  Constraints). Direction only; the long-term Experience bullet below holds
  the remaining detail.
- **Bounded agent/reuse proof (after first complete visitor-authoring
  slice, before broad expansion).** Test whether a strong agent can inspect,
  semantically edit, stage, author camera/experience changes, validate,
  preview, publish, and revise through the same canonical behavior as human
  authoring. Small useful operation set only; no custom planner, chat UI,
  generic agent framework, four transports, or large MCP surface. Transport
  stays replaceable per client need. Registered as its own brief when due;
  no P-number is consumed by this direction entry.
- **P26+ — Evidence-led platform expansion.** Later expansion arrives as
  several separately registered slices rather than one milestone, scheduled
  only against measured reuse/delivery/adoption needs: richer P23/P24/P25
  depth tails, templates / camera kits / provider adapters, richer asset
  workflows / My Assets, collaboration / teams, richer Publish / domains /
  embeds, runtime SDK / headless runtime. No permanent P-numbers now —
  direction until individual plan docs are filed, starting at P26.
- **Typed DB layer — conditional infrastructure, not a numbered milestone**
  (owner decision 2026-09-05, demoted from the former P23). A typed database
  layer (Drizzle/Kysely-style schema-owned types, typed query access) is
  adopted only when code pressure on the raw-parameterized-SQL surface from
  P19–P22 proves it — as a small technical slice inside or before a later
  tier, never as a product milestone owning a P-number. The P19/P20 no-ORM
  pins hold until then.
- **Cross-cutting planning rules (apply from P23 authoring work):**
  operation-first — UI is one client of domain behavior: separate semantic
  intent → validation → deterministic mutation → transaction/history →
  rendering from button/toolbar/gesture/Inspector presentation, extracting
  only the abstraction current code pressure justifies (see north-star
  Shared authoring operations). Validation/observability — establish
  domain-level checks incrementally as primitives grow (broken refs,
  constraint validity, room membership, route integrity, shot
  visibility/clipping, perf signals); structured facts first, render
  inspection as complement, no giant validator subsystem now.

- **Current / near-term platform work** (grounded in active rows): core
  extraction / app boundaries (P15–P17 shipped), backend provisioning (P18
  shipped), project Save/Load + first Google OIDC + app-owned secure-session
  integration + single-user ownership (P19 shipped 2026-09-03 — live smoke
  passed), then the numbered tier sequence above:
  R2-backed project assets with Spatial integration (P20, shipped 2026-09-04 —
  local live smoke vs real R2; production-topology smoke deferred), the
  product shell + Project Hub + editor UX polish (P21, shipped 2026-09-08 —
  P21.1–P21.6 plus the P21.5 presentation-only polish pass, closed by the
  six-reference + axe/contrast acceptance gate), the basic
  publish/visitor-runtime boundary (P22 — the first complete product loop:
  author → preview → publish → visitor sees it, and an early stress test of
  the visitor/editor isolation boundary), then minimum useful authoring
  slices split by document ownership (P23 Layout Depth minimum, P24 Scene /
  Staging minimum split internally into P24A asset supply/ingest + P24B rich
  3D staging), the narrow Experience foundation (P25), a bounded agent/reuse
  proof, then evidence-led depth tails and expansion (P26+). The design
  track runs in parallel from Now. Auth UX/hardening and richer permissions
  ride with the P26+ collaborative tier, not P19/P20.
- **Medium-term product infrastructure** (possible direction, unscheduled):
  hosted project loading and published project versions ride with P22;
  portable project/export hardening, project asset management, and generic
  visitor/player extraction when genuinely needed.
- **Long-term Experience work** (unscheduled beyond the P25 foundation):
  Experience mode shell, `ExperienceDocument` design, visitor menu authoring,
  destination bindings, contextual titles/info cards, visitor preferences,
  reduced-motion behavior, the Experience asset picker, the developer runtime
  SDK, headless runtime, and community/gallery surfaces. Experience is
  composed of **Navigation · Content · Interactions**; Interactions are an
  authoring lens within Experience (an `Event → Target → Action` semantic
  model), never a separate mode — ratified 2026-08-31
  ([scope decision](../archive/plans/2026-08-31-scope-decision-experience-interaction-boundary.md)).

Constraints: no Experience implementation tickets are created now, and
Experience work must not displace persistence or Spatial completion.
`ExperienceDocument` gets no codecs, migrations, or backend endpoints. P19 includes the first
Google OIDC (Authorization Code + PKCE) + app-owned secure-session
integration and single-user ownership required for Save/Load; broader auth
UX/hardening and richer permissions remain later.
P19 has no Experience schema and no R2.

P19–P22 stay raw parameterized SQL: the no-ORM pins in the P19/P20 plans are
scope-limited to those tiers and are revisited only when code pressure on
that surface justifies a typed layer — conditional infrastructure (owner
decision 2026-09-05), never a numbered milestone. P21/P22 hold no
Experience authoring or Experience schema; Experience schema remains
unregistered until the P25 brief, and P25 may follow the accepted minimum
P23/P24 slices without waiting for their optional depth tails. No
Experience implementation tickets or codecs are created by roadmap direction
alone.