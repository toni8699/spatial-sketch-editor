import { describe, expect, it } from 'vitest';
import {
	LAYOUT_PLAN_GRID_STEP,
	LAYOUT_PLAN_SNAP_RADIUS_CSS_PX,
	objectBoundsSnapCandidates,
	openingEdgeSnapCandidates,
	orthogonalGuideCandidates,
	pickSnapWinner,
	resolveLayoutSnap,
	snapAcquisitionRadiusWorld,
	snapToGridStep,
	spanSnapCandidates,
	wallIntersectionSnapCandidates,
	type CompiledLayoutGeometry,
	type SnapCandidate
} from '@portfolio/layout-core';

function emptyGeometry(): CompiledLayoutGeometry {
	return {
		floors: [],
		rooms: [],
		objects: [],
		queries: { points: [], spans: [], polygons: [], aabbs: [] },
		bounds: null
	};
}

function vertexAt(x: number, z: number, sourceId: string): CompiledLayoutGeometry['queries']['points'][number] {
	return {
		id: `q:${sourceId}`,
		cacheKey: `c:${sourceId}`,
		kind: 'vertex',
		point: [x, z],
		aabb: { min: [x, z], max: [x, z] },
		sourceId,
		floorId: 'f',
		roomId: 'r',
		segmentId: sourceId,
		sourceIndex: 0
	};
}

describe('P23.2 centralized snap constants', () => {
	it('uses the plan-ratified 0.25 m grid step and 8 CSS px acquisition radius', () => {
		expect(LAYOUT_PLAN_GRID_STEP).toBe(0.25);
		expect(LAYOUT_PLAN_SNAP_RADIUS_CSS_PX).toBe(8);
	});

	it('converts the CSS-pixel radius to world units per zoom level (zoom-stable acquisition)', () => {
		const at50 = snapAcquisitionRadiusWorld({ pixelsPerMeter: 25 });
		const at100 = snapAcquisitionRadiusWorld({ pixelsPerMeter: 50 });
		const at200 = snapAcquisitionRadiusWorld({ pixelsPerMeter: 100 });
		expect(at100).toBeCloseTo(8 / 50);
		expect(at50).toBeCloseTo(at100 * 2);
		expect(at200).toBeCloseTo(at100 / 2);
	});

	it('returns no radius for invalid zoom', () => {
		expect(snapAcquisitionRadiusWorld({ pixelsPerMeter: 0 })).toBe(0);
		expect(snapAcquisitionRadiusWorld({ pixelsPerMeter: Number.NaN })).toBe(0);
	});
});

describe('P23.2 deterministic winner order', () => {
	const junction: SnapCandidate = { point: [0, 0], kind: 'junction', sourceId: 'j1', distance: 0.3 };
	const grid: SnapCandidate = { point: [0.25, 0], kind: 'grid', sourceId: 'grid', distance: 0.05 };

	it('a valid semantic reference beats grid even when grid is closer', () => {
		expect(pickSnapWinner([grid, junction])).toEqual(junction);
		expect(pickSnapWinner([junction, grid])).toEqual(junction);
	});

	it('equal rank resolves by screen distance', () => {
		const near: SnapCandidate = { point: [1, 0], kind: 'junction', sourceId: 'j-near', distance: 0.1 };
		const far: SnapCandidate = { point: [2, 0], kind: 'junction', sourceId: 'j-far', distance: 0.2 };
		expect(pickSnapWinner([far, near])).toEqual(near);
	});

	it('equal rank and distance resolves by stable key, never iteration order', () => {
		const a: SnapCandidate = { point: [1, 0], kind: 'junction', sourceId: 'wall-a#start', distance: 0.15 };
		const b: SnapCandidate = { point: [1, 0], kind: 'junction', sourceId: 'wall-b#end', distance: 0.15 };
		const forward = pickSnapWinner([a, b]);
		const backward = pickSnapWinner([b, a]);
		expect(forward).toEqual(backward);
		expect(forward?.sourceId).toBe('wall-a#start');
	});

	it('excludes moving-target source IDs and exact points', () => {
		const self: SnapCandidate = { point: [3, 3], kind: 'junction', sourceId: 'moving', distance: 0.01 };
		const other: SnapCandidate = { point: [3.1, 3], kind: 'junction', sourceId: 'other', distance: 0.11 };
		expect(pickSnapWinner([self, other], { excludeSourceIds: new Set(['moving']) })).toEqual(other);
		expect(pickSnapWinner([self], { excludePoints: [[3, 3]] })).toBeNull();
	});

	it('filters by tool/context validity via allowedKinds', () => {
		expect(pickSnapWinner([junction, grid], { allowedKinds: ['grid'] })).toEqual(grid);
	});
});

