/**
 * `layout-room-reconciliation.ts` — P23.8 Room correspondence and
 * reconciliation (H5 evidence, product-owned identity).
 *
 * Geometry derives candidate faces; **this module owns persistent Room
 * identity** (H3/H5 hard boundary). Reconciliation runs per affected
 * correspondence component with the H5 evidence order:
 *
 * ```text
 * 1. explicit authoring-operation Wall/Junction lineage
 * 2. candidate-face boundary lineage
 * 3. predecessor/candidate overlap area
 * 4. predecessor interior witness (secondary tie signal only)
 * 5. canonical candidate face key
 * ```
 *
 * Safe automatic components for initial P23:
 *
 * ```text
 * 0 old Rooms → new independent candidate faces (Room birth)
 * 1 old Room  → 1 candidate   (preserved / subdivision 1→1)
 * 1 old Room  → 2 candidates  (simple split)
 * 2 old Rooms → 1 candidate   (simple merge)
 * ```
 *
 * Anything else — `2→3`, `3+→1`, simultaneous split+merge, multiple plausible
 * predecessor assignments, ambiguous lineage — rejects the whole command
 * before state installation. One user operation may contain several
 * independent safe components; every component must reconcile or the entire
 * command rejects.
 *
 * Transaction shape (P23.8): invalid/cancel/no-op → no history. A committed
 * snapshot contains the exact new Junction/Wall/Opening/Room IDs; undo/redo
 * restores snapshots and never reruns matching.
 */
import type {
	LayoutDocumentWallFirst,
	LayoutWallFirstRoom,
	LayoutWallOpening,
	OrientedWallRef
} from './layout-wall-first-types';
import type { LayoutVec2 } from './layout-types';
import {
	type DerivedCandidateFace,
	type FaceExtractionResult,
	faceArea,
	polygonIntersectionArea,
	pointStrictlyInsidePolygon
} from './layout-face-extraction';

/** Why reconciliation rejected; stable machine codes per P23.8 diagnostics. */
export type ReconciliationRejection = {
	code:
		| 'ambiguous_room_correspondence'
		| 'unsupported_component'
		| 'metadata_merge_conflict'
		| 'unresolved_portal_remap'
		| 'unresolved_room_reference';
	message: string;
	faceKey?: string;
	roomIds?: string[];
};

export type RoomLineageRecord = {
	faceKey: string;
	roomId: string;
	predecessorRoomIds: readonly string[];
	kind: 'preserved' | 'split-survivor' | 'merge-survivor' | 'created';
};

export type RoomReconciliation = {
	document: LayoutDocumentWallFirst;
	lineage: readonly RoomLineageRecord[];
	retiredRoomIds: readonly string[];
};

export type ReconciliationFailure = {
	kind: 'rejected';
	rejection: ReconciliationRejection;
};

export type ReconciliationResult = RoomReconciliation | ReconciliationFailure;

/**
 * Declared lineage for one topology-changing operation: which candidate
 * faces descend from which predecessor rooms. Derived from the operation's
 * wall/junction lineage (never from face traversal or room count).
 */
export type ComponentLineage = {
	/** Candidate face keys claimed by this component. */
	candidateFaceKeys: readonly string[];
	/** Predecessor room IDs involved in this component (may be empty for births). */
	predecessorRoomIds: readonly string[];
};

/** Deterministic allocator for new Room IDs/names against the complete candidate document. */
export type RoomIdAllocator = {
	nextRoomId(baseDocument: LayoutDocumentWallFirst, faceKey: string): string;
	/** Deterministic default room name; `existingNames` holds all taken names. */
	nextRoomName(existingNames: readonly string[]): string;
};

/** Current Room creation defaults (P23.8: 0.1 m floor/ceiling). */
export const ROOM_CREATION_DEFAULTS = {
	floorThickness: 0.1,
	ceilingThickness: 0.1
} as const;

/**
 * Reconcile candidate faces against predecessor rooms for one topology
 * operation. `baseline` is the pre-operation document (its rooms are the
 * predecessor rooms); `extraction` is the candidate face output.
 */
