/**
 * P23.0 F0 stage 1 — exhaustive document-format dual-dispatch architecture
 * test + the central guard's behavioral contract.
 *
 * Plan rule (P23.0 "Editor-adapter cutover before writer enable" + the
 * execution-order addendum): every editor mutation entry point must be
 * adapted / read-only / explicitly disabled per document format, the guard
 * placement is CENTRAL DISPATCH by default, and the inventory is pinned by
 * an architecture test that fails when any mutator ships unclassified.
 *
 * The central seam: every authoring mutation is bracketed by exactly one of
 * `beginLayoutTransaction` (layout domain) or `beginDocumentTransaction` /
 * `beginCameraFramingTransaction` (scene/camera domain) on the `EditorStore`
 * facade, and each of those consults the policy table in
 * `document-format-policy.svelte.ts` before opening the transaction.
 *
 * The scans below are intentionally mechanical:
 * 1. every file that CALLS a transaction method must be in the reviewed
 *    guarded-family inventory (else a mutator may bypass the format guard);
 * 2. every file with a DIRECT document-array write must be on the reviewed
 *    exception list with a named reason (else it may write outside the
 *    transaction bracket);
 * 3. the facade's three begin methods must textually consult the policy.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createFixtureEditorStore } from '../editor-test-utils';
import { chopinProject } from '$lib/content/chopin-project';
import {
	classifyLayoutFormat,
	classifySceneFormat,
	isMutationAllowed,
	LAYOUT_MUTATION_POLICY,
	LAYOUT_MUTATION_REASONS,
	SCENE_MUTATION_POLICY,
	SCENE_MUTATION_REASONS,
	layoutMutationClassFor,
	sceneMutationClassFor
} from '$lib/editor/store/document-format-policy.svelte';
import { LAYOUT_WALL_FIRST_FORMAT_VERSION } from '$lib/layout/layout-wall-first-codec';

const EDITOR_SRC_LIB = join(
	dirname(fileURLToPath(import.meta.url)),
	'..',
	'..',
	'..',
	'..',
	'src',
	'lib'
);

/** Recursively list .ts/.svelte source files under `root` (posix-relative). */
function walkSourceFiles(root: string): string[] {
	const out: string[] = [];
	const visit = (dir: string): void => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const full = join(dir, entry.name);
			if (entry.isDirectory()) {
				visit(full);
				continue;
			}
			if ((entry.name.endsWith('.ts') || entry.name.endsWith('.svelte')) && !entry.name.endsWith('.d.ts')) {
				out.push(full);
			}
		}
	};
	visit(root);
	return out.sort();
}

const ALL_SOURCE_FILES = walkSourceFiles(EDITOR_SRC_LIB);

