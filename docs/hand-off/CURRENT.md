# Current handoff — live working-tree delta

Template per [`../README.md`](../README.md). Sliding window: immediate previous
slice plus one next action only.

## Working tree

- **P24 planning branch `codex/p24-r5-r7-maturity`**: [R5–R7 reconciliation](../plans/2026-09-10-P24-R5-R7-maturity-reconciliation.md) records current-code evidence, dispositions, bounded behavior and acceptance requirements. Documentation only; no product/schema/runtime changes. R8 presentation remainder is next on the P24 planning track; R9 minimum freeze and accepted-P23 implementation dependency remain open.

- **P23.1 implementation track is complete in `/Users/tony/Documents/Biskiq/p23` on `codex/p23-implementation`** (no commit): exact Junction X/Z, Wall length/angle/thickness, Add Vertex subdivision, bounded rectangle sizing, document-level object transforms, wall-first preview/save/compiler/Inspector seams, and 8 focused precision tests are in place. Full editor Vitest, editor/museum `svelte-check`, and both production builds are green.
- **P23 Foundation Gate F0 is CLOSED on `main` as of 2026-09-10**: PR #7 merged as `32b2e8f`. Stage-6 writer flip is `455f587`; cross-format transaction-invariant restoration is `93111a2`; final proof tightening is `79b3551`. `LAYOUT_MUTATION_POLICY['wall-first']` is `adapted`, its refusal reason is retired, and layout commits explicitly require begin format = live format = candidate format with all three adapted.
- **Stage-6 safety invariant is regression-pinned**: legacy→wall-first and wall-first→legacy mid-transaction swaps refuse and close the bracket; wall-first→wall-first commits normally using a real `project.layout` snapshot; adapted→unrecognized refuses; and a legacy begin/live host with a wall-first candidate snapshot refuses, directly pinning the candidate-format leg. `cancelLayoutTransaction`, `clearSharedHistory`, and `importDocument` clear the captured begin format so stale transaction state does not survive bracket/document boundaries.
- **F0 acceptance passed 2026-09-10 before the writer flip** (end-to-end: full Vitest gate + `layout-core`/`project-model` tsc + editor/museum `svelte-check` + agent-browser smoke on `/`, `/project/:id/spatial` incl. Plan/3D + Preview takeover/exit, `/museum`, `/museum/editor`; console shows only the known `cameraPlan` `ownership_invalid_mutation` warnings). The stage-6 branch subsequently recorded a green full gate, and the final proof-only commit had a green Vercel deployment before merge.
- **F0 review fixes committed 2026-09-09 on `main`** (`442f85a`, pre-flip must-fix + should-fix): scene `unrecognized` fail-closed + scene commit re-check with commit-swap tests (stage 1); sweep regression tests + directional-light omit fix + node-guard unification (stage-2 probe: claimed waypoint/anchor/keyframe hole did NOT reproduce — post-parse sweep already rejects); rotation-with-direction + survivor/reverse/edge subdivision + full-layout Save identity (stage 3); legacy composer-vs-composer parity + true-compat serialize identity (stage 4); connection-path adversarial passthrough + portal path unification + `faceKey` rejection field (stage 5); plan/code name-drift corrected. Historical note: at this commit all writes were still disabled; stage 6 later enabled wall-first writes via PR #7.
- **P23.0 F0 stage 5 committed 2026-09-09 on `main`** (`0d66aed` (named small items): standalone Scene import `importStandaloneSceneDocument` (world-local direct, legacy + explicit frame mapping converts once, missing/incomplete/invalid mappings reject by name); portal Save-blocker `validateWallFirstPortalRelations` wired into `validateWallFirstProject` as `nonadjacent_portal_relation` plus a non-blocking migration diagnostic for carried relations (door-only/distinct-shape rules stay codec-owned after a dead-code review); no-second-transform adversarial regression (legacy-layout + world-scene) through resolve plus both composers. Fixed en route: stage-3 portal round-trip fixture related independent rects through a non-shared wall, now births a shared-wall pair.
- **P23.0 F0 stage 4 committed 2026-09-09 on `main`** (`2c9b04d` (visitor parity + cold-load proofs): one shared `prepareCompatibleRuntime` adapter (`packages/project-model/src/compat-runtime.ts` + `createEmptyLayoutRoomRegistry`) now fronts both the Preview composer (`preview-coordinator.ts`) and the visitor cold path (`visitor-cold-runtime.ts`). Legacy render-model preflight preserved for legacy-compatible inputs. Fixed en route (P23.0b defect): `decodeProjectCompatible` threw uncaught on legacy scenes with dangling roomId refs during migration conversion, now fails closed to legacy-compatible with diagnostics.
- **P23.0 F0 stage 3 committed 2026-09-09 on `main`** (`e57b1c3`, test-only slice, no product code): P23.8 defaults/allocation/replay fixture suite against the stage-2 writers — `apps/editor/tests/lib/editor/p23-f0-stage3-writer-fixtures.test.ts` (18 tests: birth identity/defaults/canonical order/wall-order cycle-equivalence/partial-flip rejection/tiny birth; object preserve/dangling-reject/replay/input-immutability; subdivision integration birth→`planWallSplit`→1→1 with ID preserved + opening rebase + interior-split rejection + ID replay; portal perimeter-survive/unknown-relation-reject/born-relation Save round-trip; born-content Save byte-identity). One expectation corrected en route (boundary start offset rotates with input wall order; ID/name/wall-set stay canonical — test asserts cycle equivalence, no product change).
- **P23.0 F0 stage 2 committed 2026-09-09 on `main`** (`b5427d8`: canonical writers for the P23 minimum, all writes still disabled): authoring planners `planFirstEnclosureRoomCreation` + `planPartitionToBoundaryRoomBirth` over the P23.8 engine (`packages/layout-core/src/layout-wall-topology-ops.ts`), canonical wall-first Save writer (`packages/project-model/src/wall-first-project.ts`), package manifest `formatVersion: 2` (`PACKAGE_MANIFEST_FORMAT_VERSION`, old manifests stay importable). Stage status recorded in the P23.0 plan's F0 execution order addendum.
- Fixed en route (latent P23.0b defect): world-local Scene decode failed on every document with entities/navigation nodes — parser guards treated a legally absent `roomId` as failure and the canonicalizer re-serialized `roomId: undefined` keys. Guards are mode-aware now; present roomIds still reject (`room_id_forbidden_in_world_local`). `scene-codec/canonical.ts`, `parse-document.ts`, `parse-entities.ts`.

## Next action

- **Next:** owner review/rejoin of `codex/p23-implementation`, then P23.2 predictable Plan snapping and alignment. P24 planning may continue its targeted post-F0 recheck toward the R9 minimum freeze; P25 implementation remains blocked.

## Verification

- F0 acceptance 2026-09-10 on clean `main` (`442f85a`): Vitest 211 files / 2801 tests passed (+1 skipped file/suite, pre-existing), `layout-core` + `project-model` tsc clean, editor + museum svelte-check 0/0. F0-direct suites: stage-1 format-policy 12, stage-2 writers 26, stage-3 fixtures 21, stage-4 visitor-parity 14, stage-5 small-items 15. Agent-browser smoke (dev `:5173`): `/` entry, `/project/:id/spatial` (Plan SVG + 3D 1 canvas + hierarchy/inspector), Preview takeover + exit, `/museum` Chopin guided relic, `/museum/editor` frozen relic — console shows only known `cameraPlan` warnings.
- Stage-6 branch full gate (recorded before final proof-only commit): Vitest 211 files / 2801 tests (+1 skipped, pre-existing), `layout-core` + `project-model` tsc clean, editor + museum svelte-check 0/0. Final proof-only commit `79b3551` added candidate-format regression coverage and had a green Vercel deployment before merge.
- New coverage: `apps/editor/tests/lib/editor/p23-f0-stage3-writer-fixtures.test.ts` (18 tests — birth defaults/canonical allocation/cycle-equivalence/partial-flip + tiny-birth identity, object preserve/dangling-reject/exact-replay/input-immutability, subdivision birth→split→1→1 ID preservation + opening rebase + interior-split rejection + split ID replay, portal perimeter-survive/unknown-reject/born-relation round-trip, born-content Save byte-identity); stage-2 `p23-f0-stage2-writers.test.ts` (26 tests) still green.

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
