/**
 * `layout-snap.ts` — P23.2 centralized, deterministic Plan snapping resolver.
 *
 * Snap truth derives from the canonical compiled query geometry
 * (`CompiledLayoutGeometry.queries`) plus transient gesture context — Plan/SVG
 * code never reconstructs authored geometry for snapping. There are no
 * persistent snap points in the `LayoutDocument`, no persistent constraints,
 * and a snap result never mutates anything by itself.
 *
 * Deterministic winner order (P23.2 plan §Deterministic winner order):
 *
 * ```text
 * tool/context validity
 * → semantic feature priority
 * → screen distance
 * → stable ID/key
 * ```
 *
 * Source-array/render order is never a hidden tie-break: equal-priority,
 * equal-distance candidates resolve by comparing stable identity keys.
 *
 * Pointer acquisition tolerance is not geometry/topology tolerance — the
 * acquisition radius is a fixed CSS-pixel value converted by the current Plan
 * scale, so acquisition stays zoom-stable (50%/100%/200% acquire the same
 * world features at the same screen distances).
 */
import type { LayoutVec2 } from './layout-types';
import type { CompiledLayoutGeometry, CompiledQuerySpan } from './layout-geometry-types';
import { classifyWallIntersection, type TopologySegment } from './layout-wall-topology';

/** Centralized default Plan grid step in meters (P23.2 §Grid step). */
export const LAYOUT_PLAN_GRID_STEP = 0.25;

/** Centralized pointer acquisition radius in CSS pixels (P23.2 H2 default). */
export const LAYOUT_PLAN_SNAP_RADIUS_CSS_PX = 8;

/** Semantic rank per candidate family — lower wins (P23.2 §winner order). */
export type SnapFeatureKind =
	| 'junction'
	| 'wall-midpoint'
	| 'wall-intersection'
	| 'opening-edge'
	| 'wall-span'
	| 'object-bounds-edge'
	| 'object-bounds-center'
	| 'grid'
	| 'orthogonal-guide'
	| 'extension-guide';

const SEMANTIC_RANK: Record<SnapFeatureKind, number> = {
	junction: 0,
	'wall-intersection': 1,
	'wall-midpoint': 2,
	'opening-edge': 3,
	'wall-span': 4,
	'object-bounds-edge': 5,
	'object-bounds-center': 6,
	'orthogonal-guide': 7,
	'extension-guide': 8,
	grid: 9
};

/** Identity of a resolved snap candidate — stable across frames. */
export type SnapCandidate = {
	/** Snapped world point. */
	point: LayoutVec2;
	/** Semantic family. */
	kind: SnapFeatureKind;
	/** Canonical source identity for the winning candidate. */
	sourceId: string;
	/** Distance from the raw pointer, in world units. */
	distance: number;
};

export type SnapInputContext = {
	/** Exclude candidates owned by these canonical IDs (moving targets). */
	excludeSourceIds?: ReadonlySet<string>;
	/** Exclude candidates at these exact world points (self-snapping loops). */
	excludePoints?: readonly LayoutVec2[];
	/** Only candidates from these families (tool/context validity filter). */
	allowedKinds?: readonly SnapFeatureKind[];
};

export type SnapQueryContext = {
	/** Plan scale in pixels per world unit (CSS px per meter). */
	pixelsPerMeter: number;
	/** Acquisition radius override in CSS pixels (default 8). */
	snapRadiusCssPx?: number;
	/** Grid step override in meters (default 0.25). */
	gridStep?: number;
};

export type SnapResolution =
	| {
			kind: 'snap';
			candidate: SnapCandidate;
			/** Guides to render for the winning candidate (transient, session-only). */
			guides: SnapGuide[];
	  }
	| { kind: 'none' };

/**
 * One transient guide line. Session state only — never written to the
 * document, cleared by the editor on cancel/tool/authority changes.
 */
