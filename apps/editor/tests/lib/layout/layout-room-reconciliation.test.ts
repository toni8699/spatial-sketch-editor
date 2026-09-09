import { describe, expect, it } from 'vitest';

import type { LayoutVec2 } from '$lib/layout/layout-types';
import { extractBoundaryCandidateFaces } from '$lib/layout/layout-face-extraction';
import {
	reconcileRooms,
	ROOM_CREATION_DEFAULTS,
	type ComponentLineage,
	type RoomIdAllocator
} from '$lib/layout/layout-room-reconciliation';
import {
	LAYOUT_WALL_FIRST_FORMAT_VERSION,
	type LayoutDocumentWallFirst
} from '$lib/layout/layout-wall-first-codec';

type WallSeed = {
	id: string;
	start: string;
	end: string;
	role?: 'boundary' | 'partition';
};

function document(
	junctions: Array<[string, number, number]>,
	walls: WallSeed[]
): Omit<LayoutDocumentWallFirst, 'rooms'> {
	return {
		units: 'meters',
		formatVersion: LAYOUT_WALL_FIRST_FORMAT_VERSION,			junctions: junctions.map(([id, x, z]) => ({ id, point: [x, z] as LayoutVec2 })),
		walls: walls.map((wall) => ({
			id: wall.id,
			startJunctionId: wall.start,
			endJunctionId: wall.end,
			role: wall.role ?? 'boundary',
			thickness: 0.2,
			height: 3
		})),
		openings: [],
		objects: []
	};
}

const RECT_JUNCTIONS: Array<[string, number, number]> = [
	['j-a', 0, 0],
	['j-b', 6, 0],
	['j-c', 6, 4],
	['j-d', 0, 4]
];
const RECT_WALLS: WallSeed[] = [
	{ id: 'wall-a', start: 'j-a', end: 'j-b' },
	{ id: 'wall-b', start: 'j-b', end: 'j-c' },
	{ id: 'wall-c', start: 'j-c', end: 'j-d' },
	{ id: 'wall-d', start: 'j-d', end: 'j-a' }
];

const RECT = document(RECT_JUNCTIONS, RECT_WALLS);
const RECT_FACE = extractBoundaryCandidateFaces({ ...RECT, rooms: [] }).faces[0]!;

/** Two-room noded candidate: 6x4 rectangle split at x=3 by wall-e. */
function twoRoomCandidate(): Omit<LayoutDocumentWallFirst, 'rooms'> {
	return document(
		[
			['j-a', 0, 0],
			['j-m', 3, 0],
			['j-b', 6, 0],
			['j-c', 6, 4],
			['j-n', 3, 4],
			['j-d', 0, 4]
		],
		[
			{ id: 'wall-a1', start: 'j-a', end: 'j-m' },
			{ id: 'wall-a2', start: 'j-m', end: 'j-b' },
			{ id: 'wall-b', start: 'j-b', end: 'j-c' },
			{ id: 'wall-c1', start: 'j-c', end: 'j-n' },
			{ id: 'wall-c2', start: 'j-n', end: 'j-d' },
			{ id: 'wall-d', start: 'j-d', end: 'j-a' },
			{ id: 'wall-e', start: 'j-m', end: 'j-n' }
		]
	);
}

const SPLIT_CANDIDATE = twoRoomCandidate();
const SPLIT_EXTRACTION = extractBoundaryCandidateFaces({ ...SPLIT_CANDIDATE, rooms: [] });
const SPLIT_LEFT_FACE = SPLIT_EXTRACTION.faces.find((face) =>
	face.boundary.some((ref) => ref.wallId === 'wall-e' && ref.direction === 'forward')
)!;
const SPLIT_RIGHT_FACE = SPLIT_EXTRACTION.faces.find((face) =>
	face.boundary.some((ref) => ref.wallId === 'wall-e' && ref.direction === 'reverse')
)!;

function allocator(): RoomIdAllocator {
	let counter = 0;
	return {
		nextRoomId(base) {
			let candidate = `room-new-${++counter}`;
			while (base.rooms.some((room) => room.id === candidate)) {
				candidate = `room-new-${++counter}`;
			}
			return candidate;
		},
		nextRoomName(existing) {
			return `Room ${existing.length + 1}`;
		}
	};
}

