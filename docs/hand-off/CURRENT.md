# Current handoff — live working-tree delta

Template per [`../README.md`](../README.md). Sliding window: immediate previous
slice plus one next action only.

## Working tree

- P21 shipped 2026-09-08 (closed at `7fece5e`); prior CURRENT dirty claim resolved — P21.6 + gate fix are committed, no source changes pending.
- Uncommitted docs (P22 approval): tracker P22 → approved, P22 plan → approved with P22.1→P22.5 sequential, `model-assessment.md` P22.1–P22.5 rows (80/high, 78/high, 74/med, 68/med, 64/med).
- P22.1 shipped in review (committed `1c8caaf` on top of first-slice `2fcb899`): cold runtime + asset seam with retention proof (append-only snapshot + catalogue self-containment + URI-guard parity + built-output check), single-remap model gate, key-only scope releases; full suite 2529 green at close.
- P22.2 complete (uncommitted): release persistence + API — migration 003 (`publications` + `releases`), revision OCC (ABA-observable, idempotent no-ops, lost-race 409), R2 stream-verify outside the SQL txn, 5 endpoints; canonical shipped-static registry now in `@portfolio/project-model` for server sharing; 10 real-Postgres tests, full API suite 33 green, test DB left clean.
- P22.3 complete (committed `4718c78` + review follow-up, uncommitted): public route — `/p/:publicationId` cold bootstrap (`public-release-client.ts`: anonymous release fetch + version-qualified P20 bytes with MIME/size/magic verification + `composeColdReleaseBundle`) + public chrome (`VisitorPreviewSurface` `public` mode: released-name pill, no draft banner/exit; route header/focus help, reduced-motion, keyed `publicationId@v` runtime with abort/dispose cleanup); new `public-surface-boundary` build plugin + `verify-public-surface.mjs`; 18 Vitest (loader matrix incl. 2-node Sequence tour w/ view key through the public loader + reduced-motion runtime/wiring + closure fixture + plugin); full editor suite 2547 green, `check` clean, editor `build` green with both boundary plugins, route + shared visitor chunks grep-clean of editor tokens.
- Bundle-gate reference reconciled: `verify:visitor-bundle` lives in the museum workspace (`npm run verify:visitor-bundle -w @portfolio/museum`, green); the editor side is `scripts/verify-preview-surface.mjs` + `scripts/verify-public-surface.mjs` + both build-time boundary plugins (green). No root-level script; P22.5 gate should invoke both workspace paths.
- Owner rulings carry over: visitor-preview black first frame is unlit content, not a bug (lighting expands in P23/P24).

- P22.4 in progress (uncommitted): publish surface — owner client + revision-aware author UI at `/project/:projectId/publish` (same-session, explicit saved-version action).
- Immediate previous slice: **P22.3 (public route).**

## Next action

- Implement [P22.4](../plans/2026-09-07-P22-basic-publish-visitor-runtime.md) (Publish surface) — same-session author UI with explicit saved-version action + revision-aware status; tracker is status authority.

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