export type SnapGuide = {
	kind: 'orthogonal-x' | 'orthogonal-z' | 'extension' | 'segment';
	/** Guide segment endpoints in world space. */
	start: LayoutVec2;
	end: LayoutVec2;
};

/** Convert the fixed CSS-pixel acquisition radius to world units at this zoom. */
export function snapAcquisitionRadiusWorld(context: SnapQueryContext): number {
	const cssPx = context.snapRadiusCssPx ?? LAYOUT_PLAN_SNAP_RADIUS_CSS_PX;
	const ppm = context.pixelsPerMeter;
	if (!Number.isFinite(cssPx) || cssPx <= 0) return 0;
	if (!Number.isFinite(ppm) || ppm <= 0) return 0;
	return cssPx / ppm;
}

/** Snap one free point to the centralized grid step. */
export function snapToGridStep(point: LayoutVec2, step = LAYOUT_PLAN_GRID_STEP): LayoutVec2 {
	if (!Number.isFinite(step) || step <= 0) return [...point];
	return [Math.round(point[0] / step) * step, Math.round(point[1] / step) * step];
}

function excluded(candidate: SnapCandidate, context: SnapInputContext): boolean {
	if (context.excludeSourceIds?.has(candidate.sourceId)) return true;
	if (context.excludePoints) {
		for (const point of context.excludePoints) {
			if (point[0] === candidate.point[0] && point[1] === candidate.point[1]) return true;
		}
	}
	return false;
}

function stableKey(candidate: SnapCandidate): string {
	return `${SEMANTIC_RANK[candidate.kind]}|${candidate.kind}|${candidate.sourceId}|${candidate.point[0]}|${candidate.point[1]}`;
}

/**
 * Resolve the deterministic winner among candidates:
 * semantic rank → screen distance → stable identity key.
 */
export function pickSnapWinner(
	candidates: readonly SnapCandidate[],
	context: SnapInputContext = {}
): SnapCandidate | null {
	let best: SnapCandidate | null = null;
	let bestKey = '';
	for (const candidate of candidates) {
		if (excluded(candidate, context)) continue;
		if (context.allowedKinds && !context.allowedKinds.includes(candidate.kind)) continue;
		if (!best) {
			best = candidate;
			bestKey = stableKey(candidate);
			continue;
		}
		const rankDiff = SEMANTIC_RANK[candidate.kind] - SEMANTIC_RANK[best.kind];
		const distanceDiff = candidate.distance - best.distance;
		const key = stableKey(candidate);
		if (
			rankDiff < 0 ||
			(rankDiff === 0 && (distanceDiff < 0 || (distanceDiff === 0 && key < bestKey)))
		) {
			best = candidate;
			bestKey = key;
		}
	}
	return best;
}

/** Build endpoint, midpoint, and nearest-span candidates for one straight span. */
export function spanSnapCandidates(
	span: { id: string; start: LayoutVec2; end: LayoutVec2 },
	point: LayoutVec2,
	radius: number
): SnapCandidate[] {
	const candidates: SnapCandidate[] = [];
	const length = Math.hypot(span.end[0] - span.start[0], span.end[1] - span.start[1]);
	const endpoints: Array<[LayoutVec2, 'start' | 'end']> = [
		[span.start, 'start'],
		[span.end, 'end']
	];
	for (const [candidatePoint, key] of endpoints) {
		const distance = Math.hypot(candidatePoint[0] - point[0], candidatePoint[1] - point[1]);
		if (distance <= radius) {
			candidates.push({
				point: [candidatePoint[0], candidatePoint[1]],
				kind: 'junction',
				sourceId: `${span.id}#${key}`,
				distance
			});
		}
	}
	if (length > 0) {
		const midpoint: LayoutVec2 = [
			(span.start[0] + span.end[0]) / 2,
			(span.start[1] + span.end[1]) / 2
		];
		const distance = Math.hypot(midpoint[0] - point[0], midpoint[1] - point[1]);
		if (distance <= radius) {
			candidates.push({
				point: [midpoint[0], midpoint[1]],
				kind: 'wall-midpoint',
				sourceId: span.id,
				distance
			});
		}
	}
	const dx = span.end[0] - span.start[0];
	const dz = span.end[1] - span.start[1];
	const squared = dx * dx + dz * dz;
	const rawT = squared > 0 ? ((point[0] - span.start[0]) * dx + (point[1] - span.start[1]) * dz) / squared : 0;
	const amount = Math.min(1, Math.max(0, rawT));
	const projected: LayoutVec2 = [span.start[0] + dx * amount, span.start[1] + dz * amount];
	const projectedDistance = Math.hypot(projected[0] - point[0], projected[1] - point[1]);
	if (projectedDistance <= radius) {
		candidates.push({
			point: [projected[0], projected[1]],
			kind: 'wall-span',
			sourceId: span.id,
			distance: projectedDistance
		});
	}
	return candidates;
}