export function reconcileRooms(options: {
	baseline: LayoutDocumentWallFirst;
	candidateDocument: Omit<LayoutDocumentWallFirst, 'rooms'>;
	extraction: FaceExtractionResult;
	/** Declared lineage components for this operation. */
	components: readonly ComponentLineage[];
	/** Pre-operation room polygon witnesses by roomId (temporary, never persisted). */
	predecessorWitnesses?: ReadonlyMap<string, LayoutVec2>;
	/** Predecessor boundary polygons by roomId (temporary overlap evidence). */
	predecessorPolygons?: ReadonlyMap<string, readonly LayoutVec2[]>;
	allocator: RoomIdAllocator;
}): ReconciliationResult {
	const { baseline, candidateDocument, extraction, components, allocator } = options;
	const predecessorWitnesses = options.predecessorWitnesses ?? new Map<string, LayoutVec2>();
	const predecessorPolygons =
		options.predecessorPolygons ?? new Map<string, readonly LayoutVec2[]>();
	const predecessorRooms = new Map(baseline.rooms.map((room) => [room.id, room]));
	const facesByKey = new Map(extraction.faces.map((face) => [face.key, face]));

	const claimedFaces = new Set<string>();
	const claimedPredecessors = new Set<string>();
	const lineage: RoomLineageRecord[] = [];
	const retiredRoomIds: string[] = [];
	const finalRooms: LayoutWallFirstRoom[] = [];
	// Baseline names seed the allocator namespace (review round 1): births
	// during multi-component operations must never reuse a pre-existing name.
	const takenNames = new Set(baseline.rooms.map((room) => room.name));

	for (const component of components) {
		for (const faceKey of component.candidateFaceKeys) {
			if (!facesByKey.has(faceKey)) {
				return failure({
					code: 'unsupported_component',
					message: `Component claims unknown candidate face '${faceKey}'`
				});
			}
			if (claimedFaces.has(faceKey)) {
				return failure({
					code: 'ambiguous_room_correspondence',
					message: `Candidate face '${faceKey}' is claimed by multiple components`,
					faceKey
				});
			}
			claimedFaces.add(faceKey);
		}
		for (const predecessorId of component.predecessorRoomIds) {
			if (!predecessorRooms.has(predecessorId)) {
				return failure({
					code: 'unsupported_component',
					message: `Component references unknown predecessor room '${predecessorId}'`
				});
			}
			if (claimedPredecessors.has(predecessorId)) {
				return failure({
					code: 'ambiguous_room_correspondence',
					message: `Predecessor room '${predecessorId}' is claimed by multiple components`,
					roomIds: [predecessorId]
				});
			}
			claimedPredecessors.add(predecessorId);
		}
	}

	// Every candidate face must be claimed by exactly one component (review
	// round 1): an unclaimed face would otherwise silently vanish from the
	// correspondence — the mirror hazard of a double-claimed face.
	for (const face of extraction.faces) {
		if (!claimedFaces.has(face.key)) {
			return failure({
				code: 'unsupported_component',
				message: `Candidate face '${face.key}' is not claimed by any lineage component`,
				faceKey: face.key
			});
		}
	}

	for (const component of components) {
		const predecessorCount = component.predecessorRoomIds.length;
		const candidateCount = component.candidateFaceKeys.length;

		if (predecessorCount === 0 && candidateCount >= 1) {
			// Zero-predecessor birth. Prove each face has no predecessor in this
			// component (a failed match is not permission to create a Room).
			const sortedKeys = [...component.candidateFaceKeys].sort();
			for (const faceKey of sortedKeys) {
				const face = facesByKey.get(faceKey)!;
				const roomId = allocator.nextRoomId(
					{ ...candidateDocument, rooms: [...baseline.rooms, ...finalRooms] },
					faceKey
				);
				const name = allocator.nextRoomName([...takenNames]);
				takenNames.add(name);
				finalRooms.push({
					id: roomId,
					name,
					boundary: [...face.boundary],
					floorThickness: ROOM_CREATION_DEFAULTS.floorThickness,
					ceilingThickness: ROOM_CREATION_DEFAULTS.ceilingThickness
				});
				lineage.push({ faceKey, roomId, predecessorRoomIds: [], kind: 'created' });
			}
			continue;
		}

		if (predecessorCount === 1 && candidateCount === 1) {
			// 1→1 preservation: predecessor boundary lineage maps the
			// predecessor to exactly one candidate face.
			const predecessor = predecessorRooms.get(component.predecessorRoomIds[0]!)!;
			const face = facesByKey.get(component.candidateFaceKeys[0]!)!;
			finalRooms.push({
				...predecessor,
				boundary: [...face.boundary]
			});
			lineage.push({
				faceKey: face.key,
				roomId: predecessor.id,
				predecessorRoomIds: [predecessor.id],
				kind: 'preserved'
			});
			continue;
		}

		if (predecessorCount === 1 && candidateCount === 2) {
			const predecessor = predecessorRooms.get(component.predecessorRoomIds[0]!)!;
			const candidates = component.candidateFaceKeys.map((key) => facesByKey.get(key)!);
			const winner = chooseSplitSurvivor({
				predecessor,
				candidates,
				witness: predecessorWitnesses.get(predecessor.id),
				overlapPolygons: predecessorPolygons
			});
			if (!winner) {
				return failure({
					code: 'ambiguous_room_correspondence',
					message: `Split of room '${predecessor.id}' has no deterministic survivor`,
					roomIds: [predecessor.id]
				});
			}
			const loser = candidates.find((face) => face !== winner)!;
			const newRoomId = allocator.nextRoomId(
				{ ...candidateDocument, rooms: [...baseline.rooms, ...finalRooms] },
				loser.key
			);
			const newName = allocator.nextRoomName([...takenNames]);
			takenNames.add(newName);
			finalRooms.push({
				...predecessor,
				boundary: [...winner.boundary]
			});
			finalRooms.push({
				id: newRoomId,
				name: newName,
				boundary: [...loser.boundary],
				floorThickness: predecessor.floorThickness,
				ceilingThickness: predecessor.ceilingThickness
			});
			lineage.push({
				faceKey: winner.key,
				roomId: predecessor.id,
				predecessorRoomIds: [predecessor.id],
				kind: 'split-survivor'
			});
			lineage.push({
				faceKey: loser.key,
				roomId: newRoomId,
				predecessorRoomIds: [predecessor.id],
				kind: 'created'
			});
			continue;
		}

		if (predecessorCount === 2 && candidateCount === 1) {
			const face = facesByKey.get(component.candidateFaceKeys[0]!)!;
			const predecessors = component.predecessorRoomIds.map((id) => predecessorRooms.get(id)!);
			const winner = chooseMergeSurvivor({
				predecessors,
				face,
				overlapPolygons: predecessorPolygons
			});
			if (!winner) {
				return failure({
					code: 'ambiguous_room_correspondence',
					message: `Merge into face '${face.key}' has no deterministic survivor`,
					faceKey: face.key,
					roomIds: predecessors.map((room) => room.id)
				});
			}
			const retired = predecessors.find((room) => room.id !== winner.id)!;
			// Field-level metadata policy: conflicting authored surface fields
			// reject rather than silently choosing (H5 §6.4).
			if (predecessors[0]!.floorThickness !== predecessors[1]!.floorThickness) {
				return failure({
					code: 'metadata_merge_conflict',
					message: `Merged rooms disagree on floorThickness (${predecessors[0]!.id}: ${predecessors[0]!.floorThickness}, ${predecessors[1]!.id}: ${predecessors[1]!.floorThickness})`,
					roomIds: [predecessors[0]!.id, predecessors[1]!.id]
				});
			}
			if (predecessors[0]!.ceilingThickness !== predecessors[1]!.ceilingThickness) {
				return failure({
					code: 'metadata_merge_conflict',
					message: `Merged rooms disagree on ceilingThickness (${predecessors[0]!.id}: ${predecessors[0]!.ceilingThickness}, ${predecessors[1]!.id}: ${predecessors[1]!.ceilingThickness})`,
					roomIds: [predecessors[0]!.id, predecessors[1]!.id]
				});
			}
		finalRooms.push({
			...winner,
			boundary: [...face.boundary]
		});
		lineage.push({
			faceKey: face.key,
			roomId: winner.id,
				predecessorRoomIds: [predecessors[0]!.id, predecessors[1]!.id],
				kind: 'merge-survivor'
			});
			retiredRoomIds.push(retired.id);
			continue;
		}

		return failure({
			code: 'unsupported_component',
			message: `Unsupported correspondence component ${predecessorCount}→${candidateCount}`,
			roomIds: [...component.predecessorRoomIds]
		});
	}

	// --- room disappearance -------------------------------------------------
	const survivingPredecessors = new Set<string>();
	for (const component of components) {
		for (const id of component.predecessorRoomIds) survivingPredecessors.add(id);
	}
	for (const room of baseline.rooms) {
		if (!survivingPredecessors.has(room.id)) {
			retiredRoomIds.push(room.id);
		}
	}

	// --- layout-object semantic associations (P23.8) ------------------------
	const roomIdMap = new Map<string, string>();
	for (const record of lineage) {
		for (const predecessorId of record.predecessorRoomIds) {
			roomIdMap.set(predecessorId, record.roomId);
		}
	}
	const objects = candidateDocument.objects.map((object) => {
		if (!object.roomId) return object;
		if (retiredRoomIds.includes(object.roomId)) {
			// Association maps to the surviving room on merge; cleared on
			// disappearance. Transforms never change.
			const remapped = roomIdMap.get(object.roomId);
			return remapped ? { ...object, roomId: remapped } : { ...object, roomId: undefined };
		}
		return object;
	});

	// --- portal semantic remapping ------------------------------------------
	// Retired-room successors derive from lineage records only (merge
	// survivors); a disappeared room has no successor and its portal relation
	// is cleared rather than guessed.
	const successorOf = new Map<string, string>();
	for (const record of lineage) {
		for (const predecessorId of record.predecessorRoomIds) {
			if (retiredRoomIds.includes(predecessorId)) {
				successorOf.set(predecessorId, record.roomId);
			}
		}
	}
	const portalResult = remapPortalRelations({
		successorOf,
		retiredRoomIds,
		openings: candidateDocument.openings
	});
	if (portalResult.kind === 'rejected') return portalResult;

	return {
		document: {
			...candidateDocument,
			rooms: finalRooms,
			objects: objects as LayoutDocumentWallFirst['objects'],
			openings: portalResult.openings
		},
		lineage,
		retiredRoomIds
	};
}

