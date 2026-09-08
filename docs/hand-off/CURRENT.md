# Current handoff — live working-tree delta

Template per [`../README.md`](../README.md). Sliding window: immediate previous
slice plus one next action only.

## Working tree

- P21 shipped 2026-09-08 — P21.1–P21.6 + final acceptance gate passed (browser evidence below); tracker collapsed, P19/P20/P21 doc sets archived per Rule 4.
- Uncommitted P21.6 implementation (source + `p21.6-slice-b/c` suites + `camera-tour.md`/`shell.md` contract pins) remains in the tree: 3D camera viz (palette tokens, nub retire, cinematic frustum, node/path unification) + focus mode (session L/R booleans, grid collapse, Zone C + View-menu + `\` + hint, inert + focus restore, drag-deferral, observer-relative aspect).
- Gate fix (uncommitted, 1 char): `editor-store.svelte.ts` carried a duplicated `}` closing the class early (stray from the scrub-clear edit) — esbuild refused the module and the app could not load. Removed; parse + full battery green after.
- Owner rulings recorded: visitor-preview black first frame is unlit content, not a bug (lighting expands in P23/P24); all other gate findings minor.

- Immediate previous slice: **P21.6 Slices A+B+C implementation + review rounds
  (2026-09-07).** P20 smoke + `RETURNING` fix (2026-09-04) is the prior baseline.

## Next action

- Implement [P22](../plans/2026-09-07-P22-basic-publish-visitor-runtime.md) (Basic Publish + visitor runtime) — brief registered under the P21-complete assumption; tracker pointer is the status authority.

## Verification

- Final acceptance gate 2026-09-08 (agent-browser vs local dev, 24 evidence PNGs): six-reference composition match (Layout / Arrange / Scene 3D / Camera Plan / Camera 3D / Preview takeover); authored room + 2-node flow exercised place → connect → sequence → paused preview; focus under paused preview + at DPR 2 aligned; `\` both ways; Theme porcelain keeps identical camera viz; scrub seeks; preview exit restores chrome; guest project survives reload; Tab order trap-free; reduced-motion boots clean.
- Axe sweep (CDN axe-core 4.10): 5 groups, all pre-existing/deferred — tree `ul[role=tree]` bare-`li` pair, generic-`div` aria-label on viewport, status-hint contrast (known P3B-excluded bucket), missing h1.
- Full Vitest: 189 files passed, 1 skipped; 2,514 tests passed, 1 skipped.
- `npm run check`: 0 errors / 0 warnings (editor + museum). Camera-core / layout-core / project-model checks unchanged.
- `npm run build`: passed for Editor and Museum (`adapter-vercel`). Known unused-import and chunk-size warnings remain.
- `verify-preview-surface`: passed (7 visitor files, no static leaks). `verify:visitor-bundle`: passed (3 server, 9 client entries).
- Mid-drag `\` deferral was inconclusive in-browser (CDP held-button blocks the channel; grabs unverifiable) — covered headless by the 19-test Slice C suite instead.

## Known bugs / deferred

- Visitor preview with unlit content renders near-black (not a bug — the scene
  has no lighting and the lighting system is lackluster by design at this
  tier; orbit + lit geometry verified working). Lighting expands in P23/P24.
- Camera-connections `ul[role=tree]` holds a bare `li.unused-row` (axe critical + serious pair). Minor; suggested P22 ride-along.
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

## Non-negotiables

- `/museum` is visitor-only and its chunks contain no editor/layout code. Editor ships at `/`, `/editor`, and frozen relic `/museum/editor`.
- No commits unless the user asks.
- One nav + one motion: `@portfolio/camera-core` owns `camera-route.ts` + `camera-motion.ts` only.
- Svelte 5 runes / Threlte; no second selection, history, graph, motion, geometry, or transform system.