/** Opening-edge candidates: the two ends of each opening span. */
export function openingEdgeSnapCandidates(
	span: { id: string; openingId: string; start: LayoutVec2; end: LayoutVec2 },
	point: LayoutVec2,
	radius: number
): SnapCandidate[] {
	const candidates: SnapCandidate[] = [];
	const edges: Array<[LayoutVec2, 'start' | 'end']> = [
		[span.start, 'start'],
		[span.end, 'end']
	];
	for (const [candidatePoint, key] of edges) {
		const distance = Math.hypot(candidatePoint[0] - point[0], candidatePoint[1] - point[1]);
		if (distance <= radius) {
			candidates.push({
				point: [candidatePoint[0], candidatePoint[1]],
				kind: 'opening-edge',
				sourceId: `${span.openingId}#${key}`,
				distance
			});
		}
	}
	return candidates;
}

/** Rotated-object footprint bounds edge + center candidates. */
export function objectBoundsSnapCandidates(
	footprint: readonly LayoutVec2[],
	objectId: string,
	point: LayoutVec2,
	radius: number
): SnapCandidate[] {
	if (footprint.length === 0) return [];
	const candidates: SnapCandidate[] = [];
	const seenEdges = new Set<string>();
	for (let index = 0; index < footprint.length; index += 1) {
		const start = footprint[index]!;
		const end = footprint[(index + 1) % footprint.length]!;
		const midpoint: LayoutVec2 = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
		const edgePoints: Array<[LayoutVec2, string]> = [
			[start, `${index}:start`],
			[end, `${index}:end`],
			[midpoint, `${index}:mid`]
		];
		for (const [candidatePoint, key] of edgePoints) {
			const distance = Math.hypot(candidatePoint[0] - point[0], candidatePoint[1] - point[1]);
			if (distance > radius) continue;
			const dedupe = `${candidatePoint[0]}|${candidatePoint[1]}`;
			if (seenEdges.has(dedupe)) continue;
			seenEdges.add(dedupe);
			candidates.push({
				point: [candidatePoint[0], candidatePoint[1]],
				kind: 'object-bounds-edge',
				sourceId: `${objectId}#${key}`,
				distance
			});
		}
	}
	let centerX = 0;
	let centerZ = 0;
	for (const [x, z] of footprint) {
		centerX += x;
		centerZ += z;
	}
	const center: LayoutVec2 = [centerX / footprint.length, centerZ / footprint.length];
	const centerDistance = Math.hypot(center[0] - point[0], center[1] - point[1]);
	if (centerDistance <= radius) {
		candidates.push({
			point: [center[0], center[1]],
			kind: 'object-bounds-center',
			sourceId: objectId,
			distance: centerDistance
		});
	}
	return candidates;
}

