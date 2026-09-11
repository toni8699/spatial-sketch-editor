import { describe, expect, it } from 'vitest';
import type { LayoutDocument } from '$lib/layout/layout-types';	import {
	addPolygonPoint,
	advanceWallChainContinuation,
		beginLayoutObjectDrag,
		beginLayoutObjectRotateDrag,
		beginLayoutRoomUnitDrag,
		beginWallChain,
		cancelLayoutObjectDrag,
	cancelLayoutRoomUnitDrag,
	cancelLayoutPrimitiveDraft,
	cancelWallChainRun,
	beginRectangle,
	clearLayoutDraft,
	createLayoutInteractionState,
	hasWallChainRun,
	LAYOUT_WALL_BEND_DRAG_THRESHOLD_PX,		reconcileLayoutSelection,
		removeLastPolygonPoint,
		resolveWallChainEndpointAtLength,
		type LayoutSelection,
		wallChainPendingDirection,
		wallChainRoleForTool,
	selectLayoutInteriorAnchor,
	selectLayoutObject,
	selectLayoutOpening,
	selectLayoutWall,
	selectedLayoutRoomId,
	shouldBeginWallBend,
	rectanglePoints,
	setLayoutDraftTool,
	beginLayoutPrimitiveDraft,
	beginRoomEdit,
	primitiveDraftCenter,
	primitiveDraftFootprint,
	setLayoutViewMode,
	togglePlanViewportOption,
	updateLayoutObjectDrag,
	updateLayoutRoomUnitDrag,
	deriveArrangeTarget,
	resolveArrangeSceneModifiers,
	resolveArrangeScenePick,
	updateLayoutPrimitiveDraft,
	updateRoomEdit,
	updateRectangle,
	updateWallChainCursor
} from '$lib/editor/layout/layout-interaction';	describe('layout interaction', () => {
	it('P23.9 segment-first run: begin, advance from canonical result, cancel, and roles from tools', () => {
		const state = createLayoutInteractionState();
		expect(wallChainRoleForTool('wall-chain')).toBe('boundary');
		expect(wallChainRoleForTool('partition-chain')).toBe('partition');
		expect(wallChainRoleForTool('select')).toBeNull();

		setLayoutDraftTool(state, 'wall-chain');
		expect(hasWallChainRun(state)).toBe(false);
		beginWallChain(state, [0, 0]);
		expect(hasWallChainRun(state)).toBe(true);
		expect(state.wallChainStart).toEqual([0, 0]);
		expect(state.wallChainStartJunctionId).toBeNull();
		expect(state.wallChainRunStartJunctionId).toBeNull();

		// First commit seeds run-start from the canonical start and moves the
		// continuation to the canonical end (never from createdWallIds).
		advanceWallChainContinuation(state, { endPoint: [4, 0], endJunctionId: 'j-b', startJunctionId: 'j-a' });
		expect(state.wallChainStart).toEqual([4, 0]);
		expect(state.wallChainStartJunctionId).toBe('j-b');
		expect(state.wallChainRunStartJunctionId).toBe('j-a');

		// Second commit keeps the original run-start, moves continuation.
		advanceWallChainContinuation(state, { endPoint: [4, 3], endJunctionId: 'j-c', startJunctionId: 'j-b' });
		expect(state.wallChainStart).toEqual([4, 3]);
		expect(state.wallChainRunStartJunctionId).toBe('j-a');

		// Escape cancels only the run (committed Walls remain, tool stays).
		cancelWallChainRun(state);
		expect(hasWallChainRun(state)).toBe(false);
		expect(state.tool).toBe('wall-chain');

		// Switching tools clears the run; switching to a chain tool starts empty.
		beginWallChain(state, [1, 1]);
		expect(hasWallChainRun(state)).toBe(true);
		clearLayoutDraft(state);
		expect(hasWallChainRun(state)).toBe(false);
		setLayoutDraftTool(state, 'partition-chain');
		expect(state.tool).toBe('partition-chain');
		expect(hasWallChainRun(state)).toBe(false);
	});

	it('toggles plan viewport options through the interaction module', () => {
		const state = createLayoutInteractionState();
		expect(state.planView.snapEnabled).toBe(true);
		expect(state.planView.gridEnabled).toBe(true);
		expect(state.planView.showTourOverlay).toBe(false);

		togglePlanViewportOption(state, 'snapEnabled');
		togglePlanViewportOption(state, 'gridEnabled');
		togglePlanViewportOption(state, 'showTourOverlay');

		expect(state.planView.snapEnabled).toBe(false);
		expect(state.planView.gridEnabled).toBe(false);
		expect(state.planView.showTourOverlay).toBe(true);
	});

	it('creates rectangle points from drag corners', () => {
		const state = createLayoutInteractionState();
		setLayoutDraftTool(state, 'rectangle');
		beginRectangle(state, [3, 4]);
		updateRectangle(state, [-1, 1]);

		expect(rectanglePoints(state)).toEqual([
			[3, 4],
			[-1, 4],
			[-1, 1],
			[3, 1]
		]);
	});

	it('accumulates polygon points and clears draft when switching views', () => {
		const state = createLayoutInteractionState();
		setLayoutDraftTool(state, 'polygon');
		addPolygonPoint(state, [0, 0]);
		addPolygonPoint(state, [4, 0]);
		expect(state.polygonPoints).toEqual([[0, 0], [4, 0]]);

		removeLastPolygonPoint(state);
		expect(state.polygonPoints).toEqual([[0, 0]]);

		setLayoutViewMode(state, '3d');
		expect(state.polygonPoints).toEqual([]);
		expect(state.rectangleStart).toBeNull();
	});

	it('tracks mutually exclusive room, wall, opening, and interior-anchor selections', () => {
		const state = createLayoutInteractionState();
		selectLayoutWall(state, 'room-a', 'wall-a');
		expect(state.selection).toEqual({ kind: 'wall', roomId: 'room-a', segmentId: 'wall-a' });
		expect(selectedLayoutRoomId(state)).toBe('room-a');
		selectLayoutOpening(state, 'room-a', 'wall-a', 'opening-a');
		expect(state.selection).toEqual({ kind: 'opening', roomId: 'room-a', segmentId: 'wall-a', openingId: 'opening-a' });
		selectLayoutInteriorAnchor(state, 'room-a', 'wall-a', 'wall-a:anchor:1');
		expect(state.selection).toEqual({
			kind: 'interiorAnchor',
			roomId: 'room-a',
			segmentId: 'wall-a',
			anchorId: 'wall-a:anchor:1'
		});
		expect(selectedLayoutRoomId(state)).toBe('room-a');
	});

	it('clears partial drafts explicitly', () => {
		const state = createLayoutInteractionState();
		beginRectangle(state, [0, 0]);
		updateRectangle(state, [2, 2]);
		clearLayoutDraft(state);
		expect(rectanglePoints(state)).toBeNull();
	});

	it('starts a wall bend only after the screen drag threshold', () => {
		const origin: [number, number] = [100, 100];
		expect(shouldBeginWallBend(origin, [103, 100])).toBe(false);
		expect(shouldBeginWallBend(origin, [104, 100])).toBe(true);
		expect(shouldBeginWallBend(origin, [100, 104])).toBe(true);
		expect(LAYOUT_WALL_BEND_DRAG_THRESHOLD_PX).toBe(4);
	});

	it('tracks explicit primitive gestures and clears them when cancelled', () => {
		const state = createLayoutInteractionState();
		setLayoutDraftTool(state, 'box');
		beginLayoutPrimitiveDraft(state, 'box', [1, 1], 'room-a');
		updateLayoutPrimitiveDraft(state, [3, 4], 'room-a');
		expect(state.primitiveDraft).toMatchObject({ kind: 'box', start: [1, 1], current: [3, 4], roomId: 'room-a', valid: true });
		expect(primitiveDraftFootprint(state.primitiveDraft!)).toEqual([[1, 1], [3, 1], [3, 4], [1, 4]]);
		cancelLayoutPrimitiveDraft(state);
		expect(state.tool).toBe('select');
		expect(state.primitiveDraft).toBeNull();
	});

	it('resolves radial centers from drag start and box centers from both corners', () => {
		expect(primitiveDraftCenter({ kind: 'sphere', start: [1, 2], current: [5, 6] })).toEqual([1, 2]);
		expect(primitiveDraftCenter({ kind: 'box', start: [1, 2], current: [5, 6] })).toEqual([3, 4]);
	});

	it('snaps vertices directly while translating whole rooms rigidly', () => {
		const state = createLayoutInteractionState();
		const original = [[0.1, 0.2], [1.2, 0.2], [1.2, 1.4], [0.1, 1.4]] as [number, number][];
		beginRoomEdit(state, 'room', 'room-a', [0.13, 0.17], original);
		updateRoomEdit(state, [0.62, 0.88], true);
		const moved = state.editing!.currentPoints;
		expect(moved[1]![0] - moved[0]![0]).toBeCloseTo(1.1);
		expect(moved[2]![1] - moved[1]![1]).toBeCloseTo(1.2);

		beginRoomEdit(state, 'vertex', 'room-a', original[0]!, original, 0);
		updateRoomEdit(state, [0.38, 0.62], true);
		expect(state.editing?.currentPoints[0]).toEqual([0.5, 0.5]);
		expect(state.editing?.currentPoints.slice(1)).toEqual(original.slice(1));
	});

	it('tracks rigid room translation and Shift rotation snapping', () => {
		const state = createLayoutInteractionState();
		beginLayoutRoomUnitDrag(state, 'room-a', 'translate', [0.1, 0.1], [2, 2]);
		updateLayoutRoomUnitDrag(state, [0.62, 0.38], true, true);
		expect(state.roomUnitDrag?.translation).toEqual([0.4, 0.4]);
		cancelLayoutRoomUnitDrag(state);
		beginLayoutRoomUnitDrag(state, 'room-a', 'rotate', [2, 1], [2, 2]);
		updateLayoutRoomUnitDrag(state, [1, 2], false, true, true);
		expect(state.roomUnitDrag?.yaw).toBeCloseTo(-Math.PI / 2);
	});

	it('keeps object drag transient and snaps only X/Z', () => {
		const state = createLayoutInteractionState();
		selectLayoutObject(state, 'object-a');
		expect(selectedLayoutRoomId(state)).toBeNull();
		beginLayoutObjectDrag(state, 'object-a', [1, 2, 3]);
		updateLayoutObjectDrag(state, [1.12, 3.14], true);
		expect(state.objectDrag?.candidatePosition).toEqual([1, 2, 3.25]);
		cancelLayoutObjectDrag(state);
		expect(state.objectDrag).toBeNull();
	});

	it('rotates a layout object around its world pivot via the Plan rotation-handle convention', () => {
		const state = createLayoutInteractionState();
		beginLayoutObjectRotateDrag(state, 'object-a', [2, 1, 2], [0, 0.3, 0], [2, 1], [2, 2]);
		expect(state.objectDrag?.mode).toBe('rotate');
		expect(state.objectDrag?.candidatePosition).toEqual([2, 1, 2]);
		// startAngle = atan2(-(1-2), 0) = +PI/2; pointer at (1,2) gives
		// atan2(-0, -1) = PI → yaw = PI/2.
		updateLayoutObjectDrag(state, [1, 2], false);
		expect(state.objectDrag?.candidateRotation).toEqual([0, 0.3 + Math.PI / 2, 0]);
		expect(state.objectDrag?.candidatePosition).toEqual([2, 1, 2]);
		cancelLayoutObjectDrag(state);
		expect(state.objectDrag).toBeNull();
	});

	it('snaps the layout-object rotate delta to 15° on Shift when angle snap is enabled', () => {
		const state = createLayoutInteractionState();
		beginLayoutObjectRotateDrag(state, 'object-a', [2, 1, 2], [0, 0, 0], [2, 1], [2, 2]);
		// Pointer at pointer-yaw 1 rad: raw yaw = 1 - PI/2 ≈ -0.5708 rad.
		updateLayoutObjectDrag(state, [2 + Math.cos(1), 2 - Math.sin(1)], false, true, true);
		expect(state.objectDrag?.candidateRotation[1]).toBeCloseTo(-Math.PI / 6, 6);
		// No Shift → raw delta.
		beginLayoutObjectRotateDrag(state, 'object-a', [2, 1, 2], [0, 0, 0], [2, 1], [2, 2]);
		updateLayoutObjectDrag(state, [2 + Math.cos(1), 2 - Math.sin(1)], false, false, true);
		expect(state.objectDrag?.candidateRotation[1]).toBeCloseTo(1 - Math.PI / 2, 6);
	});
});

