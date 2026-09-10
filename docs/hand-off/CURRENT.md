# Current handoff — live working-tree delta

Template per [`../README.md`](../README.md). Sliding window: immediate previous
slice plus one next action only.

## Working tree

- **P23.0 F0 stage 2 committed 2026-09-09 on `main`** (canonical writers for the P23 minimum, all writes still disabled): authoring planners `planFirstEnclosureRoomCreation` + `planPartitionToBoundaryRoomBirth` over the P23.8 engine (`packages/layout-core/src/layout-wall-topology-ops.ts`), canonical wall-first Save writer (`packages/project-model/src/wall-first-project.ts`), package manifest `formatVersion: 2` (`PACKAGE_MANIFEST_FORMAT_VERSION`, old manifests stay importable). Stage status recorded in the P23.0 plan's F0 execution order addendum.
- Fixed en route (latent P23.0b defect): world-local Scene decode failed on every document with entities/navigation nodes — parser guards treated a legally absent `roomId` as failure and the canonicalizer re-serialized `roomId: undefined` keys. Guards are mode-aware now; present roomIds still reject (`room_id_forbidden_in_world_local`). `scene-codec/canonical.ts`, `parse-document.ts`, `parse-entities.ts`.
- Immediate previous slice: **P23.0 F0 stage 1** (mutator inventory + dual-dispatch guards, `Stage 1 wriing p23` / `Stage 1 p23 nits`), itself after P24 reconciliation work.
- User's parallel commits (P24 reconciliation, R186 research) interleaved on `main`; no overlap with stage-2 files.
- Per-stage commits now authorized for the remaining pre-F0 stages (user instruction: "After each stage, commit"); still no pushes.

## Next action

- **P23.0 F0 stage 3**: P23.8 defaults/allocation/replay fixture suite against the stage-2 writers (subdivision / Room identity / portal fixtures from the P23.8 plan), then gate + commit.
- Then stage 4 (visitor parity + cold-load byte-identity proofs), stage 5 (standalone Scene import frame mapping, portal Save-blocker, no-second-transform regression) — each committed. **Stop at the F0 boundary; do not run the stage-6 flip / enable new-schema writes.**

## Verification

- Stage-2 full gate on the dirty tree immediately before commit: Vitest 208 files / 2745 tests passed (+1 skipped), `layout-core` + `project-model` tsc clean, editor + museum svelte-check 0/0.
- New coverage: `apps/editor/tests/lib/editor/p23-f0-stage2-writers.test.ts` (26 tests — deterministic IDs/names, 0.1 m defaults, undo/redo exact replay, custom allocator, rejection taxonomy, Save round-trip through `decodeProjectCompatible`, legacy-payload rejection by name, manifest versioning, wall-first mutation gate), `package-format.test.ts` manifest key pin, codec suites green after the world-local fix.

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
- World-local Scene documents must never carry `roomId` anywhere (entities, nodes, clusters, anchors, waypoints, view keys); the codec rejects a *present* key by name but treats an *absent* key as legal — don't "restore" the old `roomId === undefined` guards.

## Non-negotiables

- `/museum` is visitor-only and its chunks contain no editor/layout code. Editor ships at `/`, `/editor`, and frozen relic `/museum/editor`.
- No commits unless the user asks.
- One nav + one motion: `@portfolio/camera-core` owns `camera-route.ts` + `camera-motion.ts` only.
- Svelte 5 runes / Threlte; no second selection, history, graph, motion, geometry, or transform system.