/** Files that CALL a document-transaction method on the store/facade. */
const TRANSACTION_CALL_PATTERN =
	/\.(beginLayoutTransaction|commitLayoutTransaction|cancelLayoutTransaction|beginDocumentTransaction|commitDocumentTransaction|beginCameraFramingTransaction)\(/;

/**
 * The reviewed guarded-family inventory: files allowed to reference the
 * transaction surface. Every entry routes through the facade methods that
 * consult the central format policy.
 */
const GUARDED_TRANSACTION_FILES = [
	// the facade: declares the guarded begin/commit/cancel methods
	'editor/editor-store.svelte.ts',
	// layout-side transaction consumers
	'editor/EditorViewport.svelte',
	'editor/app/PlanWorkspace.svelte',
	'editor/app/WorkspaceRibbon.svelte',
	'editor/gizmo/layout-gizmo-adapter.svelte.ts',
	'editor/layout/arrange-delete.ts',
	'editor/layout/layout-mutation-runner.ts',
	// scene/camera-side transaction consumers
	'editor/EditorPlacementTools.svelte',
	'editor/EditorSelection.svelte',
	'editor/app/CameraPlanInspector.svelte',
	'editor/app/PlanWorkspace.svelte',
	'editor/camera-plan/CameraPlanViewport.svelte',
	'editor/gizmo/camera-gizmo-adapter.svelte.ts',
	'editor/gizmo/scene-gizmo-adapter.svelte.ts',
	'editor/store/camera-preview-commands.svelte.ts',
	'editor/store/camera-timeline-controller.svelte.ts',
	'editor/store/controller-hosts.ts',
	'editor/store/material-resource-mutator.svelte.ts',
	'editor/store/navigation-graph-mutator.svelte.ts',
	'editor/store/path-anchor-mutator.svelte.ts',
	'editor/store/placement-cluster-mutator.svelte.ts',
	'editor/store/view-keyframe-controller.svelte.ts',
	// the history/document core the facade brackets
	'editor/store/document-store.svelte.ts',
	'editor/store/history-controller.svelte.ts'
] as const;

/**
 * Files with direct document-array writes, each with its named reason
 * (P23.0: every path is adapted / read-only / disabled — no unclassified
 * writes). Absence from this list is the guarantee the architecture test
 * enforces: a NEW direct-write file fails the suite until reviewed.
 */
const DIRECT_WRITE_EXCEPTIONS: Record<string, string> = {
	// room-registry plumbing replaced with each document swap — not a
	// document-array mutation.
	'editor/store/document-store.svelte.ts':
		'Room-registry assignment plumbing (document swap), not a document-array mutation',
	// pure reducers over CLONED layout documents; the caller commits through
	// the guarded layout transaction runner.
	'editor/gizmo/layout-gizmo-candidate.ts':
		'Pure reducer over a cloned layout; commit rides the guarded transaction runner',
	'editor/layout/layout-room-transform.ts':
		'Pure room-frame computation over a cloned layout',
	// draft-preview mutators: PlanWorkspace / UnifiedProjectTree /
	// LayoutPlanViewport call these through runLayoutMutation +
	// layoutMutationRunnerFor(store, ...) → store.beginLayoutTransaction.
	// The remaining matches are preview-cache plumbing and boot-time
	// scaffolding that runs before any authoring mutator exists.
	'editor/layout/layout-preview-state.svelte.ts':
		'Draft-preview mutators committed through the guarded layout runner; boot/preview-cache plumbing only',
	// scene mutators writing through host.document INSIDE document
	// transactions opened via the guarded facade methods.
	'editor/store/navigation-graph-mutator.svelte.ts':
		'Writes inside guarded beginDocumentTransaction brackets (camera/scene domain)',
	'editor/store/placement-cluster-mutator.svelte.ts':
		'Writes inside guarded beginDocumentTransaction brackets (camera/scene domain)',
	// material/texture registry writes — each site is immediately preceded
	// by host.beginDocumentTransaction() in the same function.
	'editor/store/material-resource-mutator.svelte.ts':
		'textures/materials writes inside guarded beginDocumentTransaction brackets (material domain)',
	// connection.pathAnchors splices (review round 2) — every call site is
	// wrapped by the guarded layout/scene transaction runner above it.
	'editor/store/path-anchor-mutator.svelte.ts':
		'positionPath.anchors splices inside guarded beginDocumentTransaction brackets (anchor domain)'
};

describe('P23.0 F0 stage 1 — central format-dispatch policy tables', () => {
	it('classifies every domain × format; nothing is unclassified', () => {
		const layoutFormats = ['legacy', 'wall-first', 'unrecognized'] as const;
		const sceneFormats = ['legacy-room-local', 'project-world'] as const;
		for (const format of layoutFormats) {
			expect(LAYOUT_MUTATION_POLICY[format]).toBeDefined();
		}
		for (const format of sceneFormats) {
			expect(SCENE_MUTATION_POLICY[format]).toBeDefined();
		}
	});

	it('wall-first layout mutation is explicitly disabled with a named reason', () => {
		expect(LAYOUT_MUTATION_POLICY['wall-first']).toBe('disabled');
		const reason = LAYOUT_MUTATION_REASONS['wall-first'];
		expect(reason).toBeTruthy();
		// The shipped Chopin layout is legacy and adapted; a minimal
		// wall-first-shaped value (real fixtures live in the codec suite)
		// classifies as wall-first and refuses.
		expect(classifyLayoutFormat(chopinProject.layout)).toBe('legacy');
		const wallFirstShape = {
			units: 'meters',
			formatVersion: LAYOUT_WALL_FIRST_FORMAT_VERSION,
			floor: { id: 'floor-1', name: 'Floor 1', elevation: 0, height: 3 },
			junctions: [],
			walls: [],
			rooms: [],
			openings: [],
			objects: []
		};
		expect(classifyLayoutFormat(wallFirstShape)).toBe('wall-first');
		const disabledClass = layoutMutationClassFor(wallFirstShape);
		expect(disabledClass.policy).toBe('disabled');
		expect(disabledClass.reason).toBe(reason);
		expect(isMutationAllowed(disabledClass)).toBe(false);
	});

	it('unrecognized layouts are disabled; legacy layout is adapted', () => {
		expect(LAYOUT_MUTATION_POLICY.unrecognized).toBe('disabled');
		expect(LAYOUT_MUTATION_POLICY.legacy).toBe('adapted');
		expect(layoutMutationClassFor({ units: 'nonsense' }).policy).toBe('disabled');
		expect(layoutMutationClassFor(chopinProject.layout).policy).toBe('adapted');
	});

	it('both scene formats are adapted in stage 1 (P23.0b adapter audit)', () => {
		expect(SCENE_MUTATION_POLICY['legacy-room-local']).toBe('adapted');
		expect(SCENE_MUTATION_POLICY['project-world']).toBe('adapted');
		const worldLocal = { ...(chopinProject.scene as object), formatVersion: 1 } as Parameters<typeof classifySceneFormat>[0];
		expect(classifySceneFormat(worldLocal)).toBe('project-world');
		expect(sceneMutationClassFor(worldLocal).policy).toBe('adapted');
		expect(SCENE_MUTATION_REASONS['project-world']).toBeNull();
	});
});

describe('P23.0 F0 stage 1 — exhaustive mutation-entry-point inventory', () => {
	it('every transaction-method caller is in the reviewed guarded family', () => {
		const callers = ALL_SOURCE_FILES.filter((file) =>
			TRANSACTION_CALL_PATTERN.test(readFileSync(file, 'utf8'))
		).map((file) => file.slice(EDITOR_SRC_LIB.length + 1));

		const allowed = new Set<string>(GUARDED_TRANSACTION_FILES);
		const unclassified = callers.filter((file) => !allowed.has(file));
		expect(unclassified, `Files calling document transactions outside the guarded family: ${unclassified.join(', ')}`).toEqual([]);
	});

	it('every direct document-array write file is on the reviewed exception list', () => {
		// Widen per review round 2: mutating methods beyond push (splice/sort/
		// index-assign), the remaining SceneDocument arrays (connections/
		// textures/materials), and nested path anchors. Local-copy splices
		// (e.g. CameraFlowPanel's filtered copy) deliberately don't match —
		// only direct document-collection writes are audited.
		const collections = 'floors|rooms|boundary|openings|objects|entities|clusters|navigationNodes|pathAnchors|walls|junctions|connections|textures|materials';
		const writePattern = new RegExp(
			`\\.(${collections}) = [^=]|\\.(${collections}|anchors)\\.(push|splice|unshift|pop|shift|sort|reverse|fill|copyWithin)\\(`
		);
		const writers = ALL_SOURCE_FILES.filter((file) =>
			writePattern.test(readFileSync(file, 'utf8'))
		).map((file) => file.slice(EDITOR_SRC_LIB.length + 1));

		const unclassified = writers.filter((file) => !(file in DIRECT_WRITE_EXCEPTIONS));
		expect(unclassified, `Direct document writers missing a reviewed classification: ${unclassified.join(', ')}`).toEqual([]);
		for (const file of writers) {
			expect(DIRECT_WRITE_EXCEPTIONS[file], `missing reason for ${file}`).toBeTruthy();
		}
	});

	it('the facade begin methods consult the central policy (guard wiring)', () => {
		const storeSource = readFileSync(join(EDITOR_SRC_LIB, 'editor', 'editor-store.svelte.ts'), 'utf8');
		const beginLayout = storeSource.slice(
			storeSource.indexOf('beginLayoutTransaction(): boolean'),
			storeSource.indexOf('commitLayoutTransaction(snapshot')
		);
		expect(beginLayout).toContain('classifyLayoutFormat');
		expect(beginLayout).toContain('LAYOUT_MUTATION_POLICY');

		const beginDocument = storeSource.slice(
			storeSource.indexOf('beginDocumentTransaction()'),
			storeSource.indexOf('beginCameraFramingTransaction()')
		);
		expect(beginDocument).toContain('classifySceneFormat');
		expect(beginDocument).toContain('SCENE_MUTATION_POLICY');

		const beginFraming = storeSource.slice(storeSource.indexOf('beginCameraFramingTransaction()'));
		expect(beginFraming).toContain('classifySceneFormat');
		expect(beginFraming).toContain('SCENE_MUTATION_POLICY');
	});
});

describe('P23.0 F0 stage 1 — behavioral guard contract', () => {
	const wallFirstLayout = {
		units: 'meters',
		formatVersion: LAYOUT_WALL_FIRST_FORMAT_VERSION,
		floor: { id: 'floor-1', name: 'Floor 1', elevation: 0, height: 3 },
		junctions: [
			{ id: 'j-a', point: [0, 0] },
			{ id: 'j-b', point: [6, 0] },
			{ id: 'j-c', point: [6, 4] },
			{ id: 'j-d', point: [0, 4] }
		],
		walls: [
			{ id: 'w-a', startJunctionId: 'j-a', endJunctionId: 'j-b', role: 'boundary', thickness: 0.2, height: 3 },
			{ id: 'w-b', startJunctionId: 'j-b', endJunctionId: 'j-c', role: 'boundary', thickness: 0.2, height: 3 },
			{ id: 'w-c', startJunctionId: 'j-c', endJunctionId: 'j-d', role: 'boundary', thickness: 0.2, height: 3 },
			{ id: 'w-d', startJunctionId: 'j-d', endJunctionId: 'j-a', role: 'boundary', thickness: 0.2, height: 3 }
		],
		rooms: [],
		openings: [],
		objects: []
	};

	/** Minimal layout-history host + format source over one mutable layout. */
	function attachLayoutHost(store: ReturnType<typeof createFixtureEditorStore>, layout: unknown) {
		const holder = { project: { layout } };
		store.registerLayoutHistory({
			capture: () => holder,
			replace: () => {},
			matches: () => true
		});
		store.setLayoutFormatPolicySource(() => holder);
		return holder;
	}

	it('legacy layout documents keep authoring (guard is a no-op on reachable formats)', () => {
		const store = createFixtureEditorStore();
		attachLayoutHost(store, chopinProject.layout);
		expect(store.beginLayoutTransaction()).toBe(true);
		expect(store.statusMessage).toBeNull();
		expect(store.cancelLayoutTransaction()).toBe(true);
	});

	it('wall-first layout documents refuse layout authoring with the named reason', () => {
		const store = createFixtureEditorStore();
		expect(classifyLayoutFormat(wallFirstLayout)).toBe('wall-first');
		const holder = attachLayoutHost(store, chopinProject.layout);

		// Legacy first: authoring opens.
		expect(store.beginLayoutTransaction()).toBe(true);
		store.cancelLayoutTransaction();

		// Swap the live layout to wall-first: the central guard refuses with
		// the stage-2 reason.
		holder.project.layout = wallFirstLayout;
		expect(store.beginLayoutTransaction()).toBe(false);
		expect(store.statusMessage).toBe(
			'Wall-first layout mutation enables with the canonical writers (P23.0 stage 2)'
		);

		// Swap back: the switch is the document, not a per-controller flag.
		holder.project.layout = chopinProject.layout;
		expect(store.beginLayoutTransaction()).toBe(true);
		store.cancelLayoutTransaction();
	});
});