/** Greatest-overlap split survivor with witness and faceKey ties (H5 §6.2). */
function chooseSplitSurvivor(options: {
	predecessor: LayoutWallFirstRoom;
	candidates: DerivedCandidateFace[];
	witness: LayoutVec2 | undefined;
	overlapPolygons: ReadonlyMap<string, readonly LayoutVec2[]>;
}): DerivedCandidateFace | undefined {
	const { predecessor, candidates, witness } = options;
	if (candidates.length !== 2) return undefined;
	// Overlap requires the predecessor's polygon; derive it from its
	// boundary cycle when possible. With world-local candidate geometry the
	// predecessor polygon is the baseline face — supplied by the caller via
	// witness/overlap below. Here we rely on caller-provided overlap areas
	// computed against the baseline room boundary polygon.
	const overlaps = candidates.map((face) => ({
		face,
		area: predecessorPolygonOverlap(predecessor, face, options.overlapPolygons)
	}));
	const [first, second] = overlaps;
	if (!first || !second) return undefined;
	if (first.area > second.area) return first.face;
	if (second.area > first.area) return second.face;
	// Exact tie: witness strictly inside exactly one candidate.
	if (witness) {
		const inFirst = pointStrictlyInsidePolygon(first.face.polygon, witness);
		const inSecond = pointStrictlyInsidePolygon(second.face.polygon, witness);
		if (inFirst && !inSecond) return first.face;
		if (inSecond && !inFirst) return second.face;
	}
	// Otherwise smallest canonical faceKey survives.
	return first.face.key < second.face.key ? first.face : second.face;
}