describe('deriveArrangeTarget (P10 last-owner rule)', () => {
	const object = { kind: 'object', objectId: 'layout-object-1' } as const;
	const structural = { kind: 'room', roomId: 'room-a' } as const;
	const eligible = new Set(['layout-object-1']);

	it('activates the remembered layout owner only when its slot holds an eligible object', () => {
		expect(deriveArrangeTarget({ lastOwner: 'layout-object', layoutSelection: object, selectedPlacementIds: [], selectedClusterId: null, eligibleLayoutObjectIds: eligible }))
			.toEqual({ owner: 'layout-object', objectId: 'layout-object-1' });
		// Structural / stale layout selection → no target, never a Scene fallback.
		expect(deriveArrangeTarget({ lastOwner: 'layout-object', layoutSelection: structural, selectedPlacementIds: ['scene-1'], selectedClusterId: null }))
			.toBeNull();
		// Ineligible object (e.g. profile) → no target.
		expect(deriveArrangeTarget({ lastOwner: 'layout-object', layoutSelection: object, selectedPlacementIds: [], selectedClusterId: null, eligibleLayoutObjectIds: new Set() }))
			.toBeNull();
	});

	it('activates the remembered scene owner only when its selection is eligible', () => {
		expect(deriveArrangeTarget({ lastOwner: 'scene', layoutSelection: object, selectedPlacementIds: ['scene-1', 'scene-2'], selectedClusterId: null }))
			.toEqual({ owner: 'scene', ids: ['scene-1', 'scene-2'], primaryId: 'scene-2' });
		// Empty selection → no target even with a Layout object in memory.
		expect(deriveArrangeTarget({ lastOwner: 'scene', layoutSelection: object, selectedPlacementIds: [], selectedClusterId: null }))
			.toBeNull();
		// Clusters stay non-transformable in Plan.
		expect(deriveArrangeTarget({ lastOwner: 'scene', layoutSelection: structural, selectedPlacementIds: ['scene-1'], selectedClusterId: 'cluster-a' }))
			.toBeNull();
		// Ineligible scene members → no target.
		expect(deriveArrangeTarget({ lastOwner: 'scene', layoutSelection: structural, selectedPlacementIds: ['scene-1'], selectedClusterId: null, eligibleSceneEntityIds: new Set(['scene-2']) }))
			.toBeNull();
	});

	it('derives from the current slots when no owner is remembered (object first, then scene)', () => {
		expect(deriveArrangeTarget({ lastOwner: null, layoutSelection: object, selectedPlacementIds: ['scene-1'], selectedClusterId: null }))
			.toEqual({ owner: 'layout-object', objectId: 'layout-object-1' });
		expect(deriveArrangeTarget({ lastOwner: null, layoutSelection: structural, selectedPlacementIds: ['scene-1'], selectedClusterId: null }))
			.toEqual({ owner: 'scene', ids: ['scene-1'], primaryId: 'scene-1' });
		expect(deriveArrangeTarget({ lastOwner: null, layoutSelection: structural, selectedPlacementIds: [], selectedClusterId: null }))
			.toBeNull();
	});
});	describe('resolveArrangeSceneModifiers (P10 cross-owner modifier rule)', () => {
	it('keeps same-owner P2 modifier semantics', () => {
		// Same-owner shift-click → additive; cmd/ctrl → toggle.
		expect(resolveArrangeSceneModifiers({ switchingFromLayout: false, metaKey: false, ctrlKey: false, shiftKey: true }))
			.toEqual({ toggle: false, additive: true });
		expect(resolveArrangeSceneModifiers({ switchingFromLayout: false, metaKey: true, ctrlKey: false, shiftKey: false }))
			.toEqual({ toggle: true, additive: false });
		expect(resolveArrangeSceneModifiers({ switchingFromLayout: false, metaKey: false, ctrlKey: true, shiftKey: true }))
			.toEqual({ toggle: true, additive: false });
		expect(resolveArrangeSceneModifiers({ switchingFromLayout: false, metaKey: false, ctrlKey: false, shiftKey: false }))
			.toEqual({ toggle: false, additive: false });
	});

	it('suppresses additive/toggle when the pick switches owner from a layout target', () => {
		// Cross-owner shift-click replaces the active selection with the clicked
		// target — never adds across owners (plan §Selection).
		expect(resolveArrangeSceneModifiers({ switchingFromLayout: true, metaKey: false, ctrlKey: false, shiftKey: true }))
			.toEqual({ toggle: false, additive: false });
		expect(resolveArrangeSceneModifiers({ switchingFromLayout: true, metaKey: true, ctrlKey: false, shiftKey: false }))
			.toEqual({ toggle: false, additive: false });
		expect(resolveArrangeSceneModifiers({ switchingFromLayout: true, metaKey: true, ctrlKey: false, shiftKey: true }))
			.toEqual({ toggle: false, additive: false });
	});
});

