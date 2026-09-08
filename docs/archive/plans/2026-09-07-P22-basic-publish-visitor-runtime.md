# P22 — Basic Publish + visitor runtime

**Created:** 2026-09-07 · **Status:** shipped 2026-09-08 (tracker authoritative)
**Depends on:** P21 complete, including its final acceptance gate.
**Dependency state:** P21 closed on `main` at `7fece5e` on 2026-09-08. P22
approved 2026-09-08; implement P22.1→P22.5 sequentially.

## Outcome and scope

An authenticated creator saves an owned project, publishes that exact saved
version, and shares a stable URL. A visitor opens it in a fresh browser with
no account or editor session and sees the authored layout, scene, textures,
and existing camera navigation. Later edits and Saves leave the published
version unchanged until the creator explicitly updates it.

P22 completes author → draft Preview → Publish → public visitor. It reuses
P21's visitor renderer and camera behavior, with deterministic asset resolution
and a cold entry point. Publishing is a database operation, not a per-project
website build or deployment job.

Included: owned publication status, publish/update, copy/open URL, unpublish,
server validation, public asset delivery, loading/error states, and hosted smoke.
Excluded: Experience schema/authoring, authored menus/cards/interactions,
general Assets workspace, guest publishing, custom domains/slugs, discovery,
passwords, collaboration, analytics, agent API/SDK, new navigation or geometry
systems, ORM, arbitrary remote imports, and uploaded model ingestion. P20 cloud
upload supports image textures only; P22 does not broaden that ingest contract.
An unlisted URL is public to anyone who has it; it is not an access-control mode.

## Existing seams and the gap to close

Paths below are repository-relative; inspect their current callers before each
increment because P21 closeout changed route/shell ownership.

| Surface | Reuse | P22 change |
|---|---|---|
| Saved truth | `apps/api/src/project-persistence.ts`, `project_versions` | Publish a specified immutable saved version; never read live editor state on the server |
| Ownership/API | `apps/api/src/app.ts`, `auth.ts`, `database.ts`, migrations | Existing session/ownership/error conventions; small parameterized SQL publication queries |
| Asset truth | `asset-persistence.ts`, `object-store.ts`, P20 ready metadata | Pin referenced P20 texture bytes in a release manifest; public reads authorized by publication membership |
| Documents/geometry | `@portfolio/project-model`, `@portfolio/layout-core` | Existing validation, room registry, `compileLayoutGeometry()`, scene resolution and navigation graph |
| Draft Preview | `lib/editor/preview/preview-coordinator.ts` | Keep live draft/busy/retained-byte checks editor-side; share only genuinely pure runtime preparation |
| Visitor | `lib/visitor/VisitorPreviewSurface.svelte`, `VisitorEntities.svelte`, `VisitorCameraDirector.svelte`, `visitor-runtime-state.svelte.ts` | Reuse rendering and zero-node/tour/Sequence behavior; separate preview chrome from public chrome |
| Material loading | `lib/museum/materials/scene-instance-material.ts`, `texture-cache.ts` and material callers | Apply an explicit release-scoped source resolver to actual texture/material loads and their cache identity |
| Shipped resources | built-in catalogue/model/material data and deployed static files | Inventory dependencies and give published releases a durable compatibility path across later deploys |
| Shell | `ProjectShellHost.svelte`, `ProjectRow.svelte`, `EditorApp.svelte`, project route layout | Add the bounded Publish surface within the existing project session |
| Isolation | `lib/visitor/preview-surface-boundary.ts`, existing build plugin and visitor bundle checks | Keep the preview gate; additionally check the complete public route's client/server closure |

Observed while drafting: `VisitorPreviewSurface` calls `resolveTexture` on mount
but does not pass it to `VisitorEntities`; its comment still assumes a session
texture loader. `texture-cache.ts` exposes a default source-loader hook. An
editor-warmed Preview therefore does not prove a public cold boot. P22 must
exercise the resolver through the real material consumers, including texture
overrides on model instances, with no editor registration or mutable
process-global loader installation required.

## Product contract

- Author route: `/project/:projectId/publish`. Reuse the Project Row and session
  owner. Show saved version, published version/time, URL and one clear action.
  Do not add disabled Experience/Assets workspaces to deliver Publish.