/** Orthogonal guide candidates relative to the active draft anchor. */
export function orthogonalGuideCandidates(
	anchor: LayoutVec2,
	point: LayoutVec2
): SnapCandidate[] {
	const orthoX: LayoutVec2 = [point[0], anchor[1]];
	const orthoZ: LayoutVec2 = [anchor[0], point[1]];
	const distanceX = Math.hypot(orthoX[0] - point[0], orthoX[1] - point[1]);
	const distanceZ = Math.hypot(orthoZ[0] - point[0], orthoZ[1] - point[1]);
	const candidates: SnapCandidate[] = [];
	if (Number.isFinite(distanceX) && distanceX > 0) {
		candidates.push({
			point: orthoX,
			kind: 'orthogonal-guide',
			sourceId: 'orthogonal-x',
			distance: distanceX
		});
	}
	if (Number.isFinite(distanceZ) && distanceZ > 0) {
		candidates.push({
			point: orthoZ,
			kind: 'orthogonal-guide',
			sourceId: 'orthogonal-z',
			distance: distanceZ
		});
	}
	return candidates;
}

/**
 * Valid wall-wall intersection candidates across the compiled wall spans
 * (endpoint-on-interior and proper-crossing classes only). Collinear
 * classes and shared endpoints are skipped: shared endpoints already exist
 * as junction candidates and collinear overlaps are not a single point.
 */
export function wallIntersectionSnapCandidates(
	spans: readonly { id: string; start: LayoutVec2; end: LayoutVec2 }[],
	point: LayoutVec2,
	radius: number
): SnapCandidate[] {
	const candidates: SnapCandidate[] = [];
	for (let first = 0; first < spans.length; first += 1) {
		for (let second = first + 1; second < spans.length; second += 1) {
			const a = spans[first]!;
			const b = spans[second]!;
			const segmentA: TopologySegment = { id: a.id, start: a.start, end: a.end };
			const segmentB: TopologySegment = { id: b.id, start: b.start, end: b.end };
			const classified = classifyWallIntersection(segmentA, segmentB, []);
			if (classified.kind !== 'endpoint-on-interior' && classified.kind !== 'proper-crossing') continue;
			const intersectionPoint = classified.point;
			const distance = Math.hypot(intersectionPoint[0] - point[0], intersectionPoint[1] - point[1]);
			if (distance > radius) continue;
			candidates.push({
				point: [intersectionPoint[0], intersectionPoint[1]],
				kind: 'wall-intersection',
				sourceId: `${a.id}~${b.id}`,
				distance
			});
		}
	}
	return candidates;
}

/**
 * Full resolution over the compiled query geometry: collect candidate
 * families from `geometry.queries`, run the deterministic winner order, and
 * derive the transient guides for the winner. Pure — no mutation, no history.
 */
