import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	compileWallFirstLayoutGeometry,
	createEmptyWallFirstLayoutDocument,
	planWallChain,
	type LayoutDocumentWallFirst
} from '@portfolio/layout-core';
import {
	buildPlanRenderModel,
	type PlanPolylinePrimitive,
	type PlanSelection
} from '$lib/layout/plan-render-model';
import {
	createLayoutInteractionState,
	reconcileLayoutSelection,
	selectLayoutPhysicalWall,
	selectedLayoutPhysicalWall
} from '$lib/editor/layout/layout-interaction';
import { resolvePlanHit } from '$lib/editor/layout/plan-hit';
import { createEmptyLayoutDocument } from '$lib/layout/layout-codec';

/** Empty wall-first document with a real floor record (P23.9 precedent). */
function baseDocument(): LayoutDocumentWallFirst {
	const document = createEmptyWallFirstLayoutDocument();
	return {
		...document,
		floor: { ...document.floor, id: 'floor-1', name: 'Floor 1', elevation: 0, height: 3 }
	};
}

const p = (x: number, z: number): [number, number] => [x, z];

function commitChain(
	baseline: LayoutDocumentWallFirst,
	points: [number, number][],
	role: 'boundary' | 'partition'
): LayoutDocumentWallFirst {
	const plan = planWallChain({ baseline, points, close: false, role });
	if (plan.kind !== 'success') throw new Error(`expected success: ${JSON.stringify(plan)}`);
	return plan.document;
}

/** One boundary Wall + one partition Wall, no Rooms. */
function twoWallDocument(): LayoutDocumentWallFirst {
	const first = commitChain(baseDocument(), [p(0, 0), p(4, 0)], 'boundary');
	return commitChain(first, [p(0, 2), p(4, 2)], 'partition');
}

function wallPrimitives(document: LayoutDocumentWallFirst, selected?: PlanSelection) {
	const { geometry } = compileWallFirstLayoutGeometry(document);
	const model = buildPlanRenderModel(
		geometry,
		undefined,
		selected
			? { selected, selection: [], handles: [], drafts: [], labels: [] }
			: undefined
	);
	const primitives = model.layers
		.flatMap((layer) => layer.primitives)
		.filter(
			(primitive): primitive is PlanPolylinePrimitive =>
				primitive.kind === 'polyline' && primitive.architecture?.kind === 'wall'
		);
	return { geometry, model, primitives };
}

describe('P23.6 canonical Wall selection — compiler/render contract', () => {
	it('emits both Walls with roles and no Rooms', () => {
		const document = twoWallDocument();
		expect(document.rooms).toHaveLength(0);
		const { geometry } = compileWallFirstLayoutGeometry(document);
		expect(geometry.walls).toHaveLength(2);
		expect(new Set(geometry.walls.map((wall) => wall.role))).toEqual(
			new Set(['boundary', 'partition'])
		);
	});

	it('renders one selectable primitive per Wall with role truth, in one style family', () => {
		const document = twoWallDocument();
		const { primitives } = wallPrimitives(document);
		expect(primitives).toHaveLength(2);
		for (const primitive of primitives) {
			expect(primitive.hit?.kind).toBe('physicalWall');
			expect(primitive.style).toBe('wall-line');
		}
		const roles = new Set(
			primitives.map((primitive) =>
				primitive.architecture?.kind === 'wall' ? primitive.architecture.role : undefined
			)
		);
		expect(roles).toEqual(new Set(['boundary', 'partition']));
		// No fake room-anchored hits for canonical Walls.
		for (const primitive of primitives) {
			expect(primitive.hit).not.toHaveProperty('roomId');
			expect(primitive.hit).not.toHaveProperty('segmentId');
		}
	});
});

