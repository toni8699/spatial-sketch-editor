/**
 * P23.6H — Vertical Wall Semantics (core domain + compiler + compatibility).
 *
 * `LayoutWall.height` is the authoritative physical Wall height:
 *
 * ```text
 * bottomY = floor.elevation
 * topY    = floor.elevation + wall.height
 * 0 < wall.height <= floor.height
 * ```
 *
 * This suite pins the four things the slice exists for:
 * 1. the **birth rule** — a new Wall is born at the document Floor height, with
 *    no fixed literal default anywhere on a Wall-birth path;
 * 2. **historical compatibility** — a pre-H (`formatVersion: 4`) payload keeps its
 *    previously visible Floor-derived extent, normalized once at the compatible
 *    decode boundary;
 * 3. **one compiler path** — compiled Wall vertical bounds/sections follow
 *    `wall.height`, while Room/Floor envelopes stay Floor-derived;
 * 4. **one edit operation** — `planExactWallHeight` rejects (never clamps) and
 *    leaves Wall/Junction/Opening/Room identity and topology untouched.
 */
import { describe, expect, it } from 'vitest';

import {
	compileWallFirstLayoutGeometry,
	decodeLayoutJsonCompatible,
	decodeLayoutValueCompatible,
	LAYOUT_PRE_AUTHORITATIVE_WALL_HEIGHT_FORMAT_VERSION,
	LAYOUT_WALL_FIRST_FORMAT_VERSION,
	migrateLegacyLayoutDocument,
	normalizePreHWallFirstLayout,
	planDuplicateIsolatedRoom,
	planExactWallHeight,
	planWallChain,
	planWallSegment,
	planWallSubdivision,
	serializeWallFirstLayoutDocument,
	validateWallFirstLayoutDocument,
	validateWallFirstWallHeights,
	wallFirstCanonicalFormatVersionIssue,
	WALL_HEIGHT_EPSILON,
	type LayoutDocument,
	type LayoutDocumentWallFirst,
	type LayoutVec2
} from '@portfolio/layout-core';

/** Deterministic noding allocator (test-local; mirrors the editor's shape). */
const testAllocator = {
	nextWallId(base: LayoutDocumentWallFirst, seed: string): string {
		const taken = new Set(base.walls.map((wall) => wall.id));
		if (!taken.has(seed)) return seed;
		let index = 2;
		while (taken.has(`${seed}.${index}`)) index += 1;
		return `${seed}.${index}`;
	},
	nextJunctionId(base: LayoutDocumentWallFirst, seed: string): string {
		const taken = new Set(base.junctions.map((junction) => junction.id));
		if (!taken.has(seed)) return seed;
		let index = 2;
		while (taken.has(`${seed}:${index}`)) index += 1;
		return `${seed}:${index}`;
	}
};

/**
 * One closed rectangular Room (4×3 m) with four boundary Walls, in the current
 * canonical format. Wall/junction ids are stable so tests can address them.
 */
function rectangleDocument(options: {
	floorHeight?: number;
	elevation?: number;
	wallHeight?: number;
} = {}): LayoutDocumentWallFirst {
	const floorHeight = options.floorHeight ?? 3;
	const wallHeight = options.wallHeight ?? floorHeight;
	const corners: Array<[string, number, number]> = [
		['j1', 0, 0],
		['j2', 4, 0],
		['j3', 4, 3],
		['j4', 0, 3]
	];
	return {
		units: 'meters',
		formatVersion: LAYOUT_WALL_FIRST_FORMAT_VERSION,
		floor: { id: 'floor-1', name: 'Floor 1', elevation: options.elevation ?? 0, height: floorHeight },
		junctions: corners.map(([id, x, z]) => ({ id, point: [x, z] as LayoutVec2 })),
		walls: [
			['w1', 'j1', 'j2'],
			['w2', 'j2', 'j3'],
			['w3', 'j3', 'j4'],
			['w4', 'j4', 'j1']
		].map(([id, startJunctionId, endJunctionId]) => ({
			id,
			startJunctionId,
			endJunctionId,
			role: 'boundary' as const,
			thickness: 0.2,
			height: wallHeight
		})),
		rooms: [
			{
				id: 'room-a',
				name: 'Room A',
				boundary: [
					{ wallId: 'w1', direction: 'forward' },
					{ wallId: 'w2', direction: 'forward' },
					{ wallId: 'w3', direction: 'forward' },
					{ wallId: 'w4', direction: 'forward' }
				],
				floorThickness: 0.1,
				ceilingThickness: 0.1
			}
		],
		openings: [],
		objects: []
	};
}