- Public route: `/p/:publicationId`, outside the `/project/:projectId` layout
  that mounts `ProjectShellHost`/`EditorApp`. The opaque server-generated ID is
  allocated only by the first successful Publish, uses at least 128 bits of
  randomness (UUIDv4 is sufficient), and is stable across updates and
  unpublish/republish. A status GET must never allocate one. `/museum` remains
  frozen.
- The owner status API returns `publicationId`, not a deployment-specific
  absolute frontend URL. The editor derives the same-origin public route from
  `/p/:publicationId`; future custom-domain work may add explicit URL metadata.
- Actions are **Publish saved version**, **Update published version**,
  **Copy link**, **Open published project**, and **Unpublish** as applicable.
  State that the document and its referenced assets become publicly readable.
- Require a saved, owned project and a clean draft for publish/update. A dirty
  draft shows **Save before publishing** using the existing Save flow. No
  implicit Save or automatic publication after sign-in. Guest draft Preview
  keeps working without cloud eligibility.
- Distinguish never published, published/current, saved changes unpublished,
  unsaved draft changes, unpublished, busy and failed. Fetch server status on
  entry; compare its current saved version and monotonic publication revision
  with the editor's known baseline. A stale baseline blocks any state-changing
  action and explains that cloud state changed; it must never replace local
  work automatically.
- Every visitor-visible authored value comes from the active release's saved
  `ProjectDocument`, including `name` for public chrome. Never mix a released
  document with mutable fields from the live `projects` row. Future visitor
  metadata follows the same snapshot rule unless explicitly defined as
  platform-owned metadata.
- Preview continues to mean the current detached draft. Open published project
  means the selected public version. Neither action changes dirty/history state.
- Failure preserves the last working publication and URL. After an uncertain
  request result, refetch status before offering a retry.

## Persistence and public delivery contract

Use the existing database and private R2 bucket. Add one migration with two
small records: a publication per project (unique project ID, unique public ID,
nullable active version, a monotonic publication revision, timestamps), and
immutable releases keyed by `(project_id, version)` with a validated delivery
manifest. Foreign keys bind releases to `project_versions` and the active pointer
to a release. Reuse the complete saved `ProjectDocument`; do not create a second
editable project format. Asset/static manifests are derived delivery metadata,
never new authoring truth.

The publication revision is the optimistic-concurrency token. Increment it on
every successful visibility/state transition: first publish, update, unpublish,
and republish. Active version alone is not sufficient because an ABA sequence
such as `N → unpublished → N` must still be observable as changed cloud state.
The owner status response exposes this revision. A later ETag may mirror it, but
P22 does not require a second concurrency mechanism.

The manifest pins each distinct referenced P20 asset ID to its project, object
key, SHA-256, MIME and byte size. Storage keys stay server-side. Keep release
rows and their bytes while referenced; no garbage collection/deletion tier is
introduced here. Ready assets must remain immutable through API upload paths.
P20 currently rejects replacement of a `ready` asset, but P22 still verifies
concurrent-upload/object-key behavior before relying on that invariant and pins
the verified object key rather than resolving a release through a mutable asset
row.

Shipped catalogue/model/material resources also require durable release identity.
P22.1 builds a checked-in compatibility registry/allowlist keyed by stable logical
resource identity, not ephemeral bundler hash URLs. A shipped resource referenced
by an existing release may not be removed or renamed without retaining a
compatible mapping/file. If the current build/deploy topology cannot prove that
stable logical resources survive deploy replacement, P22.1 must instead pin/copy
those required static bytes into release-controlled delivery storage before P22.2.
A release must never depend only on "whatever the current catalogue happens to
resolve".

Proposed API paths (relative to the existing API base):

| Endpoint | Contract |
|---|---|
| `GET /projects/:projectId/publication` | Owner-only status: current saved version, active version, `publicationId`, publication revision and timestamps; never-published is normal with `publicationId: null`, `activeVersion: null`, revision `0` |
| `PUT /projects/:projectId/publication` | Owner-only `{ version, expectedPublicationRevision }`; publish exactly that saved version |
| `DELETE /projects/:projectId/publication` | Owner-only unpublish with `expectedPublicationRevision`; retain releases and stable ID |
| `GET /publications/:publicationId` | Anonymous active saved document + version + public manifest projection; unpublished/unknown returns `404` |
| `GET /publications/:publicationId/versions/:version/assets/:assetId/content` | Anonymous bytes only for P20 assets in that published release and only while the publication is active |

