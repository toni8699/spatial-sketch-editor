# Current handoff — live working-tree delta

Template per [`../README.md`](../README.md). Sliding window: immediate previous
slice plus one next action only.

## Working tree

- P22 shipped 2026-09-08 on `main` as `f46e8f3` (public-route `untrack(disposeBundle)` fix, committed + pushed with owner permission; Vercel auto-deployed and fresh anonymous production proof passed). P22 plan archived to `docs/archive/plans/`; tracker collapsed, stub added.
- Uncommitted closeout docs (agent's, needs separate commit authorization): `docs/hand-off/CURRENT.md` (this file), `docs/plans/README.md`, `docs/README.md`, `docs/architecture.md` (merged around user's test-auth paragraph), `docs/components/persistence.md`, `docs/components/assets.md`, `docs/components/shell.md`, `docs/plans/model-assessment.md`, plus the archived P22 plan with its ship record.
- User-owned pre-existing dirty files remain untouched: `apps/editor/tests/README.md`, `docs/plans/2026-09-07-P23-layout-depth-minimum-build.md` (and the user's paragraph inside `docs/architecture.md`). Preserve them; do not blanket-stage.
- Production live state left active: project `project:02b951a3-5adc-4a38-a4e7-af76abdc5bc2` version 3, publication `b0f01de5-7d3a-4931-96ea-82a8ee40731f` revision 6, texture asset `7326b421-897a-4b21-9861-da29d922b3c2` (76,488-byte PNG), name `P22.5 Hosted Gate N+1 verified`.
- Immediate previous slice: **P22.5 (hosted acceptance); P22 is the just-shipped increment.**

## Next action

- P23 Layout Depth minimum useful Build set is the sole next action (brief registered at `docs/plans/2026-09-07-P23-layout-depth-minimum-build.md`, assumes P22 complete). No code yet; open it via the tracker when the owner schedules it.
- Do not commit the closeout docs above unless the user separately authorizes that commit (hard rule).

## Verification

- Final gate on deployable SHA `f46e8f3`: Vitest 194 files passed, 1 skipped; 2,570 tests passed, 1 skipped. Real local-Postgres API: 23 core + 10 publication + 6 test-auth (39 total, zero skipped).
- Checks clean: editor + museum `svelte-check` 0/0; API/camera-core/layout-core/project-model `tsc` clean. Root build, API build, editor Vercel build green.
- Boundary gates: preview surface 11 files/no leaks; public surface 2 files/no leaks; visitor bundle 3 server + 9 client entries.
- Production (fresh anonymous sessions, deployed first-party `/api` proxy → Render/Postgres/R2): `/p/b0f01de5…` settles on the version-3 titled canvas with exactly one metadata + one texture-content request, zero-camera orbit guidance, no console/WebGL errors; mobile 375×667 + reduced motion repeat green. Anonymous boundary: metadata 200, member asset 200 (76,488 bytes), random-asset 404, unknown-publication 404, `POST /test-auth/session` 404 with editor Origin (403 CSRF guard without).
- Deployed SHA `f46e8f3` proven by behavior (fresh sessions settle post-push; pre-fix bundle looped). `/museum`, `/museum/editor`, guest Preview/exit, Plan↔3D, and unknown-publication unavailable state smoke-tested on the prior SHA; no regressions introduced by the two-file fix (route effect + regression test only).

## Known bugs / deferred

- Visitor preview with unlit content renders near-black (not a bug — the scene
  has no lighting and the lighting system is lackluster by design at this
  tier; orbit + lit geometry verified working). Lighting expands in P23/P24.
- Camera-connections `ul[role=tree]` holds a bare `li.unused-row` (axe critical + serious pair). Minor; suggested ride-along.
- P3.4/P3.5 remain undone/not accepted and low-priority deferred.
- Direct 3D wall/interior-anchor picks remain deferred.
- Layout hover feed and anchor-helper octahedra remain disconnected.
- Drafted-room `focusRoom` retains a latent Paris-default path outside the fixed editor flow.
- Runtime logs retain known Svelte `ownership_invalid_mutation` warnings for `cameraPlan` and `layoutInteraction`; static checking is clean.
- A browser axe audit still reports generic editor color-contrast review items in empty/status text and SVG labels; these are outside the closed P3B gate.
- Deployed Render/Neon-topology smoke is deferred to the publish tier or an owner-scheduled pass (local P19/P20 smokes passed 2026-09-03/04).

## Traps

- Track-vs-raised fills measure 1.05–1.12 (borders carry the edge); Slice 4 holds the Slice 1.1 calibration by decision — no new track hexes without owner eye-test.
- Both Plan workspaces stay mounted. Hidden cells retain `inert` and `plan-cell--hidden`; shared `view` remains one Plan|3D axis.
- Camera 3D rig unmount during a main-editor Camera Plan switch must preserve the paused preview session. Leaving the Camera workspace stops it through `setWorkspace`; the relic retains stop-on-unmount/stop-on-Escape behavior.
- P12 ordinary selection never enters Camera/Edge scope. Only explicit preview actions do; sequenced-node selection in Sequence seeks + pauses.
- Camera timeline edge keys include direction; preview-route memo keys on `preview.runId`, never cloned route identity.
- Camera means guided PerspectiveCamera navigation, never webcam.
- agent-browser `press` keys land unreliably unless the target holds focus; window-dispatched `KeyboardEvent` via `eval` exercises the same handler path deterministically. Never hold CDP mouse-down across shell calls — it blocks the channel until `up`.
- Public `/p/:publicationId` load `$effect` must not track `bundle`: dispose it via `untrack(disposeBundle)` — assigning the loaded bundle retriggers a tracking effect into an infinite refetch/WebGL loop (P22.5 lesson, regression-pinned).
- Direct curl POSTs without the editor `Origin` header get 403 from the API CSRF guard before routing; send `Origin: https://spatial-sketch-editor.vercel.app` when probing production route existence (test-auth 404 check).

## Non-negotiables

- `/museum` is visitor-only and its chunks contain no editor/layout code. Editor ships at `/`, `/editor`, and frozen relic `/museum/editor`.
- No commits unless the user asks.
- One nav + one motion: `@portfolio/camera-core` owns `camera-route.ts` + `camera-motion.ts` only.
- Svelte 5 runes / Threlte; no second selection, history, graph, motion, geometry, or transform system.