function withOpening(
	document: LayoutDocumentWallFirst,
	opening: { id: string; wallId: string; sillHeight: number; height: number; width?: number; offset?: number }
): LayoutDocumentWallFirst {
	return {
		...document,
		openings: [
			{
				id: opening.id,
				wallId: opening.wallId,
				kind: 'door',
				offset: opening.offset ?? 1,
				width: opening.width ?? 0.9,
				height: opening.height,
				sillHeight: opening.sillHeight,
				profile: 'rectangular'
			}
		]
	};
}

/** Reserialize a document at an explicit (historical) format version. */
function asHistoricalPayload(document: LayoutDocumentWallFirst): unknown {
	return JSON.parse(
		JSON.stringify({ ...document, formatVersion: LAYOUT_PRE_AUTHORITATIVE_WALL_HEIGHT_FORMAT_VERSION })
	);
}

function wallById(document: LayoutDocumentWallFirst, wallId: string) {
	const wall = document.walls.find((candidate) => candidate.id === wallId);
	if (!wall) throw new Error(`missing wall ${wallId}`);
	return wall;
}

describe('P23.6H birth rule — a new Wall is born at the document Floor height', () => {
	it('births every chain Wall at the Floor height, never a fixed default', () => {
		const baseline: LayoutDocumentWallFirst = {
			...rectangleDocument({ floorHeight: 4 }),
			junctions: [],
			walls: [],
			rooms: [],
			openings: []
		};
		const plan = planWallChain({
			baseline,
			points: [
				[0, 0],
				[4, 0],
				[4, 3],
				[0, 3]
			],
			close: true,
			role: 'boundary'
		});
		if (plan.kind !== 'success') throw new Error(`expected success: ${JSON.stringify(plan)}`);
		expect(plan.document.walls.length).toBeGreaterThan(0);
		for (const wall of plan.document.walls) {
			expect(wall.height).toBe(4);
		}
	});

	it('births a single Wall segment at the Floor height too', () => {
		const baseline: LayoutDocumentWallFirst = {
			...rectangleDocument({ floorHeight: 2.5 }),
			junctions: [],
			walls: [],
			rooms: [],
			openings: []
		};
		const plan = planWallSegment({
			baseline,
			start: [0, 0],
			end: [3, 0],
			role: 'partition'
		});
		if (plan.kind !== 'success') throw new Error(`expected success: ${JSON.stringify(plan)}`);
		expect(plan.document.walls.map((wall) => wall.height)).toEqual([2.5]);
	});

	it('still honors an explicit height override', () => {
		const baseline: LayoutDocumentWallFirst = {
			...rectangleDocument({ floorHeight: 3 }),
			junctions: [],
			walls: [],
			rooms: [],
			openings: []
		};
		const plan = planWallSegment({
			baseline,
			start: [0, 0],
			end: [3, 0],
			role: 'partition',
			height: 1.2
		});
		if (plan.kind !== 'success') throw new Error(`expected success: ${JSON.stringify(plan)}`);
		expect(plan.document.walls[0]!.height).toBe(1.2);
	});

	it('rejects with a named code when the Floor frame cannot supply a birth height', () => {
		const baseline: LayoutDocumentWallFirst = {
			...rectangleDocument({ floorHeight: 0 }),
			junctions: [],
			walls: [],
			rooms: [],
			openings: []
		};
		const plan = planWallSegment({ baseline, start: [0, 0], end: [3, 0], role: 'partition' });
		if (plan.kind !== 'rejected') throw new Error('expected rejection');
		expect(plan.rejection.code).toBe('invalid_floor_height');
	});

	it('preserves the source height through a Wall split', () => {
		const document = rectangleDocument({ wallHeight: 1.5 });
		// Subdivide w1 (length 4 from j1) at 2 m.
		const plan = planWallSubdivision(document, 'w1', 2, testAllocator);
		if (plan.kind !== 'success') throw new Error(`expected success: ${JSON.stringify(plan)}`);
		for (const wall of plan.document.walls) {
			expect(wall.height).toBe(1.5);
		}
	});

	it('preserves the source height through an isolated Room duplicate', () => {
		const document = rectangleDocument({ wallHeight: 1.5 });
		const plan = planDuplicateIsolatedRoom(document, { roomId: 'room-a', delta: [10, 0] });
		if (plan.kind !== 'success') throw new Error(`expected success: ${JSON.stringify(plan)}`);
		expect(plan.createdWallIds.length).toBeGreaterThan(0);
		for (const wallId of plan.createdWallIds) {
			expect(wallById(plan.document, wallId).height).toBe(1.5);
		}
	});
});