describe('resolveArrangeScenePick (P10 cross-owner replacement)', () => {
	it('treats an already-selected member as unselected when switching owner from a layout target', () => {
		// Cross-owner click on a member of the remembered Scene selection must
		// replace with a single entity — never drag/extend the whole memory.
		expect(resolveArrangeScenePick({ switchingFromLayout: true, metaKey: false, ctrlKey: false, shiftKey: false, clickedAlreadySelected: true }))
			.toEqual({ toggle: false, additive: false, alreadySelected: false });
		expect(resolveArrangeScenePick({ switchingFromLayout: true, metaKey: true, ctrlKey: false, shiftKey: true, clickedAlreadySelected: true }))
			.toEqual({ toggle: false, additive: false, alreadySelected: false });
	});

	it('keeps the same-owner drag-the-selection semantics for an already-selected member', () => {
		expect(resolveArrangeScenePick({ switchingFromLayout: false, metaKey: false, ctrlKey: false, shiftKey: false, clickedAlreadySelected: true }))
			.toEqual({ toggle: false, additive: false, alreadySelected: true });
		expect(resolveArrangeScenePick({ switchingFromLayout: false, metaKey: false, ctrlKey: false, shiftKey: true, clickedAlreadySelected: true }))
			.toEqual({ toggle: false, additive: true, alreadySelected: true });
		expect(resolveArrangeScenePick({ switchingFromLayout: false, metaKey: false, ctrlKey: false, shiftKey: false, clickedAlreadySelected: false }))
			.toEqual({ toggle: false, additive: false, alreadySelected: false });
	});
});