/**
 * Predecessor/candidate overlap. The caller supplies baseline room polygons
 * through `predecessorPolygons`; when absent (no geometry overlap evidence
 * available) this returns 0 and the witness/faceKey ties decide — never
 * guessed geometry.
 */
function predecessorPolygonOverlap(
	predecessor: LayoutWallFirstRoom,
	face: DerivedCandidateFace,
	overlapPolygons: ReadonlyMap<string, readonly LayoutVec2[]>
): number {
	const polygon = overlapPolygons.get(predecessor.id);
	if (!polygon) return 0;
	return polygonIntersectionArea(polygon, face.polygon);
}

/** Greatest-contributor merge survivor with room-ID tie (H5 §6.4). */
function chooseMergeSurvivor(options: {
	predecessors: LayoutWallFirstRoom[];
	face: DerivedCandidateFace;
	overlapPolygons: ReadonlyMap<string, readonly LayoutVec2[]>;
}): LayoutWallFirstRoom | undefined {
	const { predecessors, face } = options;
	if (predecessors.length !== 2) return undefined;
	const areas = predecessors.map((room) => ({
		room,
		area: predecessorPolygonOverlap(room, face, options.overlapPolygons)
	}));
	const [first, second] = areas;
	if (!first || !second) return undefined;
	if (first.area > second.area) return first.room;
	if (second.area > first.area) return second.room;
	// Exact tie: stable existing Room ID lexical ordering.
	return first.room.id < second.room.id ? first.room : second.room;
}