describe('P23.6H historical compatibility — pre-H documents keep their visible extent', () => {
	it('a format-4 Wall above the Floor height normalizes to the old visible extent', () => {
		// Pre-H reality: a fixed `height: 3` birth default on a 2.5 m Floor still
		// rendered 2.5 m tall (the compiler used the Floor envelope). Reading the
		// stored value as author intent would suddenly render 3 m.
		const historical = { ...rectangleDocument({ floorHeight: 2.5, wallHeight: 3 }) };
		const decoded = decodeLayoutJsonCompatible(JSON.stringify(asHistoricalPayload(historical)));
		if (decoded.kind !== 'wall-first') throw new Error(`expected wall-first: ${JSON.stringify(decoded)}`);
		expect(decoded.migratedFromVersion).toBe(LAYOUT_PRE_AUTHORITATIVE_WALL_HEIGHT_FORMAT_VERSION);
		expect(decoded.document.formatVersion).toBe(LAYOUT_WALL_FIRST_FORMAT_VERSION);
		for (const wall of decoded.document.walls) {
			expect(wall.height).toBe(2.5);
		}
		// …and the normalized document compiles to the old visible top.
		const compiled = compileWallFirstLayoutGeometry(decoded.document);
		expect(compiled.geometry.walls[0]!.bounds3.max[1]).toBe(2.5);
	});

	it('a format-4 Wall already at the Floor height is unchanged by normalization', () => {
		const historical = rectangleDocument({ floorHeight: 3, wallHeight: 3 });
		const decoded = decodeLayoutValueCompatible(asHistoricalPayload(historical));
		if (decoded.kind !== 'wall-first') throw new Error('expected wall-first');
		expect(normalizePreHWallFirstLayout(historical)).toEqual({
			...historical,
			formatVersion: LAYOUT_WALL_FIRST_FORMAT_VERSION
		});
		expect(decoded.document.walls).toEqual(historical.walls);
	});

	it('keeps the pre-H codec rule (positive height only) and does not reject above-Floor values', () => {
		const historical = { ...rectangleDocument({ floorHeight: 2.5, wallHeight: 3 }) };
		const result = validateWallFirstLayoutDocument(asHistoricalPayload(historical));
		expect(result.success).toBe(true);
	});

	it('applies the range rule to the current format payload', () => {
		const current = rectangleDocument({ floorHeight: 2.5, wallHeight: 3 });
		const result = validateWallFirstLayoutDocument(current);
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(result.issues.map((issue) => issue.code)).toContain('wall_height_exceeds_floor');
	});

	it('normalization is pure and deterministic', () => {
		const historical = asHistoricalPayload(rectangleDocument({ floorHeight: 2.5, wallHeight: 3 }));
		const first = normalizePreHWallFirstLayout(historical as LayoutDocumentWallFirst);
		const second = normalizePreHWallFirstLayout(historical as LayoutDocumentWallFirst);
		expect(first).toEqual(second);
		expect(first.formatVersion).toBe(LAYOUT_WALL_FIRST_FORMAT_VERSION);
		expect(historical).toMatchObject({ formatVersion: 4 });
	});

	it('canonical Save validation sees the current format after a format-4 compatible load', () => {
		// S1b boundary assertion: normalization happens once, at the compatible
		// read/decode boundary — the canonical Save path receives current-format
		// state and never needs a normalization branch of its own.
		const historical = asHistoricalPayload(rectangleDocument({ floorHeight: 2.5, wallHeight: 3 }));
		const decoded = decodeLayoutValueCompatible(historical);
		if (decoded.kind !== 'wall-first') throw new Error('expected wall-first');
		expect(decoded.document.formatVersion).toBe(LAYOUT_WALL_FIRST_FORMAT_VERSION);
		expect(validateWallFirstLayoutDocument(decoded.document).success).toBe(true);
		expect(serializeWallFirstLayoutDocument(decoded.document)).toContain(
			`"formatVersion": ${LAYOUT_WALL_FIRST_FORMAT_VERSION}`
		);
	});

	it('canonical writers reject a raw pre-H payload by name instead of migrating it', () => {
		// S1b invariant, the fail-closed half: normalization happens exactly once,
		// at the compatible read boundary. A pre-H document that reaches a
		// canonical writer without passing through it must reject — persisting it
		// would silently reinterpret pre-H `wall.height` values as authored intent.
		const historical = asHistoricalPayload(rectangleDocument({ floorHeight: 2.5, wallHeight: 3 }));
		expect(wallFirstCanonicalFormatVersionIssue(historical)?.code).toBe(
			'unsupported_format_version'
		);
		expect(() => serializeWallFirstLayoutDocument(historical)).toThrowError(
			/Canonical Layout Save requires formatVersion 5/
		);
		// The compatible read path is what makes the same payload writable, and the
		// canonical writer then receives current-format state.
		const decoded = decodeLayoutValueCompatible(historical);
		if (decoded.kind !== 'wall-first') throw new Error('expected wall-first');
		expect(serializeWallFirstLayoutDocument(decoded.document)).toContain(
			`"formatVersion": ${LAYOUT_WALL_FIRST_FORMAT_VERSION}`
		);
	});

	it('still rejects an unknown format version by name', () => {
		const unknown = decodeLayoutValueCompatible({
			...rectangleDocument(),
			formatVersion: 9
		});
		expect(unknown.kind).toBe('unrecognized');
		if (unknown.kind !== 'unrecognized') return;
		expect(unknown.reason).toBe('unsupported-format-version');
	});
});

