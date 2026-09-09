/**
 * `layout-wall-topology.ts` — P23.8 typed straight-wall intersection
 * classifier (H3 §8) plus the topology diagnostics vocabulary.
 *
 * One renderer-neutral classifier over the `orientXZ` adapter. It answers
 * the semantic question the legacy boolean helper could not (H3 §2):
 *
 * ```text
 * none | shared explicit junction | endpoint-on-interior (T)
 * | proper crossing (X) | collinear endpoint touch | collinear overlap
 * | numerically unstable
 * ```
 *
 * Classification rules (H3 §8):
 * 1. an explicit shared Junction ID wins first — that is a topological
 *    endpoint touch, classified before any orientation math;
 * 2. four robust orientation signs decide proper/T/collinear classes;
 * 3. proper-crossing coordinates use ordinary double line intersection after
 *    robust classification, validated finite + inside both envelopes —
 *    otherwise `unstable`, never a nearest-endpoint snap;
 * 4. no distance tolerance ever decides an orientation sign; proximity only
 *    feeds the separate near-coincident *diagnostic*.
 */
import type { LayoutVec2 } from './layout-types';
import { orientXZ } from './layout-robust-orientation';

/** Typed intersection classification between two straight wall segments. */
export type WallIntersectionKind =
	| 'none'
	| 'shared-explicit-junction'
	| 'endpoint-on-interior'
	| 'proper-crossing'
	| 'collinear-endpoint-touch'
	| 'collinear-overlap'
	| 'invalid';

export type WallIntersection =
	| { kind: 'none' }
	| { kind: 'shared-explicit-junction'; junctionId: string; point: LayoutVec2 }
	| {
			kind: 'endpoint-on-interior';
			/** Wall whose endpoint lies on the other wall. */
			endpointWallId: string;
			/** Wall hosting the T. */
			interiorWallId: string;
			point: LayoutVec2;
	  }
	| { kind: 'proper-crossing'; point: LayoutVec2 }
	| { kind: 'collinear-endpoint-touch'; point: LayoutVec2 }
	| { kind: 'collinear-overlap'; start: LayoutVec2; end: LayoutVec2 }
	| { kind: 'invalid'; reason: string };

/** A resolved input segment: endpoints + authored identity for classification. */
export type TopologySegment = {
	id: string;
	start: LayoutVec2;
	end: LayoutVec2;
};

/**
 * Classify the relationship of two segments. `sharedJunctionIds` carries the
 * Junction IDs already shared by the two authored walls (empty when the walls
 * do not meet at an explicit junction). Classification never merges distinct
 * junction IDs merely because coordinates are close.
 */
export function classifyWallIntersection(
	a: TopologySegment,
	b: TopologySegment,
	sharedJunctionIds: readonly string[] = []
): WallIntersection {
	// Rule 1: explicit shared junction wins before orientation math.
	if (sharedJunctionIds.length > 0) {
		const point = a.start[0] === b.start[0] && a.start[1] === b.start[1] ? a.start
			: a.start[0] === b.end[0] && a.start[1] === b.end[1] ? a.start
			: a.end[0] === b.start[0] && a.end[1] === b.start[1] ? a.end
			: a.end[0] === b.end[0] && a.end[1] === b.end[1] ? a.end
			: undefined;
		if (point !== undefined) {
			return {
				kind: 'shared-explicit-junction',
				junctionId: sharedJunctionIds[0]!,
				point: [point[0], point[1]]
			};
		}
	}

	const oa1 = orientXZ(a.start, a.end, b.start);
	const oa2 = orientXZ(a.start, a.end, b.end);
	const ob1 = orientXZ(b.start, b.end, a.start);
	const ob2 = orientXZ(b.start, b.end, a.end);

	const aCollinear = oa1 === 0 && oa2 === 0;
	const bCollinear = ob1 === 0 && ob2 === 0;

	if (aCollinear || bCollinear) {
		// At least one segment is collinear with the other's supporting line.
		// If only one side is collinear but signs disagree on the other, the
		// geometry is numerically inconsistent — classify by the collinear
		// side's interval logic below.
		return classifyCollinear(a, b, aCollinear && bCollinear);
	}

	// Proper crossing: strictly opposite signs on both segments. A zero sign
	// is not a side — it marks a degenerate touch that rules 4–5 own below
	// (H3 §8 rule 3: "opposite signs", not "different signs").
	if (oa1 * oa2 < 0 && ob1 * ob2 < 0) {
		const point = lineIntersection(a, b);
		if (point === undefined || !withinEnvelope(a, point) || !withinEnvelope(b, point)) {
			return { kind: 'invalid', reason: 'intersection_numeric_unstable' };
		}
		return { kind: 'proper-crossing', point };
	}

	// Endpoint-on-interior (T): exactly one endpoint is robustly collinear
	// with the other segment and strictly inside its span (bounds check via
	// projection onto the host segment's dominant axis).
	const t = endpointOnInterior(a, b);
	if (t) {
		return {
			kind: 'endpoint-on-interior',
			endpointWallId: t.endpointWallId,
			interiorWallId: t.interiorWallId,
			point: t.point
		};
	}
	const tReverse = endpointOnInterior(b, a);
	if (tReverse) {
		return {
			kind: 'endpoint-on-interior',
			endpointWallId: tReverse.interiorWallId,
			interiorWallId: tReverse.endpointWallId,
			point: tReverse.point
		};
	}

	return { kind: 'none' };
}