describe('reconcileLayoutSelection', () => {
	function makeLayout(): LayoutDocument {
		return {
			units: 'meters',
			floors: [
				{
					id: 'floor-1',
					name: 'Floor 1',
					elevation: 0,
					height: 3,
					rooms: [
						{
							id: 'room-a',
							name: 'A',
							frame: { origin: [0, 0], yaw: 0 },
							boundary: {
								closed: true,
								segments: [
									{ id: 'wall-a', kind: 'line', start: [0, 0], end: [4, 0] },
									{
										id: 'wall-b',
										kind: 'auto-bezier',
										start: [4, 0],
										end: [4, 3],
										interiorAnchors: [{ id: 'anchor-1', point: [4, 1.5] }]
									}
								]
							},
							wallThickness: 0.2,
							floorThickness: 0.1,
							ceilingThickness: 0.1,
							openings: [
								{
									id: 'opening-1',
									segmentId: 'wall-a',
									kind: 'door',
									offset: 1,
									width: 1,
									height: 2.1,
									sillHeight: 0,
									profile: 'rectangular'
								}
							]
						}
					]
				}
			],
			objects: [
				{ id: 'object-1', kind: 'box', position: [1, 0, 1], rotation: [0, 0, 0], dimensions: [1, 1, 1] }
			]
		};
	}

	it('keeps valid selections unchanged and clears dead rooms/walls/objects', () => {
		const layout = makeLayout();

		expect(reconcileLayoutSelection({ kind: 'none' }, layout)).toEqual({ kind: 'none' });
		expect(reconcileLayoutSelection({ kind: 'room', roomId: 'room-a' }, layout)).toEqual({
			kind: 'room',
			roomId: 'room-a'
		});
		expect(reconcileLayoutSelection({ kind: 'wall', roomId: 'room-a', segmentId: 'wall-a' }, layout)).toEqual({
			kind: 'wall',
			roomId: 'room-a',
			segmentId: 'wall-a'
		});
		expect(
			reconcileLayoutSelection({ kind: 'object', objectId: 'object-1' }, layout)
		).toEqual({ kind: 'object', objectId: 'object-1' });

		// Deleted room / wall / object clear to none.
		expect(reconcileLayoutSelection({ kind: 'room', roomId: 'room-gone' }, layout)).toEqual({
			kind: 'none'
		});
		expect(
			reconcileLayoutSelection({ kind: 'wall', roomId: 'room-a', segmentId: 'wall-gone' }, layout)
		).toEqual({ kind: 'none' });
		expect(reconcileLayoutSelection({ kind: 'object', objectId: 'object-gone' }, layout)).toEqual({
			kind: 'none'
		});
	});

	it('demotes a deleted opening to its parent wall, then clears when the wall is gone', () => {
		const layout = makeLayout();
		const opening: LayoutSelection = {
			kind: 'opening',
			roomId: 'room-a',
			segmentId: 'wall-a',
			openingId: 'opening-1'
		};

		// Still present.
		expect(reconcileLayoutSelection(opening, layout)).toEqual(opening);

		// Opening deleted: demote to the surviving wall.
		const withoutOpening = makeLayout();
		withoutOpening.floors[0]!.rooms[0]!.openings = [];
		expect(reconcileLayoutSelection(opening, withoutOpening)).toEqual({
			kind: 'wall',
			roomId: 'room-a',
			segmentId: 'wall-a'
		});

		// Opening and wall both gone: clear.
		const withoutWall = makeLayout();
		withoutWall.floors[0]!.rooms[0]!.boundary.segments = withoutWall.floors[0]!.rooms[0]!.boundary.segments.filter(
			(segment) => segment.id !== 'wall-a'
		);
		expect(reconcileLayoutSelection(opening, withoutWall)).toEqual({ kind: 'none' });
	});

	it('demotes a deleted interior anchor to its parent wall', () => {
		const layout = makeLayout();
		const anchor: LayoutSelection = {
			kind: 'interiorAnchor',
			roomId: 'room-a',
			segmentId: 'wall-b',
			anchorId: 'anchor-1'
		};

		expect(reconcileLayoutSelection(anchor, layout)).toEqual(anchor);

		const withoutAnchor = makeLayout();
		const wallB = withoutAnchor.floors[0]!.rooms[0]!.boundary.segments[1]!;
		if (wallB.kind === 'auto-bezier') wallB.interiorAnchors = [];
		expect(reconcileLayoutSelection(anchor, withoutAnchor)).toEqual({
			kind: 'wall',
			roomId: 'room-a',
			segmentId: 'wall-b'
		});
	});
});