describe('P23.6H range and validation', () => {
	it('reports every invalid Wall height in document order', () => {
		const document = rectangleDocument({ wallHeight: 1 });
		document.walls[1]!.height = 0;
		document.walls[3]!.height = 5;
		const issues = validateWallFirstWallHeights(document);
		expect(issues.map((issue) => [issue.wallId, issue.code])).toEqual([
			['w2', 'wall_height_invalid'],
			['w4', 'wall_height_exceeds_floor']
		]);
	});

	it('accepts exactly the Floor height and the epsilon boundary', () => {
		const document = rectangleDocument({ floorHeight: 3, wallHeight: 3 + WALL_HEIGHT_EPSILON / 2 });
		expect(validateWallFirstWallHeights(document)).toEqual([]);
	});

	it('rejects zero, negative and non-finite heights in the current format', () => {
		for (const height of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
			const document = rectangleDocument({ wallHeight: 1 });
			document.walls[0]!.height = height;
			const result = validateWallFirstLayoutDocument(document);
			expect(result.success).toBe(false);
		}
	});
});

/**
 * The Floor envelope is a **document-level Wall rule**, not a Room-boundary rule.
 * A freestanding partition — no Room references it, so no Room-boundary path can
 * supply the cap — is bounded by the same `floor.height` (D2/D3: the Floor is the
 * birth default *and* the Floor-level vertical envelope). Nothing in
 * `layout-wall-heights.ts` reads Room membership; this pins that explicitly so the
 * standalone case can never drift into a separate rule.
 */
