import { describe, expect, it } from 'vitest';
import {
	LAYOUT_PLAN_GRID_STEP,
	LAYOUT_PLAN_SNAP_RADIUS_CSS_PX,
	dedupeWallSpans,
	objectBoundsSnapCandidates,
	openingEdgeSnapCandidates,
	orthogonalGuideCandidates,
	pickSnapWinner,
	resolveLayoutSnap,
	resolveOpeningDragSnap,
	snapAcquisitionRadiusWorld,
	snapToGridStep,
	spanSnapCandidates,
	wallIntersectionSnapCandidates,
	type CompiledLayoutGeometry,
	type CompiledQuerySpan,
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

function wallSpan(
	segmentId: string,
	start: [number, number],
	end: [number, number],
	roomId = 'r',
	startDistance = 0
): CompiledQuerySpan {
	const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
	return {
		id: `s:${segmentId}:${startDistance}`,
		cacheKey: `k:${segmentId}:${startDistance}`,
		kind: 'wall',
		start,
		end,
		startDistance,
		endDistance: startDistance + length,
		aabb: {
			min: [Math.min(start[0], end[0]), Math.min(start[1], end[1])],
			max: [Math.max(start[0], end[0]), Math.max(start[1], end[1])]
		},
		sourceId: segmentId,
		floorId: 'f',
		roomId,
		segmentId
	};
}

function openingSpan(
	openingId: string,
	segmentId: string,
	start: [number, number],
	end: [number, number]
): CompiledQuerySpan {
	const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
	return {
		id: `o:${openingId}`,
		cacheKey: `k:${openingId}`,
		kind: 'opening',
		start,
		end,
		startDistance: 0,
		endDistance: length,
		aabb: {
			min: [Math.min(start[0], end[0]), Math.min(start[1], end[1])],
			max: [Math.max(start[0], end[0]), Math.max(start[1], end[1])]
		},
		sourceId: openingId,
		floorId: 'f',
		roomId: 'r',
		segmentId,
		openingId
	};
}

/** Per-sample spans of the authored wall (0,4) → (4,0), one 1 m chunk. */
function negativeSlopeSpans(segmentId = 'diag', roomId = 'r'): CompiledQuerySpan[] {
	const spans: CompiledQuerySpan[] = [];
	for (let start = 0; start < 4; start += 1) {
		spans.push(wallSpan(segmentId, [start, 4 - start], [start + 1, 3 - start], roomId, start));
	}
	return spans;
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

describe('P23.2 negative-slope wall geometry', () => {
	it('merges a negative-slope wall to its true endpoint pair, not the bounding-box anti-diagonal', () => {
		// Authored (0,4) → (4,0): a min/max merge would produce the fake
		// anti-diagonal (0,0) → (4,4).
		expect(dedupeWallSpans(negativeSlopeSpans())).toEqual([
			{ id: 'diag', start: [0, 4], end: [4, 0] }
		]);
	});

	it('merges reversed shared negative-slope spans across rooms into the true endpoint pair', () => {
		// Room 'a' traverses (0,4) → (4,0); room 'b' traverses the same wall
		// reversed, (4,0) → (0,4), so startDistance is per-room and cannot be
		// compared across rooms.
		const spans: CompiledQuerySpan[] = [...negativeSlopeSpans('diag', 'a')];
		for (let start = 0; start < 4; start += 1) {
			spans.push(wallSpan('diag', [4 - start, start], [3 - start, start + 1], 'b', start));
		}
		expect(dedupeWallSpans(spans)).toEqual([
			{ id: 'diag', start: [0, 4], end: [4, 0] }
		]);
	});

	it('resolves the midpoint of a negative-slope wall on the true geometry', () => {
		const geometry = emptyGeometry();
		geometry.queries.spans.push(...negativeSlopeSpans());
		const resolution = resolveLayoutSnap(geometry, [2.02, 1.98], { pixelsPerMeter: 50 });
		expect(resolution.kind).toBe('snap');
		if (resolution.kind !== 'snap') return;
		expect(resolution.candidate).toMatchObject({ kind: 'wall-midpoint', point: [2, 2] });
	});

	it('resolves the endpoint of a negative-slope wall on the true geometry', () => {
		const geometry = emptyGeometry();
		geometry.queries.spans.push(...negativeSlopeSpans());
		const resolution = resolveLayoutSnap(geometry, [0.04, 3.96], { pixelsPerMeter: 50 });
		expect(resolution.kind).toBe('snap');
		if (resolution.kind !== 'snap') return;
		expect(resolution.candidate).toMatchObject({
			kind: 'junction',
			point: [0, 4],
			sourceId: 'diag#start'
		});
	});

	it('computes a proper crossing on a negative-slope wall at the true intersection', () => {
		const geometry = emptyGeometry();
		geometry.queries.spans.push(
			...negativeSlopeSpans(),
			wallSpan('vertical', [2, 0], [2, 3])
		);
		const resolution = resolveLayoutSnap(geometry, [2.04, 2.03], { pixelsPerMeter: 50 });
		expect(resolution.kind).toBe('snap');
		if (resolution.kind !== 'snap') return;
		expect(resolution.candidate).toMatchObject({ kind: 'wall-intersection', point: [2, 2] });
	});
});

describe('P23.2 moving-target exclusion by typed owner', () => {
	it('excludes a moving object own bounds-edge candidates even though sourceId is composite', () => {
		const geometry = emptyGeometry();
		geometry.queries.polygons.push({
			id: 'p:obj',
			cacheKey: 'c:obj',
			kind: 'object-footprint',
			polygon: [[0, 0], [1, 0], [1, 1], [0, 1]],
			aabb: { min: [0, 0], max: [1, 1] },
			sourceId: 'obj',
			objectId: 'obj'
		});
		// Pointer at the own edge midpoint: the candidate is 'obj#0:mid'
		// (sourceId ≠ 'obj'), sharing its world point with the grid fallback.
		const unexcluded = resolveLayoutSnap(geometry, [0.5, 0.03], { pixelsPerMeter: 50 });
		expect(unexcluded.kind).toBe('snap');
		if (unexcluded.kind !== 'snap') return;
		expect(unexcluded.candidate).toMatchObject({
			kind: 'object-bounds-edge',
			sourceId: 'obj#0:mid',
			ownerId: 'obj'
		});
		const excluded = resolveLayoutSnap(geometry, [0.5, 0.03], { pixelsPerMeter: 50 }, {
			excludeSourceIds: new Set(['obj'])
		});
		expect(excluded.kind).toBe('snap');
		if (excluded.kind !== 'snap') return;
		expect(excluded.candidate.kind).toBe('grid');
	});

	it('excludes a moving wall segment endpoint candidates like `w#start` by owner', () => {
		const geometry = emptyGeometry();
		geometry.queries.spans.push(wallSpan('w', [0, 0], [4, 0]));
		const unexcluded = resolveLayoutSnap(geometry, [0.02, 0.01], { pixelsPerMeter: 50 });
		expect(unexcluded.kind).toBe('snap');
		if (unexcluded.kind !== 'snap') return;
		expect(unexcluded.candidate).toMatchObject({ kind: 'junction', sourceId: 'w#start' });
		const excluded = resolveLayoutSnap(geometry, [0.02, 0.01], { pixelsPerMeter: 50 }, {
			excludeSourceIds: new Set(['w'])
		});
		expect(excluded.kind).toBe('snap');
		if (excluded.kind !== 'snap') return;
		expect(excluded.candidate.kind).toBe('grid');
	});
});

describe('P23.2 opening drag resolution (offset space)', () => {
	// 6 m host wall authored (0,0) → (6,0); door width 0.9. Default radius
	// 8 CSS px at 50 px/m = 0.16 m unless overridden.
	const host = { segmentId: 'w', start: [0, 0] as [number, number], end: [6, 0] as [number, number] };

	it('falls back to the grid, center-snapped like opening creation', () => {
		const resolution = resolveOpeningDragSnap(emptyGeometry(), host, 'door', 0.53, 0.9, { pixelsPerMeter: 50 });
		expect(resolution.kind).toBe('snap');
		if (resolution.kind !== 'snap') return;
		expect(resolution.candidate).toMatchObject({ kind: 'grid', sourceId: 'grid' });
		expect(resolution.candidate.offset).toBeCloseTo(0.05, 6);
	});

	it('flushes the opening to the wall start and end junctions', () => {
		const start = resolveOpeningDragSnap(emptyGeometry(), host, 'door', 0.1, 0.9, { pixelsPerMeter: 50 });
		expect(start.kind).toBe('snap');
		if (start.kind !== 'snap') return;
		expect(start.candidate).toMatchObject({ kind: 'junction', sourceId: 'w#start', offset: 0 });

		const end = resolveOpeningDragSnap(emptyGeometry(), host, 'door', 5.9, 0.9, { pixelsPerMeter: 50 });
		expect(end.kind).toBe('snap');
		if (end.kind !== 'snap') return;
		expect(end.candidate).toMatchObject({ kind: 'junction', sourceId: 'w#end' });
		expect(end.candidate.offset).toBeCloseTo(5.1, 6);
	});

	it('centers the opening on the host wall midpoint', () => {
		const resolution = resolveOpeningDragSnap(emptyGeometry(), host, 'door', 3.02, 0.9, { pixelsPerMeter: 50 });
		expect(resolution.kind).toBe('snap');
		if (resolution.kind !== 'snap') return;
		expect(resolution.candidate).toMatchObject({ kind: 'wall-midpoint', sourceId: 'w' });
		expect(resolution.candidate.offset).toBeCloseTo(2.55, 6);
	});

	it('never snaps the dragged opening to its own edges (self-snap loop)', () => {
		const geometry = emptyGeometry();
		// Dragged door currently at offset 0.5..1.4 (center 0.95).
		geometry.queries.spans.push(openingSpan('door', 'w', [0.5, 0], [1.4, 0]));
		// Pointer 0.96 is 0.01 m from the opening own center — without the
		// exclusion its own start edge would win by rank and the opening
		// would stick at 0.5 forever.
		const resolution = resolveOpeningDragSnap(geometry, host, 'door', 0.96, 0.9, { pixelsPerMeter: 50 });
		expect(resolution.kind).toBe('snap');
		if (resolution.kind !== 'snap') return;
		expect(resolution.candidate).toMatchObject({ kind: 'grid', sourceId: 'grid' });
		expect(resolution.candidate.offset).toBeCloseTo(0.55, 6);
	});

	it('aligns the approaching edge to another opening edge on the same wall', () => {
		const geometry = emptyGeometry();
		geometry.queries.spans.push(openingSpan('other', 'w', [3, 0], [3.9, 0]));
		const resolution = resolveOpeningDragSnap(geometry, host, 'door', 2.9, 0.9, {
			pixelsPerMeter: 50,
			snapRadiusCssPx: 100
		});
		expect(resolution.kind).toBe('snap');
		if (resolution.kind !== 'snap') return;
		// Dragged door end edge lands on the other door start edge: 2.1 + 0.9 = 3.0.
		expect(resolution.candidate).toMatchObject({ kind: 'opening-edge', sourceId: 'other#start' });
		expect(resolution.candidate.offset).toBeCloseTo(2.1, 6);
	});

	it('resolves in the authored segment frame for a reversed shared wall', () => {
		const geometry = emptyGeometry();
		// Host wall authored (6,0) → (0,0) (room traverses right-to-left);
		// the other opening sits at authored offset 3.0..3.9 (world x 3.0..2.1).
		const reversedHost = { segmentId: 'w', start: [6, 0] as [number, number], end: [0, 0] as [number, number] };
		geometry.queries.spans.push(openingSpan('other', 'w', [3, 0], [2.1, 0]));
		const resolution = resolveOpeningDragSnap(geometry, reversedHost, 'door', 2.9, 0.9, {
			pixelsPerMeter: 50,
			snapRadiusCssPx: 100
		});
		expect(resolution.kind).toBe('snap');
		if (resolution.kind !== 'snap') return;
		expect(resolution.candidate).toMatchObject({ kind: 'opening-edge', sourceId: 'other#start' });
		expect(resolution.candidate.offset).toBeCloseTo(2.1, 6);
	});

	it('returns none when the acquisition radius is invalid', () => {
		const resolution = resolveOpeningDragSnap(emptyGeometry(), host, 'door', 0.53, 0.9, { pixelsPerMeter: 0 });
		expect(resolution.kind).toBe('none');
	});
});