function room(
	id: string,
	name: string,
	boundary: Array<{ wallId: string; direction: 'forward' | 'reverse' }>,
	overrides: Partial<{ floorThickness: number; ceilingThickness: number }> = {}
) {
	return {
		id,
		name,
		boundary,
		floorThickness: 0.1,
		ceilingThickness: 0.1,
		...overrides
	};
}

describe('Room reconciliation — safe components (P23.8 / H5)', () => {
	it('creates Rooms from candidate faces with no predecessor (0→1 birth)', () => {
		const result = reconcileRooms({
			baseline: { ...RECT, rooms: [] },
			candidateDocument: RECT,
			extraction: extractBoundaryCandidateFaces({ ...RECT, rooms: [] }),
			components: [{ candidateFaceKeys: [RECT_FACE.key], predecessorRoomIds: [] }],
			allocator: allocator()
		});
		if (!('document' in result)) {
			throw new Error('expected success');
		}
		expect(result.document.rooms).toHaveLength(1);
		expect(result.document.rooms[0]!.floorThickness).toBe(ROOM_CREATION_DEFAULTS.floorThickness);
		expect(result.document.rooms[0]!.ceilingThickness).toBe(
			ROOM_CREATION_DEFAULTS.ceilingThickness
		);
		expect(result.lineage[0]!.kind).toBe('created');
		expect(result.retiredRoomIds).toEqual([]);
	});

	it('preserves identity and metadata on 1→1 correspondence', () => {
		const baseline: LayoutDocumentWallFirst = {
			...RECT,
			rooms: [
				room('room-main', 'Main', RECT_FACE.boundary.map((ref) => ({ ...ref })), {
					floorThickness: 0.15
				})
			]
		};
		const result = reconcileRooms({
			baseline,
			candidateDocument: RECT,
			extraction: extractBoundaryCandidateFaces({ ...RECT, rooms: [] }),
			components: [
				{ candidateFaceKeys: [RECT_FACE.key], predecessorRoomIds: ['room-main'] }
			],
			allocator: allocator()
		});
		if (!('document' in result)) throw new Error('expected success');
		const preserved = result.document.rooms[0]!;
		expect(preserved.id).toBe('room-main');
		expect(preserved.name).toBe('Main');
		expect(preserved.floorThickness).toBe(0.15);
		expect(result.lineage[0]!.kind).toBe('preserved');
	});

	it('resolves a 1→2 split by overlap, then witness; identity stays on the winner', () => {
		const baseline: LayoutDocumentWallFirst = {
			...RECT,
			rooms: [room('room-main', 'Main', RECT_FACE.boundary.map((ref) => ({ ...ref })))]
		};
		const result = reconcileRooms({
			baseline,
			candidateDocument: SPLIT_CANDIDATE,
			extraction: SPLIT_EXTRACTION,
			components: [
				{
					candidateFaceKeys: [SPLIT_LEFT_FACE.key, SPLIT_RIGHT_FACE.key],
					predecessorRoomIds: ['room-main']
				}
			],
			// Equal overlap (12 vs 12): the witness [1, 2] lies strictly inside
			// the left face only, so room-main survives there (H5 §6.2).
			predecessorPolygons: new Map([['room-main', [[0, 0], [6, 0], [6, 4], [0, 4]]]]),
			predecessorWitnesses: new Map([['room-main', [1, 2]]]),
			allocator: allocator()
		});
		if (!('document' in result)) throw new Error('expected success');
		expect(result.document.rooms).toHaveLength(2);
		const survivor = result.document.rooms.find((entry) => entry.id === 'room-main')!;
		expect(survivor.boundary).toEqual(SPLIT_LEFT_FACE.boundary.map((ref) => ({ ...ref })));
		const newborn = result.document.rooms.find((entry) => entry.id !== 'room-main')!;
		expect(newborn.floorThickness).toBe(0.1); // inherited from predecessor
		expect(result.lineage.map((record) => record.kind).sort()).toEqual(['created', 'split-survivor']);
		expect(result.retiredRoomIds).toEqual([]);
	});

	it('breaks split ties by canonical face key when no evidence separates them', () => {
		const baseline: LayoutDocumentWallFirst = {
			...RECT,
			rooms: [room('room-main', 'Main', RECT_FACE.boundary.map((ref) => ({ ...ref })))]
		};
		const result = reconcileRooms({
			baseline,
			candidateDocument: SPLIT_CANDIDATE,
			extraction: SPLIT_EXTRACTION,
			components: [
				{
					candidateFaceKeys: [SPLIT_LEFT_FACE.key, SPLIT_RIGHT_FACE.key],
					predecessorRoomIds: ['room-main']
				}
			],
			allocator: allocator()
		});
		if (!('document' in result)) throw new Error('expected success');
		const survivor = result.document.rooms.find((entry) => entry.id === 'room-main')!;
		// No overlap polygons, no witness → smallest canonical face key wins.
		const smallestKey = [SPLIT_LEFT_FACE.key, SPLIT_RIGHT_FACE.key].sort()[0]!;
		expect(survivor.boundary).toEqual(
			smallestKey === SPLIT_LEFT_FACE.key
				? SPLIT_LEFT_FACE.boundary.map((ref) => ({ ...ref }))
				: SPLIT_RIGHT_FACE.boundary.map((ref) => ({ ...ref }))
		);
	});

	it('merges two rooms into one candidate (2→1) with deterministic survivor and portal collapse', () => {
		const baseline: LayoutDocumentWallFirst = {
			...SPLIT_CANDIDATE,
			rooms: [
				room('room-left', 'Left', SPLIT_LEFT_FACE.boundary.map((ref) => ({ ...ref }))),
				room('room-right', 'Right', SPLIT_RIGHT_FACE.boundary.map((ref) => ({ ...ref })))
			],
			openings: [
				{
					id: 'door-shared',
					wallId: 'wall-e',
					kind: 'door',
					offset: 1,
					width: 0.9,
					height: 2.1,
					sillHeight: 0,
					profile: 'rectangular',
					connectsRoomIds: ['room-left', 'room-right']
				}
			],
			objects: [
				{ id: 'object-1', kind: 'box', position: [4, 0, 2], rotation: [0, 0, 0], dimensions: [1, 1, 1], roomId: 'room-right' }
			]
		};
		const result = reconcileRooms({
			baseline,
			candidateDocument: { ...RECT, openings: baseline.openings, objects: baseline.objects },
			extraction: extractBoundaryCandidateFaces({ ...RECT, rooms: [] }),
			components: [
				{
					candidateFaceKeys: [RECT_FACE.key],
					predecessorRoomIds: ['room-left', 'room-right']
				}
			],
			// Equal contributions → smallest Room ID ('room-left') survives.
			predecessorPolygons: new Map([
				['room-left', [[0, 0], [3, 0], [3, 4], [0, 4]]],
				['room-right', [[3, 0], [6, 0], [6, 4], [3, 4]]]
			]),
			allocator: allocator()
		});
		if (!('document' in result)) throw new Error('expected success');
		expect(result.document.rooms).toHaveLength(1);
		expect(result.document.rooms[0]!.id).toBe('room-left');
		expect(result.retiredRoomIds).toEqual(['room-right']);
		// Object association follows the merge survivor; transform untouched.
		expect(result.document.objects[0]!.roomId).toBe('room-left');
		expect(result.document.objects[0]!.position).toEqual([4, 0, 2]);
		// Portal semantic collapse: both ends map to the survivor, physical
		// door preserved, explicit relation cleared.
		expect(result.document.openings[0]!.id).toBe('door-shared');
		expect(result.document.openings[0]!.connectsRoomIds).toBeUndefined();
		expect(result.lineage[0]!.kind).toBe('merge-survivor');
	});

	it('rejects a merge whose authored surface metadata conflicts (H5 §6.4)', () => {
		const baseline: LayoutDocumentWallFirst = {
			...SPLIT_CANDIDATE,
			rooms: [
				room('room-left', 'Left', SPLIT_LEFT_FACE.boundary.map((ref) => ({ ...ref }))),
				room('room-right', 'Right', SPLIT_RIGHT_FACE.boundary.map((ref) => ({ ...ref })), {
					floorThickness: 0.2
				})
			]
		};
		const result = reconcileRooms({
			baseline,
			candidateDocument: RECT,
			extraction: extractBoundaryCandidateFaces({ ...RECT, rooms: [] }),
			components: [
				{
					candidateFaceKeys: [RECT_FACE.key],
					predecessorRoomIds: ['room-left', 'room-right']
				}
			],
			allocator: allocator()
		});
		expect(result).toEqual({
			kind: 'rejected',
			rejection: expect.objectContaining({ code: 'metadata_merge_conflict' })
		});
	});

	it('retires rooms outside every component and clears their dangling associations', () => {
		// Baseline: two independent rectangles; candidate keeps only rect one.
		const otherJunctions: Array<[string, number, number]> = [
			['j-p', 20, 0],
			['j-q', 26, 0],
			['j-r', 26, 4],
			['j-s', 20, 4]
		];
		const otherWalls: WallSeed[] = [
			{ id: 'wall-p', start: 'j-p', end: 'j-q' },
			{ id: 'wall-q', start: 'j-q', end: 'j-r' },
			{ id: 'wall-r', start: 'j-r', end: 'j-s' },
			{ id: 'wall-s', start: 'j-s', end: 'j-p' }
		];
		const otherFace = extractBoundaryCandidateFaces({
			...document(otherJunctions, otherWalls),
			rooms: []
		}).faces[0]!;
		const baseline: LayoutDocumentWallFirst = {
			...RECT,
			junctions: [...RECT.junctions, ...otherJunctions.map(([id, x, z]) => ({ id, point: [x, z] as LayoutVec2 }))],
			walls: [...RECT.walls, ...otherWalls.map((wall) => ({
				id: wall.id,
				startJunctionId: wall.start,
				endJunctionId: wall.end,
				role: 'boundary' as const,
				thickness: 0.2,
				height: 3
			}))],
			rooms: [
				room('room-keep', 'Keep', RECT_FACE.boundary.map((ref) => ({ ...ref }))),
				room('room-gone', 'Gone', otherFace.boundary.map((ref) => ({ ...ref })))
			],
			objects: [
				{ id: 'object-1', kind: 'box', position: [22, 0, 2], rotation: [0, 0, 0], dimensions: [1, 1, 1], roomId: 'room-gone' }
			]
		};
		const result = reconcileRooms({
			baseline,
			candidateDocument: { ...RECT, objects: baseline.objects },
			extraction: extractBoundaryCandidateFaces({ ...RECT, rooms: [] }),
			components: [{ candidateFaceKeys: [RECT_FACE.key], predecessorRoomIds: ['room-keep'] }],
			allocator: allocator()
		});
		if (!('document' in result)) throw new Error('expected success');
		expect(result.retiredRoomIds).toEqual(['room-gone']);
		// No successor exists (disappearance, not merge) → association cleared.
		expect(result.document.objects[0]!.roomId).toBeUndefined();
	});

	it('rejects an unresolved portal relation on one-sided room disappearance', () => {
		const otherJunctions: Array<[string, number, number]> = [
			['j-p', 20, 0],
			['j-q', 26, 0],
			['j-r', 26, 4],
			['j-s', 20, 4]
		];
		const otherWalls: WallSeed[] = [
			{ id: 'wall-p', start: 'j-p', end: 'j-q' },
			{ id: 'wall-q', start: 'j-q', end: 'j-r' },
			{ id: 'wall-r', start: 'j-r', end: 'j-s' },
			{ id: 'wall-s', start: 'j-s', end: 'j-p' }
		];
		const baseline: LayoutDocumentWallFirst = {
			...RECT,
			junctions: [...RECT.junctions, ...otherJunctions.map(([id, x, z]) => ({ id, point: [x, z] as LayoutVec2 }))],
			walls: [...RECT.walls, ...otherWalls.map((wall) => ({
				id: wall.id,
				startJunctionId: wall.start,
				endJunctionId: wall.end,
				role: 'boundary' as const,
				thickness: 0.2,
				height: 3
			}))],
			rooms: [
				room('room-keep', 'Keep', RECT_FACE.boundary.map((ref) => ({ ...ref }))),
				room('room-gone', 'Gone', [
					{ wallId: 'wall-p', direction: 'forward' },
					{ wallId: 'wall-q', direction: 'forward' },
					{ wallId: 'wall-r', direction: 'forward' },
					{ wallId: 'wall-s', direction: 'forward' }
				])
			],
			// Door declared between a surviving and a disappearing room: the
			// remap is ambiguous for the surviving side → whole command rejects.
			openings: [
				{
					id: 'door-bridge',
					wallId: 'wall-a',
					kind: 'door',
					offset: 1,
					width: 0.9,
					height: 2.1,
					sillHeight: 0,
					profile: 'rectangular',
					connectsRoomIds: ['room-keep', 'room-gone']
				}
			]
		};
		const result = reconcileRooms({
			baseline,
			candidateDocument: { ...RECT, openings: baseline.openings },
			extraction: extractBoundaryCandidateFaces({ ...RECT, rooms: [] }),
			components: [{ candidateFaceKeys: [RECT_FACE.key], predecessorRoomIds: ['room-keep'] }],
			allocator: allocator()
		});
		expect(result).toEqual({
			kind: 'rejected',
			rejection: expect.objectContaining({ code: 'unresolved_portal_remap' })
		});
	});
});