describe('P23.6H standalone (non-room-bounding) Walls share the Floor envelope', () => {
	function standalonePartitionDocument(floorHeight: number, wallHeight: number): LayoutDocumentWallFirst {
		const document = rectangleDocument({ floorHeight });
		return {
			...document,
			rooms: [],
			walls: [{ ...document.walls[0]!, role: 'partition', height: wallHeight }]
		};
	}

	it('caps a freestanding partition Wall by the Floor height at the codec', () => {
		const document = standalonePartitionDocument(3, 3.5);
		expect(document.rooms).toEqual([]);
		const result = validateWallFirstLayoutDocument(document);
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(result.issues.map((issue) => issue.code)).toContain('wall_height_exceeds_floor');
	});

	it('binds the freestanding Wall to the same Floor height at the exact Height planner', () => {
		const document = standalonePartitionDocument(3, 1.2);
		const taller = planExactWallHeight(document, 'w1', 4);
		if (taller.kind !== 'rejected') throw new Error(`expected rejection: ${JSON.stringify(taller)}`);
		expect(taller.rejection.code).toBe('invalid_value');
		expect(taller.rejection.message).toContain('Floor height 3');

		// The reachable range for every Wall is 0 < height <= floor.height: shorter
		// than the storey works, taller than the storey does not.
		const shorter = planExactWallHeight(document, 'w1', 2.4);
		if (shorter.kind !== 'success') throw new Error(`expected success: ${JSON.stringify(shorter)}`);
		expect(shorter.document.walls[0]!.height).toBe(2.4);

		const full = planExactWallHeight(document, 'w1', 3);
		if (full.kind !== 'success') throw new Error(`expected success: ${JSON.stringify(full)}`);
		expect(full.document.walls[0]!.height).toBe(3);
	});

	it('raises the reachable Wall height when the document Floor is taller', () => {
		// Same freestanding Wall, taller storey: the cap is the document envelope,
		// not a hard-coded 3 m. (A taller Floor arrives through import/migration
		// today; wall-first Floor-height editing is deferred — D5.)
		const document = standalonePartitionDocument(4.5, 1.2);
		const taller = planExactWallHeight(document, 'w1', 4);
		if (taller.kind !== 'success') throw new Error(`expected success: ${JSON.stringify(taller)}`);
		expect(taller.document.walls[0]!.height).toBe(4);
	});
});

describe('P23.6H compiler — compiled Wall vertical extent follows wall.height', () => {
	it('ends a Wall at floor.elevation + wall.height, not at the Floor top', () => {
		const document = rectangleDocument({ floorHeight: 3, elevation: 2, wallHeight: 1.5 });
		const compiled = compileWallFirstLayoutGeometry(document);
		const wall = compiled.geometry.walls.find((candidate) => candidate.wallId === 'w1')!;
		expect(wall.height).toBe(1.5);
		expect(wall.bounds3.min[1]).toBe(2);
		expect(wall.bounds3.max[1]).toBe(3.5);
		// The Floor envelope is 2 … 5; the Wall deliberately stops short of it.
		expect(wall.bounds3.max[1]).not.toBe(2 + 3);
	});

	it('changes compiled bounds and the physical-Wall cacheKey when only height changes', () => {
		const short = compileWallFirstLayoutGeometry(rectangleDocument({ wallHeight: 1.2 }));
		const tall = compileWallFirstLayoutGeometry(rectangleDocument({ wallHeight: 2.6 }));
		const shortWall = short.geometry.walls.find((wall) => wall.wallId === 'w1')!;
		const tallWall = tall.geometry.walls.find((wall) => wall.wallId === 'w1')!;
		expect(shortWall.bounds3.max[1]).toBe(1.2);
		expect(tallWall.bounds3.max[1]).toBe(2.6);
		expect(shortWall.id).toBe(tallWall.id);
		expect(shortWall.cacheKey).not.toBe(tallWall.cacheKey);
		// X/Z geometry and identity are untouched by a height-only change.
		expect(shortWall.bounds2).toEqual(tallWall.bounds2);
		expect(shortWall.length).toBe(tallWall.length);
	});

	it('does not lower the Room ceiling, the Floor envelope or the Room bounds', () => {
		const short = compileWallFirstLayoutGeometry(
			rectangleDocument({ floorHeight: 3, elevation: 1, wallHeight: 1 })
		);
		const full = compileWallFirstLayoutGeometry(
			rectangleDocument({ floorHeight: 3, elevation: 1, wallHeight: 3 })
		);
		const shortRoom = short.geometry.rooms.find((candidate) => candidate.roomId === 'room-a')!;
		const fullRoom = full.geometry.rooms.find((candidate) => candidate.roomId === 'room-a')!;
		// Room/Floor envelopes are Floor-derived and identical either way: a
		// partial-height boundary Wall never lowers them.
		expect(shortRoom.ceilingElevation).toBe(4);
		expect(shortRoom.ceilingElevation).toBe(fullRoom.ceilingElevation);
		expect(shortRoom.bounds3).toEqual(fullRoom.bounds3);
		expect(short.geometry.floors[0]!.bounds3).toEqual(full.geometry.floors[0]!.bounds3);
		expect(short.geometry.bounds).toEqual(full.geometry.bounds);
		// …while the physical Wall tops genuinely differ.
		expect(short.geometry.walls.find((wall) => wall.wallId === 'w1')!.bounds3.max[1]).toBe(2);
		expect(full.geometry.walls.find((wall) => wall.wallId === 'w1')!.bounds3.max[1]).toBe(4);
	});

	it('validates an Opening against its hosting Wall in the compiler gate as well', () => {
		// Defensive: the compiler-side rule is host-Wall based too, so a document
		// that reached the compiler without the document-level Opening-set gate
		// still cannot render an Opening through a partial-height Wall.
		const document = withOpening(rectangleDocument({ floorHeight: 3, wallHeight: 1 }), {
			id: 'door-1',
			wallId: 'w1',
			sillHeight: 1.2,
			height: 0.5
		});
		const compiled = compileWallFirstLayoutGeometry(document);
		const blocking = compiled.issues.filter((issue) => issue.severity !== 'warning');
		expect(blocking.map((issue) => issue.code)).toContain('opening_over_height');
		expect(blocking[0]!.message).toContain('w1');
	});

	it('compiles a partial-height Wall with a fitting Opening cleanly', () => {
		const document = withOpening(rectangleDocument({ floorHeight: 3, wallHeight: 2.4 }), {
			id: 'door-1',
			wallId: 'w1',
			sillHeight: 0,
			height: 2.1
		});
		const compiled = compileWallFirstLayoutGeometry(document);
		expect(compiled.issues.filter((issue) => issue.severity !== 'warning')).toEqual([]);
		expect(compiled.geometry.walls.find((wall) => wall.wallId === 'w1')!.bounds3.max[1]).toBe(2.4);
	});
});