describe('P23.9 exact segment length entry', () => {
	it('resolves the current endpoint at the exact typed length along the cursor direction', () => {
		const state = createLayoutInteractionState();
		setLayoutDraftTool(state, 'wall-chain');
		beginWallChain(state, [1, 2]);
		updateWallChainCursor(state, [4, 2]); // pending direction +X via cursor
		expect(resolveWallChainEndpointAtLength(state, 2.5)).toEqual([3.5, 2]);
	});

	it('falls back to the last committed direction, then +X', () => {
		const state = createLayoutInteractionState();
		setLayoutDraftTool(state, 'partition-chain');
		beginWallChain(state, [0, 0]);
		advanceWallChainContinuation(state, { endPoint: [1, 1], endJunctionId: 'j-b', startJunctionId: 'j-a' });
		// No cursor: last direction is diagonal (1,1).
		const endpoint = resolveWallChainEndpointAtLength(state, Math.SQRT2)!;
		expect(endpoint[0]).toBeCloseTo(2, 12);
		expect(endpoint[1]).toBeCloseTo(2, 12);
	});

	it('first segment with no cursor defaults to +X from the start', () => {
		const state = createLayoutInteractionState();
		setLayoutDraftTool(state, 'wall-chain');
		beginWallChain(state, [5, 5]);
		expect(resolveWallChainEndpointAtLength(state, 3)).toEqual([8, 5]);
	});

	it('rejects non-positive/non-finite lengths and an empty run', () => {
		const state = createLayoutInteractionState();
		expect(resolveWallChainEndpointAtLength(state, 2)).toBeNull();
		beginWallChain(state, [0, 0]);
		expect(resolveWallChainEndpointAtLength(state, 0)).toBeNull();
		expect(resolveWallChainEndpointAtLength(state, -1)).toBeNull();
		expect(resolveWallChainEndpointAtLength(state, Number.NaN)).toBeNull();
		expect(hasWallChainRun(state)).toBe(true);
	});

	it('explicit direction overrides the pending direction', () => {
		const state = createLayoutInteractionState();
		setLayoutDraftTool(state, 'wall-chain');
		beginWallChain(state, [0, 0]);
		updateWallChainCursor(state, [1, 0]);
		expect(resolveWallChainEndpointAtLength(state, 2, [0, 1])).toEqual([0, 2]);
	});

	it('pending direction prefers cursor, then last direction, then +X', () => {
		const state = createLayoutInteractionState();
		beginWallChain(state, [0, 0]);
		expect(wallChainPendingDirection(state)).toEqual([1, 0]);
		updateWallChainCursor(state, [0, 5]);
		expect(wallChainPendingDirection(state)).toEqual([0, 5]);
	});
});