describe('P23.2 candidate families', () => {
	it('emits endpoint, midpoint, and nearest-span candidates for one wall span', () => {
		const span = { id: 'w1', start: [0, 0] as [number, number], end: [4, 0] as [number, number] };
		const radius = 0.5;
		const atStart = spanSnapCandidates(span, [0.05, 0.02], radius);
		expect(atStart.find((candidate) => candidate.sourceId === 'w1#start')).toBeTruthy();

		const atMid = spanSnapCandidates(span, [2.03, 0.02], radius);
		const mid = atMid.find((candidate) => candidate.kind === 'wall-midpoint');
		expect(mid?.point).toEqual([2, 0]);

		const onSpan = spanSnapCandidates(span, [2.5, 0.3], radius);
		const projected = onSpan.find((candidate) => candidate.kind === 'wall-span');
		expect(projected?.point).toEqual([2.5, 0]);

		const far = spanSnapCandidates(span, [10, 10], radius);
		expect(far).toHaveLength(0);
	});

	it('emits opening-edge candidates on both ends of an opening span', () => {
		const span = { id: 's1', openingId: 'door', start: [1, 0] as [number, number], end: [2, 0] as [number, number] };
		const candidates = openingEdgeSnapCandidates(span, [1.98, 0.03], 0.2);
		expect(candidates.some((candidate) => candidate.sourceId === 'door#end')).toBe(true);
	});

	it('emits rotated-object bounds edge and center candidates', () => {
		// A diamond footprint (45°-rotated square): edges are diagonal.
		const footprint: [number, number][] = [
			[1, 0],
			[2, 1],
			[1, 2],
			[0, 1]
		];
		const edges = objectBoundsSnapCandidates(footprint, 'obj', [1.01, 0.02], 0.2);
		expect(edges.some((candidate) => candidate.kind === 'object-bounds-edge')).toBe(true);
		const center = objectBoundsSnapCandidates(footprint, 'obj', [1.03, 1.02], 0.2);
		expect(center.some((candidate) => candidate.kind === 'object-bounds-center')).toBe(true);
	});

	it('emits orthogonal guide candidates relative to the active anchor', () => {
		const candidates = orthogonalGuideCandidates([1, 1], [3, 1.1]);
		const x = candidates.find((candidate) => candidate.sourceId === 'orthogonal-x');
		const z = candidates.find((candidate) => candidate.sourceId === 'orthogonal-z');
		expect(x?.point).toEqual([3, 1]);
		expect(z?.point).toEqual([1, 1.1]);
	});

	it('emits valid wall-wall intersections only for endpoint-on-interior and proper-crossing', () => {
		const spans = [
			{ id: 'h', start: [0, 0] as [number, number], end: [4, 0] as [number, number] },
			{ id: 'tee', start: [2, 0] as [number, number], end: [2, 3] as [number, number] },
			{ id: 'far', start: [0, 5] as [number, number], end: [4, 5] as [number, number] }
		];
		const candidates = wallIntersectionSnapCandidates(spans, [2.04, 0.03], 0.3);
		expect(candidates).toHaveLength(1);
		expect(candidates[0]).toMatchObject({ kind: 'wall-intersection', point: [2, 0] });
	});
});

describe('P23.2 resolveLayoutSnap over compiled query geometry', () => {
	it('snaps to a compiled junction point and beats the grid fallback', () => {
		const geometry = emptyGeometry();
		geometry.queries.points.push(vertexAt(2, 0, 'seg-a'));
		const resolution = resolveLayoutSnap(geometry, [2.04, 0.02], { pixelsPerMeter: 50 });
		expect(resolution.kind).toBe('snap');
		if (resolution.kind !== 'snap') return;
		expect(resolution.candidate).toMatchObject({ kind: 'junction', point: [2, 0] });
	});

	it('falls back to the grid when no semantic candidate is in range', () => {
		const resolution = resolveLayoutSnap(emptyGeometry(), [2.34, 1.11], { pixelsPerMeter: 50 });
		expect(resolution.kind).toBe('snap');
		if (resolution.kind !== 'snap') return;
		expect(resolution.candidate).toMatchObject({ kind: 'grid', point: [2.25, 1] });
	});

	it('honors exclusion of the moving target inside resolveLayoutSnap', () => {
		const geometry = emptyGeometry();
		geometry.queries.points.push(vertexAt(2, 0, 'moving-segment'));
		const resolution = resolveLayoutSnap(geometry, [2.01, 0.01], { pixelsPerMeter: 50 }, {
			excludeSourceIds: new Set(['moving-segment'])
		});
		if (resolution.kind === 'snap') {
			expect(resolution.candidate.sourceId).not.toBe('moving-segment');
		}
	});

	it('snapToGridStep respects the centralized step and invalid steps pass through', () => {
		expect(snapToGridStep([1.13, -0.62])).toEqual([1.25, -0.5]);
		expect(snapToGridStep([1.13, 1], 0)).toEqual([1.13, 1]);
	});
});