describe('P23.6 canonical Wall selection — highlight language', () => {
	it('selects the hit Wall and leaves the other Wall quiet', () => {
		const document = twoWallDocument();
		const [first, second] = document.walls;
		const { primitives } = wallPrimitives(document, {
			kind: 'physicalWall',
			wallId: first!.id
		});
		const styles = new Map(
			primitives.map((primitive) => [
				(primitive.hit as { wallId: string }).wallId,
				primitive.style
			])
		);
		expect(styles.get(first!.id)).toBe('wall-line-selected');
		expect(styles.get(second!.id)).toBe('wall-line');
	});

	it('highlights the host Wall when its Opening is selected', () => {
		const document = twoWallDocument();
		const [first] = document.walls;
		const { primitives } = wallPrimitives(document, {
			kind: 'wallOpening',
			wallId: first!.id,
			openingId: 'opening:missing'
		});
		const host = primitives.find(
			(primitive) => (primitive.hit as { wallId: string }).wallId === first!.id
		);
		expect(host?.style).toBe('wall-line-opening-selected');
	});

	it('never matches a Wall from another wallId', () => {
		const document = twoWallDocument();
		const { primitives } = wallPrimitives(document, {
			kind: 'physicalWall',
			wallId: 'wall:does-not-exist'
		});
		expect(primitives.filter((primitive) => primitive.style.includes('selected'))).toHaveLength(0);
	});
});

describe('P23.6 canonical Wall selection — authority', () => {
	it('selects and reads back a Wall by document-global id', () => {
		const state = createLayoutInteractionState();
		selectLayoutPhysicalWall(state, 'wall-1');
		expect(state.selection).toEqual({ kind: 'physicalWall', wallId: 'wall-1' });
		expect(selectedLayoutPhysicalWall(state)).toEqual({ wallId: 'wall-1' });
	});

	it('retains the selection while the Wall exists and clears it when gone', () => {
		const document = twoWallDocument();
		const [first] = document.walls;
		expect(
			reconcileLayoutSelection(
				{ kind: 'physicalWall', wallId: first!.id },
				document as never
			)
		).toEqual({ kind: 'physicalWall', wallId: first!.id });
		expect(
			reconcileLayoutSelection(
				{ kind: 'physicalWall', wallId: 'wall:gone' },
				document as never
			)
		).toEqual({ kind: 'none' });
		// Canonical targets never validate against a legacy document.
		expect(
			reconcileLayoutSelection(
				{ kind: 'physicalWall', wallId: first!.id },
				createEmptyLayoutDocument() as never
			)
		).toEqual({ kind: 'none' });
	});

	it('resolves a Plan hit on a roomless Wall with no fake roomId', () => {
		const document = twoWallDocument();
		const { geometry } = compileWallFirstLayoutGeometry(document);
		const [first] = document.walls;
		const hit = resolvePlanHit(geometry.queries, [2, 0.05], 0.2);
		expect(hit?.kind).toBe('physicalWall');
		if (hit?.kind === 'physicalWall') expect(hit.wallId).toBe(first!.id);
		// Far from every Wall and with no Rooms, there is no hit at all.
		expect(resolvePlanHit(geometry.queries, [20, 20], 0.2)).toBeNull();
	});
});

describe('P23.6 single-Wall presentation — Partition leaves the toolbar', () => {
	const toolbar = fs.readFileSync(
		path.join(fileURLToPath(new URL('../../../src/lib', import.meta.url)), 'editor/layout/LayoutDraftToolbar.svelte'),
		'utf8'
	);

	it('offers no Partition primary button', () => {
		expect(toolbar).not.toContain("chooseTool('partition-chain')");
		expect(toolbar).toContain('P23.6');
	});

	it('keeps partition-chain a valid tool with its role mapping', () => {
		expect(toolbar).toContain("'partition-chain'");
		const document = commitChain(baseDocument(), [p(0, 0), p(2, 0)], 'partition');
		expect(document.walls.every((wall) => wall.role === 'partition')).toBe(true);
		expect(document.rooms).toHaveLength(0);
	});
});