describe('P23.9 hover direction memory across pointerleave', () => {
	it('hover north, leave the surface, type length → north is kept, not +X', () => {
		const state = createLayoutInteractionState();
		setLayoutDraftTool(state, 'wall-chain');
		beginWallChain(state, [0, 0]);
		updateWallChainCursor(state, [0, 4]); // hover north toward B
		updateWallChainCursor(state, null); // pointerleave: hides rubber band only
		expect(state.wallChainCursor).toBeNull();
		expect(resolveWallChainEndpointAtLength(state, 4)).toEqual([0, 4]);
	});

	it('a committed segment clears stale hover so the next default is its own direction', () => {
		const state = createLayoutInteractionState();
		setLayoutDraftTool(state, 'wall-chain');
		beginWallChain(state, [0, 0]);
		updateWallChainCursor(state, [0, 4]);
		advanceWallChainContinuation(state, { endPoint: [4, 0], endJunctionId: 'j-b', startJunctionId: 'j-a' });
		// No fresh hover: falls back to the just-committed +X direction.
		expect(resolveWallChainEndpointAtLength(state, 2)).toEqual([6, 0]);
		// Fresh hover north overrides it, and survives pointerleave.
		updateWallChainCursor(state, [4, 3]);
		updateWallChainCursor(state, null);
		expect(resolveWallChainEndpointAtLength(state, 3)).toEqual([4, 3]);
	});
});

describe('P23.9 run cursor (rubber band)', () => {
	it('tracks and clears the snapped cursor; clearLayoutDraft resets the run', () => {
		const state = createLayoutInteractionState();
		expect(state.wallChainCursor).toBeNull();
		setLayoutDraftTool(state, 'wall-chain');
		beginWallChain(state, [0, 0]);
		updateWallChainCursor(state, [2, 3]);
		expect(state.wallChainCursor).toEqual([2, 3]);
		clearLayoutDraft(state);
		expect(state.wallChainCursor).toBeNull();
		expect(hasWallChainRun(state)).toBe(false);
	});
});