/**
 * Portal semantic remapping for topology edits (P23.8). New-schema doors on
 * boundary walls derive physical adjacency from the wall; the explicit
 * `connectsRoomIds` relation is remapped only when lineage makes the result
 * unambiguous, cleared on planned semantic collapse, and rejected otherwise.
 */
function remapPortalRelations(options: {
	successorOf: ReadonlyMap<string, string>;
	retiredRoomIds: readonly string[];
	openings: readonly LayoutWallOpening[];
}): { kind: 'ok'; openings: LayoutWallOpening[] } | ReconciliationFailure {
	const { successorOf, retiredRoomIds, openings } = options;
	if (retiredRoomIds.length === 0) {
		return { kind: 'ok', openings: [...openings] };
	}
	const remapped: LayoutWallOpening[] = openings.map((opening) => {
		const relation = opening.connectsRoomIds;
		if (!relation) return opening;
		const [a, b] = relation;
		const nextA = successorOf.get(a) ?? (retiredRoomIds.includes(a) ? undefined : a);
		const nextB = successorOf.get(b) ?? (retiredRoomIds.includes(b) ? undefined : b);
		if (nextA === undefined || nextB === undefined) {
			// Unambiguous disappearance clears the relation while preserving
			// the physical door (P23.8 portal disappearance rule).
			if (!retiredRoomIds.includes(a) || !retiredRoomIds.includes(b)) {
				// One side unresolvable → reject.
				return opening;
			}
			const cleared = { ...opening };
			delete (cleared as Partial<LayoutWallOpening>).connectsRoomIds;
			return cleared as LayoutWallOpening;
		}
		if (nextA === nextB) {
			// Both tuple members collapsed into the same room: planned semantic
			// collapse, physical door preserved.
			const collapsed = { ...opening };
			delete (collapsed as Partial<LayoutWallOpening>).connectsRoomIds;
			return collapsed as LayoutWallOpening;
		}
		return { ...opening, connectsRoomIds: [nextA, nextB] };
	});
	// Validate no unresolved relations to retired rooms remain.
	for (const opening of remapped) {
		const relation = opening.connectsRoomIds;
		if (!relation) continue;
		if (retiredRoomIds.includes(relation[0]) || retiredRoomIds.includes(relation[1])) {
			return failure({
				code: 'unresolved_portal_remap',
				message: `Opening '${opening.id}' retains a relation to retired room`,
				roomIds: [relation[0], relation[1]]
			});
		}
	}
	return { kind: 'ok', openings: remapped };
}

function failure(rejection: ReconciliationRejection): ReconciliationFailure {
	return { kind: 'rejected', rejection };
}

/**
 * Alias kept for call-site readability: reconciliation with explicit baseline
 * room polygons (temporary overlap evidence derived from pre-edit compiled
 * geometry; never persisted).
 */
export const reconcileRoomsWithGeometry = reconcileRooms;

/** Oriented wall refs helper used by tests/fixtures to build room boundaries. */
export function wallRef(wallId: string, direction: 'forward' | 'reverse'): OrientedWallRef {
	return { wallId, direction };
}