export function resolveLayoutSnap(
	geometry: CompiledLayoutGeometry,
	point: LayoutVec2,
	context: SnapQueryContext,
	input: SnapInputContext = {}
): SnapResolution {
	const radius = snapAcquisitionRadiusWorld(context);
	if (radius <= 0) return { kind: 'none' };
	const candidates: SnapCandidate[] = [];

	// Junction candidates from compiled query points, deduplicated by exact
	// position (shared junctions compile once per incident room boundary).
	const seenPoints = new Set<string>();
	for (const queryPoint of geometry.queries.points) {
		const key = `${queryPoint.point[0]}|${queryPoint.point[1]}`;
		if (seenPoints.has(key)) continue;
		seenPoints.add(key);
		const distance = Math.hypot(queryPoint.point[0] - point[0], queryPoint.point[1] - point[1]);
		if (distance > radius) continue;
		candidates.push({
			point: [queryPoint.point[0], queryPoint.point[1]],
			kind: 'junction',
			sourceId: queryPoint.sourceId,
			distance
		});
	}

	// Wall endpoint/midpoint/nearest-span candidates. Per-sample spans of one
	// segment merge to the full-length span so candidates reflect authored
	// walls, not sample boundaries.
	const wallSpans = dedupeWallSpans(geometry.queries.spans.filter((span) => span.kind === 'wall'));
	for (const span of wallSpans) {
		candidates.push(...spanSnapCandidates(span, point, radius));
	}
	candidates.push(...wallIntersectionSnapCandidates(wallSpans, point, radius));

	for (const span of geometry.queries.spans) {
		if (span.kind !== 'opening' || !span.openingId) continue;
		candidates.push(
			...openingEdgeSnapCandidates(
				{ id: span.id, openingId: span.openingId, start: span.start, end: span.end },
				point,
				radius
			)
		);
	}

	const footprintsById = new Map<string, LayoutVec2[]>();
	for (const polygon of geometry.queries.polygons) {
		if (polygon.kind !== 'object-footprint' || !polygon.objectId) continue;
		footprintsById.set(
			polygon.objectId,
			polygon.polygon.map((vertex) => [vertex[0], vertex[1]] as LayoutVec2)
		);
	}
	for (const [objectId, footprint] of footprintsById) {
		candidates.push(...objectBoundsSnapCandidates(footprint, objectId, point, radius));
	}

	// Grid fallback — always allowed to win only if nothing semantic is in
	// range, because semantic rank beats it in the winner order.
	const step = context.gridStep ?? LAYOUT_PLAN_GRID_STEP;
	const gridPoint = snapToGridStep(point, step);
	const gridDistance = Math.hypot(gridPoint[0] - point[0], gridPoint[1] - point[1]);
	const gridRadius = Math.max(radius, step / 2);
	if (gridDistance <= gridRadius) {
		candidates.push({
			point: gridPoint,
			kind: 'grid',
			sourceId: 'grid',
			distance: gridDistance
		});
	}

	const winner = pickSnapWinner(candidates, input);
	if (!winner) return { kind: 'none' };
	return { kind: 'snap', candidate: winner, guides: guidesForCandidate(winner) };
}

function guidesForCandidate(candidate: SnapCandidate): SnapGuide[] {
	if (candidate.kind === 'orthogonal-guide') {
		return [
			candidate.sourceId === 'orthogonal-x'
				? { kind: 'orthogonal-z', start: [...candidate.point] as LayoutVec2, end: [...candidate.point] as LayoutVec2 }
				: { kind: 'orthogonal-x', start: [...candidate.point] as LayoutVec2, end: [...candidate.point] as LayoutVec2 }
		];
	}
	return [];
}

/**
 * Merge per-sample wall spans of one segment into the full-length span so
 * candidate generation works on authored walls, not sample boundaries.
 */
function dedupeWallSpans(
	spans: readonly CompiledQuerySpan[]
): Array<{ id: string; start: LayoutVec2; end: LayoutVec2 }> {
	const bySegment = new Map<string, CompiledQuerySpan[]>();
	for (const span of spans) {
		const list = bySegment.get(span.segmentId) ?? [];
		list.push(span);
		bySegment.set(span.segmentId, list);
	}
	const merged: Array<{ id: string; start: LayoutVec2; end: LayoutVec2 }> = [];
	for (const [segmentId, list] of bySegment) {
		const sorted = [...list].sort((a, b) => a.startDistance - b.startDistance);
		const first = sorted[0]!;
		const last = sorted[sorted.length - 1]!;
		merged.push({ id: segmentId, start: [first.start[0], first.start[1]], end: [last.end[0], last.end[1]] });
	}
	return merged;
}

/**
 * Footprint vertex-average center in world X/Z — used by alignment actions
 * for the canonical compiled object bounds reference (not a snap mutation).
 */
export function objectFootprintCenter(footprint: readonly LayoutVec2[]): LayoutVec2 | null {
	if (footprint.length === 0) return null;
	let x = 0;
	let z = 0;
	for (const vertex of footprint) {
		x += vertex[0];
		z += vertex[1];
	}
	return [x / footprint.length, z / footprint.length];
}