describe('Room reconciliation — rejection guards', () => {
	it('rejects components claiming unknown faces or unknown predecessors', () => {
		const baseline: LayoutDocumentWallFirst = { ...RECT, rooms: [] };
		expect(
			reconcileRooms({
				baseline,
				candidateDocument: RECT,
				extraction: extractBoundaryCandidateFaces({ ...RECT, rooms: [] }),
				components: [{ candidateFaceKeys: ['face-nope'], predecessorRoomIds: [] }],
				allocator: allocator()
			})
		).toEqual({
			kind: 'rejected',
			rejection: expect.objectContaining({ code: 'unsupported_component' })
		});
		expect(
			reconcileRooms({
				baseline,
				candidateDocument: RECT,
				extraction: extractBoundaryCandidateFaces({ ...RECT, rooms: [] }),
				components: [{ candidateFaceKeys: [RECT_FACE.key], predecessorRoomIds: ['room-nope'] }],
				allocator: allocator()
			})
		).toEqual({
			kind: 'rejected',
			rejection: expect.objectContaining({ code: 'unsupported_component' })
		});
	});

	it('rejects a face claimed by two components as ambiguous correspondence', () => {
		const baseline: LayoutDocumentWallFirst = {
			...RECT,
			rooms: [
				room('room-one', 'One', RECT_FACE.boundary.map((ref) => ({ ...ref }))),
				room('room-two', 'Two', RECT_FACE.boundary.map((ref) => ({ ...ref })))
			]
		};
		const result = reconcileRooms({
			baseline,
			candidateDocument: RECT,
			extraction: extractBoundaryCandidateFaces({ ...RECT, rooms: [] }),
			components: [
				{ candidateFaceKeys: [RECT_FACE.key], predecessorRoomIds: ['room-one'] },
				{ candidateFaceKeys: [RECT_FACE.key], predecessorRoomIds: ['room-two'] }
			],
			allocator: allocator()
		});
		expect(result).toEqual({
			kind: 'rejected',
			rejection: expect.objectContaining({ code: 'ambiguous_room_correspondence' })
		});
	});

	it('rejects unsupported component shapes such as 2→2', () => {
		const baseline: LayoutDocumentWallFirst = {
			...RECT,
			rooms: [
				room('room-one', 'One', RECT_FACE.boundary.map((ref) => ({ ...ref }))),
				room('room-two', 'Two', RECT_FACE.boundary.map((ref) => ({ ...ref })))
			]
		};
		const result = reconcileRooms({
			baseline,
			candidateDocument: SPLIT_CANDIDATE,
			extraction: SPLIT_EXTRACTION,
			components: [
				{
					candidateFaceKeys: [SPLIT_LEFT_FACE.key, SPLIT_RIGHT_FACE.key],
					predecessorRoomIds: ['room-one', 'room-two']
				}
			],
			allocator: allocator()
		});
		expect(result).toEqual({
			kind: 'rejected',
			rejection: expect.objectContaining({
				code: 'unsupported_component',
				roomIds: ['room-one', 'room-two']
			})
		});
	});
});