Validate request shapes/limits and apply the existing authenticated mutation
origin/session protections to writes. Non-owned projects return the existing
non-disclosing `404`; unauthenticated writes fail. Invalid versions/documents
or unresolved assets return a bounded validation error. A state-changing write
with a stale publication revision or stale saved-version expectation returns
`409`. Public errors expose neither ownership nor storage keys. Private project
and asset endpoints retain their authentication requirements.

Publish preparation validates the selected stored document and required release
resources before changing visibility. For a newly prepared P20 release, verify
the pinned R2 object's availability, byte size, MIME and SHA-256 with bounded
streaming using existing P20 limits; reuse an already validated immutable release
instead of rehashing it on every republish. Then, in a short SQL transaction,
lock the project/publication row, recheck ownership, latest saved version,
`expectedPublicationRevision`, active pointer and pinned asset metadata;
insert/reuse the immutable release and switch the active pointer atomically.
Increment the publication revision in the same transaction. Do not hold a SQL
transaction during R2 transfers. Any changed preparation input invalidates the
attempt.

Two concurrent publishers cannot silently overwrite one another. If a request's
desired final state is already current, the server may return the current status
as an idempotent no-op without another revision increment; otherwise the expected
revision must match before mutation. After a lost/uncertain response the client
still refetches status first, so retries use observed cloud state rather than
assuming the request failed.

Anonymous reads never fall back to latest draft. Resolve the active release once
per bootstrap so document and manifest share one version. Version-qualified
asset paths let an already-open visitor finish reading its release after an
update; old released P20 assets remain publicly accessible through release
membership while the publication is active. No endpoint lists release history
or exposes never-published versions. Unpublish disables all release document/byte
delivery for that public ID.

Use `Cache-Control: no-store` for publication metadata and public P20 asset
responses in this first slice, including proxy behavior, so unpublish affects
subsequent requests. It cannot retract bytes already downloaded or an
already-rendered page. Stream verified bytes with correct MIME/length and
`nosniff`; never redirect to permanent public R2 URLs or fetch a user-supplied
URL on the server. CDN caching and signed URLs can follow measured delivery
pressure with explicit revocation semantics.

## Runtime and validation boundary

Server publication validation reuses `validateProject`, layout compilation and
blocking geometry checks. Build an exhaustive reference set from the saved
`ProjectDocument` and existing material/model catalogue resolution. Every
texture source must be either a ready same-project P20 asset or an explicitly
supported shipped-static resource. Reject `/local/`, package rewrite sources,
`blob:`, `data:`, external URLs, unknown static paths, missing references and
unsupported assets. A syntactically safe root-relative path is not sufficient
proof of availability. Validate every scene texture entry rather than silently
pruning saved truth.

P22.1 inventories catalogue textures/models and all dependent shipped resources,
defines their stable logical identities, and creates the narrow compatibility
registry/allowlist from existing catalogue data. Check those resources in
production output and prove the chosen retention mechanism survives a simulated
later catalogue/deploy change. Do not claim pixel-identical output across
renderer upgrades; this gate is about referenced bytes/resources continuing to
exist. P20 R2 asset bytes are hash-pinned.

At first release preparation, verify R2 object availability, size, MIME and hash
with bounded transfers. A missing object or mismatch leaves the prior release
active. At public boot, validate the returned saved document/manifest and verify
downloaded P20 bytes before installing the runtime; expose a retryable failure
rather than silently presenting a partially textured project as success.

The cold loader takes saved document + release manifest + request cancellation
and returns detached scene, compiled geometry, rooms, graph and read-only
release-scoped source resolution. It imports canonical packages directly, not
editor facades. Today the project-local binary resolver is exercised by P20
texture/material consumers; built-in models/materials resolve only through the
validated shipped-static compatibility registry. Do not imply uploaded GLB/model
support that P20 does not provide.

Share pure preparation with Preview where useful; keep its session/busy gates
outside the visitor closure. Keep the render surface free of codecs; the new
route loader may use canonical codecs. Do not relax the existing Preview gate
wholesale to permit the new bootstrap dependency.

Thread the resolver through actual texture consumers using the existing loader
injection seam where it fits. Cache keys must include the resolved release/source
identity; the same logical URI cannot reuse another project's bytes. Preserve
material variant/refcount behavior. No second cache, global current-project
resolver, editor binary store, or generic runtime package unless a concrete seam
requires it.