describe('P23.6H exact height operation', () => {
	it('sets the height, preserves identity and leaves the Opening untouched', () => {
		const document = withOpening(rectangleDocument({ floorHeight: 3 }), {
			id: 'door-1',
			wallId: 'w1',
			sillHeight: 0,
			height: 2.1,
			offset: 1.5,
			width: 0.8
		});
		const before = snapshot(document);
		const plan = planExactWallHeight(document, 'w1', 2.4);
		if (plan.kind !== 'success') throw new Error(`expected success: ${JSON.stringify(plan)}`);
		expect(plan.operation).toBe('wall-height');
		expect(plan.changedWallIds).toEqual(['w1']);
		expect(wallById(plan.document, 'w1').height).toBe(2.4);
		// One field changed: the rest of the document is byte-identical.
		expect({ ...plan.document, walls: plan.document.walls.map((wall) => ({ ...wall, height: 3 })) }).toEqual(
			document
		);
		expect(plan.document.openings).toEqual(document.openings);
		expectUnchanged(document, before);
	});

	it('accepts a height exactly equal to the opening top (epsilon boundary)', () => {
		const document = withOpening(rectangleDocument({ floorHeight: 3 }), {
			id: 'door-1',
			wallId: 'w1',
			sillHeight: 0,
			height: 2.1
		});
		const plan = planExactWallHeight(document, 'w1', 2.1);
		expect(plan.kind).toBe('success');
	});

	it('rejects a Wall lowered below its hosted Opening instead of clamping or resizing it', () => {
		const document = withOpening(rectangleDocument({ floorHeight: 3 }), {
			id: 'door-1',
			wallId: 'w1',
			sillHeight: 0.4,
			height: 2.1
		});
		const before = snapshot(document);
		const plan = planExactWallHeight(document, 'w1', 1);
		if (plan.kind !== 'rejected') throw new Error('expected rejection');
		expect(plan.rejection.code).toBe('wall_height_below_opening');
		expect(plan.rejection.message).toContain('w1');
		expect(plan.rejection.message).toContain('door-1');
		expectUnchanged(document, before);
	});

	it('rejects above the Floor envelope without clamping', () => {
		const document = rectangleDocument({ floorHeight: 2.5 });
		const before = snapshot(document);
		const plan = planExactWallHeight(document, 'w1', 3);
		if (plan.kind !== 'rejected') throw new Error('expected rejection');
		expect(plan.rejection.code).toBe('invalid_value');
		expect(plan.rejection.message).toContain('Floor height 2.5');
		expectUnchanged(document, before);
	});

	it('rejects non-finite, zero and negative values', () => {
		const document = rectangleDocument();
		for (const height of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
			const plan = planExactWallHeight(document, 'w1', height);
			if (plan.kind !== 'rejected') throw new Error('expected rejection');
			expect(plan.rejection.code).toBe('invalid_value');
		}
	});

	it('rejects a no-op and an unknown Wall', () => {
		const document = rectangleDocument({ wallHeight: 1.5 });
		const noOp = planExactWallHeight(document, 'w1', 1.5);
		if (noOp.kind !== 'rejected') throw new Error('expected rejection');
		expect(noOp.rejection.code).toBe('no_op');
		const missing = planExactWallHeight(document, 'wall-missing', 1);
		if (missing.kind !== 'rejected') throw new Error('expected rejection');
		expect(missing.rejection.code).toBe('unknown_wall');
	});
});