/** Endpoint of `p` collinear with segment `q` and inside its bounds? */
function endpointOnInterior(
	p: TopologySegment,
	q: TopologySegment
): { endpointWallId: string; interiorWallId: string; point: LayoutVec2 } | undefined {
	const endpoints: Array<[LayoutVec2, 'start' | 'end']> = [
		[p.start, 'start'],
		[p.end, 'end']
	];
	for (const [point] of endpoints) {
		const sideStart = orientXZ(q.start, q.end, point);
		if (sideStart !== 0) continue;
		if (!strictlyWithinBounds(q, point)) continue;
		return { endpointWallId: p.id, interiorWallId: q.id, point: [point[0], point[1]] };
	}
	return undefined;
}

/**
 * Collinear classification via interval projection on the dominant axis
 * (H3 §8 rule 5). Works for full or partial collinearity; when only one
 * segment is robustly collinear with the other's line but the other shows
 * sign disagreement, treat the collinear pair's endpoints on the shared
 * line as the interval.
 */
function classifyCollinear(
	a: TopologySegment,
	b: TopologySegment,
	bothCollinear: boolean
): WallIntersection {
	void bothCollinear;
	// Project onto the dominant axis of the shared direction.
	const dir: LayoutVec2 = [a.end[0] - a.start[0], a.end[1] - a.start[1]];
	const axis = Math.abs(dir[0]) >= Math.abs(dir[1]) ? 0 : 1;
	const other = axis === 0 ? 1 : 0;
	const aMin = Math.min(a.start[axis], a.end[axis]);
	const aMax = Math.max(a.start[axis], a.end[axis]);
	const bMin = Math.min(b.start[axis], b.end[axis]);
	const bMax = Math.max(b.start[axis], b.end[axis]);

	// Disjoint collinear spans.
	if (bMax < aMin || bMin > aMax) {
		return { kind: 'none' };
	}

	const overlapStart = Math.max(aMin, bMin);
	const overlapEnd = Math.min(aMax, bMax);
	// Both segments are robustly collinear with the same supporting line, so
	// the perpendicular coordinate is shared; verify it agrees before
	// interval classification.
	const axisPerp = other;
	if (a.start[axisPerp] !== b.start[axisPerp]) {
		return { kind: 'invalid', reason: 'intersection_numeric_unstable' };
	}

	if (overlapStart === overlapEnd) {
		// Touching at exactly one point of the shared line.
		return {
			kind: 'collinear-endpoint-touch',
			point: axis === 0 ? [overlapStart, a.start[1]] : [a.start[0], overlapStart]
		};
	}

	return {
		kind: 'collinear-overlap',
		start: axis === 0 ? [overlapStart, a.start[1]] : [a.start[0], overlapStart],
		end: axis === 0 ? [overlapEnd, a.start[1]] : [a.start[0], overlapEnd]
	};
}

/** Ordinary double line intersection of the two supporting lines. */
function lineIntersection(a: TopologySegment, b: TopologySegment): LayoutVec2 | undefined {
	const d1x = a.end[0] - a.start[0];
	const d1y = a.end[1] - a.start[1];
	const d2x = b.end[0] - b.start[0];
	const d2y = b.end[1] - b.start[1];
	const denominator = d1x * d2y - d1y * d2x;
	if (denominator === 0) return undefined;
	const t =
		((b.start[0] - a.start[0]) * d2y - (b.start[1] - a.start[1]) * d2x) / denominator;
	if (!Number.isFinite(t)) return undefined;
	return [a.start[0] + t * d1x, a.start[1] + t * d1y];
}

/** Point lies within the segment's bounding envelope (inclusive). */
function withinEnvelope(segment: TopologySegment, point: LayoutVec2): boolean {
	return (
		point[0] >= Math.min(segment.start[0], segment.end[0]) &&
		point[0] <= Math.max(segment.start[0], segment.end[0]) &&
		point[1] >= Math.min(segment.start[1], segment.end[1]) &&
		point[1] <= Math.max(segment.start[1], segment.end[1])
	);
}

/** Point lies strictly inside the segment's span, excluding both endpoints. */
function strictlyWithinBounds(segment: TopologySegment, point: LayoutVec2): boolean {
	if (!withinEnvelope(segment, point)) return false;
	const atStart = point[0] === segment.start[0] && point[1] === segment.start[1];
	const atEnd = point[0] === segment.end[0] && point[1] === segment.end[1];
	return !atStart && !atEnd;
}