Reuse `camera-route.ts` + `camera-motion.ts` and current visitor start-node,
zero-camera orbit, Sequence and reduced-motion behavior. Public chrome provides
the released `ProjectDocument.name` and accessible navigation/help; it has no
draft banner or Exit-to-editor button. No new Experience document or navigation
graph.

## State and lifetime

New durable state is confined to publication/release rows and their derived
delivery manifests. New editor state is publication status, request/error state,
expected publication revision and known saved version; no document schema bump,
selection owner or history transaction. Runtime additions are loader state,
release-scoped resources and a presentation mode/optional exit callback on the
shared surface. Use installed dependencies and Svelte 5 runes.

Spatial ↔ Publish preserves the existing project session, draft, selection,
history, view and camera pose. Stop/pause active playback through existing
workspace transitions; block navigation during non-interruptible mutation or
placement as appropriate. Publish owns no selection and emits no scene/layout
edits. Returning restores the prior Spatial state. Project change/unmount aborts
status requests; late responses cannot update the new project's UI. Aborting a
request does not imply a server publication was undone; refetch on return.

Public bootstrap renders loading, not an empty editor. Key the runtime by public
ID + release version, abort obsolete fetches, release textures/object URLs and
dispose runtime resources on unmount/failure. Only mount the canvas after required
inputs are ready. Browser Back/Forward and repeat visits must not retain another
project's state. Keyboard controls have visible focus/help and respect reduced
motion. Preview's detached-byte ownership and exit restoration remain intact.

## Increments and acceptance

Implement sequentially. Each increment closes with its focused checks before
the next; split a larger increment only at the fallback boundaries below.

| Increment | Deliverable | Required acceptance |
|---|---|---|
| P22.1 — Cold runtime + asset seam | Store-free preparation, real release-scoped resolver propagation, and durable shipped-static compatibility registry/retention mechanism | Render a custom P20 texture from supplied verified bytes with editor imports/setup absent; texture override on a built-in model uses the supplied resolver; two projects/releases with colliding logical URIs do not share textures; built-in model/material dependencies survive a simulated later catalogue/deploy change; failed load/unmount releases resources; draft Preview restoration stays green |
| P22.2 — Release persistence + API | Migration, revision-based optimistic concurrency, validation, transactional publish/status/unpublish, scoped public bytes | Owner/anonymous/non-owner matrix; exact-version snapshot including project `name`; first publish alone allocates stable random public ID; status GET has no creation side effect; ABA `N → unpublished → N` changes revision and stale writers cannot mutate; missing/foreign/pending assets; bad object/hash; concurrent publish/Save/upload; lost-response refetch/retry; migration twice on real Postgres; old release remains active after each failed update |
| P22.3 — Public route | `/p/:publicationId` cold bootstrap and public chrome using P22.1 | Fresh browser loads a textured authored project without auth/storage; public title comes from released document while later saved rename remains invisible until Update; reload/direct entry; zero-camera and multi-node/Sequence navigation; unknown/unpublished/revoked URL; asset failure/retry; route switch/Back cleanup; public build closure excludes editor |
| P22.4 — Publish surface | Same-session author UI, explicit saved-version action and revision-aware status | Guest/unsaved/dirty/stale gates; Save then explicit Publish; copy/open derived same-origin URL; edit/rename and Save leaves public output unchanged; update switches version; unpublish works; ABA/stale revision explains cloud-state change; project switch during request cannot leak state; keyboard/focus/axe pass |
| P22.5 — Hosted acceptance + closeout | Real deployment topology and regression evidence | Production-build cold-browser loop through actual proxy/API/Postgres/R2; anonymous asset access only via release membership; shipped-static retention mechanism proven in deployed output; full checks and route bundle gates; record evidence and update contracts/tracker/handoff |

Use focused tests in the existing Vitest and API suites, plus real Postgres
integration for transaction/SQL behavior (P20's stubbed tests missed ambiguous
`RETURNING`). Exact fixtures: (1) valid layout with primitive + uploaded P20
texture, (2) supported built-in model/material with a texture override,
(3) zero camera nodes, (4) connected camera tour with Sequence/view keys,
(5) missing/foreign asset, (6) invalid geometry. Do not add an uploaded-model
fixture; that ingest capability is outside P20/P22. Add a closure fixture with
an indirect editor import that must fail. Inspect public route output including
ancestor layouts, dynamic imports and shared chunks; a source-only check of the
inner surface is insufficient.