describe('P23.6H topology purity — height is not topology', () => {
	it('preserves Room, Wall, Junction and Opening identity, role and boundary cycle', () => {
		const document = withOpening(rectangleDocument({ floorHeight: 3, wallHeight: 1.2 }), {
			id: 'door-1',
			wallId: 'w1',
			sillHeight: 0,
			height: 0.9
		});
		const plan = planExactWallHeight(document, 'w2', 2.8);
		if (plan.kind !== 'success') throw new Error(`expected success: ${JSON.stringify(plan)}`);
		expect(plan.document.rooms).toEqual(document.rooms);
		expect(plan.document.openings).toEqual(document.openings);
		expect(plan.document.junctions).toEqual(document.junctions);
		expect(plan.document.rooms.map((room) => room.id)).toEqual(['room-a']);
		expect(plan.document.walls.map((wall) => wall.role)).toEqual(['boundary', 'boundary', 'boundary', 'boundary']);
		expect(plan.document.walls.map((wall) => wall.id)).toEqual(['w1', 'w2', 'w3', 'w4']);
		// Exactly one Wall height changed; every other Wall keeps its value.
		expect(plan.document.walls.map((wall) => wall.height)).toEqual([1.2, 2.8, 1.2, 1.2]);
	});

	it('does not alter face extraction / Room correspondence inputs', () => {
		const document = rectangleDocument({ floorHeight: 3, wallHeight: 3 });
		const plan = planExactWallHeight(document, 'w1', 1);
		if (plan.kind !== 'success') throw new Error('expected success');
		// Same boundary references, same directed cycle: reconciliation sees the
		// identical topology and can only preserve the Room.
		expect(plan.document.rooms[0]!.boundary).toEqual(document.rooms[0]!.boundary);
		expect(plan.document.junctions).toEqual(document.junctions);
		expect(plan.document.walls.map((wall) => [wall.startJunctionId, wall.endJunctionId])).toEqual(
			document.walls.map((wall) => [wall.startJunctionId, wall.endJunctionId])
		);
	});
});

describe('P23.6H legacy migration', () => {
	it('births migrated Walls at the Floor height and writes the current format', () => {
		const legacy: LayoutDocument = {
			units: 'meters',
			floors: [
				{
					id: 'floor-1',
					name: 'Floor 1',
					elevation: 0,
					height: 3.2,
					rooms: [
						{
							id: 'room-a',
							name: 'Room A',
							wallThickness: 0.2,
							floorThickness: 0.1,
							ceilingThickness: 0.1,
							frame: { origin: [0, 0], yaw: 0 },
							boundary: {
								closed: true,
								segments: [
									{ id: 's1', kind: 'line', start: [0, 0], end: [4, 0] },
									{ id: 's2', kind: 'line', start: [4, 0], end: [4, 3] },
									{ id: 's3', kind: 'line', start: [4, 3], end: [0, 3] },
									{ id: 's4', kind: 'line', start: [0, 3], end: [0, 0] }
								]
							},
							openings: []
						}
					]
				}
			],
			objects: []
		};
		const migration = migrateLegacyLayoutDocument(legacy);
		if (migration.kind !== 'success') throw new Error(`expected migration: ${JSON.stringify(migration)}`);
		expect(migration.document.formatVersion).toBe(LAYOUT_WALL_FIRST_FORMAT_VERSION);
		expect(migration.document.walls.length).toBeGreaterThan(0);
		for (const wall of migration.document.walls) {
			expect(wall.height).toBe(3.2);
		}
	});
});

/** Snapshot helper: planners must never mutate their input document. */
function snapshot(document: LayoutDocumentWallFirst): string {
	return JSON.stringify(document);
}

/** Frozen input guard: the input document must be byte-identical afterwards. */
function expectUnchanged(document: LayoutDocumentWallFirst, before: string): void {
	expect(snapshot(document)).toBe(before);
}