Final automated gate: `npm test -- --run`, `npm run test:api`, `npm run check`,
`npm run check:api`, `npm run check:camera-core`, `npm run check:layout-core`,
`npm run check:project-model`, `npm run build`, `npm run build:api`, existing
visitor/preview bundle checks and the new public-route check. Verify scripts
against the current workspace before executing; record actual results, not targets.

Manual ship scenario: author and Save textured version N → Preview → Publish →
open shared URL in a fresh unauthenticated browser → compare geometry/materials/
tour/title → edit, rename and Save N+1 → confirm public still shows all N snapshot
values → Update → fresh reload shows N+1 → Unpublish → fresh metadata and P20 asset
requests return `404` → Republish restores the same URL with a higher publication
revision. Also exercise an ABA status sequence (`N → Unpublish → Republish N`)
and prove a client holding the pre-ABA revision cannot perform a state-changing
write.

Repeat via deployed first-party `/api` proxy against real Postgres/R2; the
deferred P20 production-topology smoke is part of this gate. Also smoke
`/museum` and `/museum/editor`, Preview return, Plan ↔ 3D, small-screen public
navigation, keyboard operation and reduced motion. No live publication is
created by writing this plan.

## Boundaries, fallback and closeout

Layout stays `LayoutDocument` → existing compiler → runtime geometry. P22 never
feeds project layouts into frozen `/museum`, changes `rooms.ts` ownership,
persists generated endpoints, or adds Plan/editor helpers to public chunks. The
generic public route belongs to the editor deployment but is independently
visitor-safe; the standalone museum app and legacy editor retain their current
contracts.

If resolver plumbing is larger than expected, close P22.1 as a reusable Preview
correctness slice first; do not ship a visitor that requires a warmed editor.
If shipped-static compatibility cannot be proven with stable logical resources,
pin the required built-in bytes into release-controlled storage rather than
weakening the publication durability contract. If hosting work blocks, retain
tested runtime/API/UI increments but leave P22 unshipped until hosted cold boot
passes. Do not fall back to public buckets, latest-draft reads, per-project
builds, mutable live-project metadata, active-version-only concurrency, or copied
renderer/navigation systems.

Deployment rollback disables Publish/public routes while preserving saved
projects, publication/release rows and assets; additive migrations are not
destructively rolled back.

On ship update `components/persistence.md`, `components/assets.md`,
`components/shell.md`, runtime ownership in `architecture.md`, and the router's
route table. Record verification and the immediate next action in CURRENT;
archive this plan and collapse its tracker row per the existing lifecycle.
P23's minimum useful Layout Depth brief follows; P22 creates no Experience or
agent implementation tickets.

## Ship record (P22.5 closeout 2026-09-08)

P22.1–P22.5 all shipped on `main`. P22.1 cold runtime + asset seam,
P22.2 release persistence + API (migration 003, revision OCC), P22.3 public
route, P22.4 publish surface, P22.5 hosted acceptance.

Final gate on deployable SHA `f46e8f3` (public-route `untrack(disposeBundle)`
fix — the load `$effect` tracked disposal's read of `bundle`, retriggering
itself into a metadata/texture refetch + WebGL-context loop; pinned by
`p22-3-public-route.test.ts`): Vitest 194 files / 2570 tests passed
(1 skipped); real-Postgres API 23 core + 10 publication + 6 test-auth (39,
zero skipped); editor + museum `svelte-check` 0/0; API/camera/layout/
project-model `tsc` clean; root + API + Vercel builds green; preview
(11 files) + public (2 files) boundary gates clean; visitor bundle
(3 server + 9 client entries) green.

Production proof (fresh anonymous session, deployed first-party `/api` proxy
→ Render/Postgres/R2): `/p/b0f01de5…` settles on the version-3 titled canvas
with exactly one metadata + one texture-content request, zero-camera orbit
guidance, no console/WebGL errors; mobile 375×667 + reduced motion repeat
green. Anonymous boundary: metadata 200, member asset 200 (76,488 bytes),
random-asset 404, unknown-publication 404, `POST /test-auth/session` 404
(with editor Origin; 403 CSRF guard without). Publication revision stayed 6;
no owner-lifecycle rerun needed. P23 is the sole next action.
