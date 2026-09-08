import { describe, expect, it } from 'vitest';
import {
	Group,
	Mesh,
	MeshBasicMaterial,
	Object3D,
	PerspectiveCamera,
	Raycaster,
	SphereGeometry,
	Vector3,
	type Intersection
} from 'three';
import {
	findCameraSelectionFromObject,
	findCameraFovHandleFromObject,
	findCameraViewKeyframeHandleFromObject,
	findNavigationSelectionFromObject,
	findPriorityCameraViewKeyframeHandle,
	filterEffectiveHits,
	isEditorCameraAnchorUserData,
	isEditorCameraConnectionUserData,
	isEditorCameraHandleUserData,
	isEditorCameraFovHandleUserData,
	isEditorCameraViewKeyframeUserData,
	navigationArbitrationClass,
	NEAR_INVISIBLE_OPACITY,
	nextPlacementCycleId,
	resolveNormalSelection,
	resolveNormalSelectionWithHit,
	selectionHitFromIntersection,
	sortIntersectionsBySameClassProjectedCenter,
	uniquePlacementIdsInOrder,
	type SelectionHitInfo
} from '$lib/editor/editor-selection';

function hit(
	placementId: string | null,
	cameraSelection?: SelectionHitInfo['cameraSelection'],
	opacity = 1
): SelectionHitInfo {
	return { opacity, placementId, cameraSelection };
}

describe('editor camera-helper selection', () => {
	it('recognizes and climbs node and key FOV side handles', () => {
		const nodeRoot = new Object3D();
		nodeRoot.userData = {
			editorEntity: 'camera-fov-handle',
			owner: 'node',
			nodeId: 'paris-seat',
			side: 'top'
		};
		const child = new Object3D();
		nodeRoot.add(child);
		expect(isEditorCameraFovHandleUserData(nodeRoot.userData)).toBe(true);
		expect(findCameraFovHandleFromObject(child)).toEqual({
			owner: 'node',
			nodeId: 'paris-seat',
			side: 'top'
		});
		expect(
			isEditorCameraFovHandleUserData({
				editorEntity: 'camera-fov-handle',
				owner: 'view-keyframe',
				connectionId: 'a-b',
				direction: 'sideways',
				keyframeId: 'key-1',
				side: 'bottom'
			})
		).toBe(false);
	});

	it('recognizes only complete camera-handle userData tags', () => {
		expect(
			isEditorCameraHandleUserData({
				editorEntity: 'camera-handle',
				nodeId: 'paris-seat',
				cameraHandle: 'position'
			})
		).toBe(true);
		expect(
			isEditorCameraHandleUserData({
				editorEntity: 'camera-handle',
				nodeId: 'paris-seat',
				cameraHandle: 'rotation'
			})
		).toBe(false);
		expect(
			isEditorCameraHandleUserData({
				editorEntity: 'camera-handle',
				cameraHandle: 'target'
			})
		).toBe(false);
	});

	it('climbs from helper geometry to the tagged helper root', () => {
		const helperRoot = new Object3D();
		helperRoot.userData = {
			editorEntity: 'camera-handle',
			nodeId: 'vienna-seat',
			cameraHandle: 'target'
		};
		const markerGeometry = new Object3D();
		helperRoot.add(markerGeometry);

		expect(findCameraSelectionFromObject(markerGeometry)).toEqual({
			nodeId: 'vienna-seat',
			handle: 'target'
		});
		expect(findCameraSelectionFromObject(new Object3D())).toBeNull();
		expect(findCameraSelectionFromObject(null)).toBeNull();
	});

	it('includes the climbed camera selection in intersection hit info', () => {
		const helperRoot = new Object3D();
		helperRoot.userData = {
			editorEntity: 'camera-handle',
			nodeId: 'departure-seat',
			cameraHandle: 'position'
		};
		const markerGeometry = new Object3D();
		helperRoot.add(markerGeometry);

		expect(
			selectionHitFromIntersection({ object: markerGeometry } as Intersection)
		).toEqual({
			opacity: 1,
			placementId: null,
			cameraSelection: {
				nodeId: 'departure-seat',
				handle: 'position'
			},
			navigationSelection: {
				kind: 'node',
				nodeId: 'departure-seat',
				handle: 'position'
			}
		});
	});

	it('gives an effective camera helper normal-click precedence over placements', () => {
		expect(
			resolveNormalSelection([
				hit('chair-placement'),
				hit(null, { nodeId: 'paris-seat', handle: 'target' })
			])
		).toEqual({
			action: 'select-camera',
			selection: { nodeId: 'paris-seat', handle: 'target' }
		});
	});

	it('ignores near-invisible camera helpers for normal selection', () => {
		expect(
			resolveNormalSelection([
				hit(null, { nodeId: 'paris-seat', handle: 'position' }, 0.01),
				hit('piano-placement')
			])
		).toEqual({ action: 'select', id: 'piano-placement' });
	});

	it('keeps Alt-cycle placement-only and ignores camera-only hits', () => {
		expect(
			uniquePlacementIdsInOrder([
				hit(null, { nodeId: 'paris-seat', handle: 'position' }),
				hit('chair-placement'),
				hit(null, { nodeId: 'paris-seat', handle: 'target' }),
				hit('piano-placement'),
				hit('chair-placement')
			])
		).toEqual(['chair-placement', 'piano-placement']);
	});

	it('recognizes and climbs stable connection and anchor tags', () => {
		expect(
			isEditorCameraConnectionUserData({
				editorEntity: 'camera-connection',
				connectionId: 'a-b'
			})
		).toBe(true);
		expect(
			isEditorCameraAnchorUserData({
				editorEntity: 'camera-anchor',
				connectionId: 'a-b',
				anchorId: 'a-b-anchor-01'
			})
		).toBe(true);

		const connectionRoot = new Object3D();
		connectionRoot.userData = {
			editorEntity: 'camera-connection',
			connectionId: 'a-b'
		};
		const anchorRoot = new Object3D();
		anchorRoot.userData = {
			editorEntity: 'camera-anchor',
			connectionId: 'a-b',
			anchorId: 'a-b-anchor-01'
		};
		connectionRoot.add(anchorRoot);
		expect(findNavigationSelectionFromObject(anchorRoot)).toEqual({
			kind: 'anchor',
			connectionId: 'a-b',
			anchorId: 'a-b-anchor-01'
		});
	});

	it('prefers anchors over connections and keeps both out of placement cycling', () => {
		const anchorSelection = {
			kind: 'anchor' as const,
			connectionId: 'a-b',
			anchorId: 'a-b-anchor-01'
		};
		const connectionSelection = {
			kind: 'connection' as const,
			connectionId: 'a-b'
		};
		const hits: SelectionHitInfo[] = [
			{ opacity: 1, placementId: 'chair', navigationSelection: connectionSelection },
			{ opacity: 1, placementId: null, navigationSelection: anchorSelection }
		];
		expect(resolveNormalSelection(hits)).toEqual({
			action: 'select-navigation',
			selection: anchorSelection
		});
		expect(uniquePlacementIdsInOrder(hits)).toEqual(['chair']);
	});

	it('recognizes view-key tags and gives them path-pick precedence', () => {
		expect(
			isEditorCameraViewKeyframeUserData({
				editorEntity: 'camera-view-keyframe',
				connectionId: 'a-b',
				direction: 'forward',
				keyframeId: 'a-b-view-forward-01',
				viewHandle: 'position'
			})
		).toBe(true);
		expect(
			isEditorCameraViewKeyframeUserData({
				editorEntity: 'camera-view-keyframe',
				connectionId: 'a-b',
				direction: 'sideways',
				keyframeId: 'bad',
				viewHandle: 'position'
			})
		).toBe(false);

		const connectionRoot = new Object3D();
		connectionRoot.userData = {
			editorEntity: 'camera-connection',
			connectionId: 'a-b'
		};
		const viewRoot = new Object3D();
		viewRoot.userData = {
			editorEntity: 'camera-view-keyframe',
			connectionId: 'a-b',
			direction: 'reverse',
			keyframeId: 'a-b-view-reverse-01',
			viewHandle: 'position'
		};
		const viewChild = new Object3D();
		viewRoot.add(viewChild);
		const viewSelection = {
			kind: 'view-keyframe' as const,
			connectionId: 'a-b',
			direction: 'reverse' as const,
			keyframeId: 'a-b-view-reverse-01'
		};
		expect(findNavigationSelectionFromObject(viewChild)).toEqual(viewSelection);
		expect(
			resolveNormalSelection([
				{
					opacity: 1,
					placementId: 'chair',
					navigationSelection: {
						kind: 'connection',
						connectionId: 'a-b'
					}
				},
				{ opacity: 1, placementId: null, navigationSelection: viewSelection }
			])
		).toEqual({ action: 'select-navigation', selection: viewSelection });
	});

	it('gives the target handle precedence over an overlapping derived eye marker', () => {
		const positionRoot = new Object3D();
		positionRoot.userData = {
			editorEntity: 'camera-view-keyframe',
			connectionId: 'a-b',
			direction: 'forward',
			keyframeId: 'view-01',
			viewHandle: 'position'
		};
		const positionChild = new Object3D();
		positionRoot.add(positionChild);
		const targetRoot = new Object3D();
		targetRoot.userData = {
			editorEntity: 'camera-view-keyframe',
			connectionId: 'a-b',
			direction: 'forward',
			keyframeId: 'view-01',
			viewHandle: 'target'
		};

		expect(findCameraViewKeyframeHandleFromObject(positionChild)).toMatchObject({
			keyframeId: 'view-01',
			viewHandle: 'position'
		});
		expect(
			findPriorityCameraViewKeyframeHandle([positionChild, targetRoot])
		).toMatchObject({
			keyframeId: 'view-01',
			viewHandle: 'target'
		});
	});
});

// Slice 4 — the `editor-selection helpers` describe block lives on this file
// now (it tests the pure selection helpers from `./editor-selection`).
describe('editor-selection helpers', () => {
	const hits = (entries: Array<[number, string | null]>): SelectionHitInfo[] =>
		entries.map(([opacity, placementId]) => ({ opacity, placementId }));

	it('filters near-invisible hits for normal selection', () => {
		expect(
			resolveNormalSelection(
				hits([
					[NEAR_INVISIBLE_OPACITY - 0.01, 'ghost'],
					[1, 'piano']
				])
			)
		).toEqual({ action: 'select', id: 'piano' });

		expect(resolveNormalSelection(hits([[1, null]]))).toEqual({ action: 'deselect' });
		expect(resolveNormalSelection(hits([]))).toEqual({ action: 'deselect' });
	});

	it('dedupes placement ids while preserving hit order', () => {
		expect(
			uniquePlacementIdsInOrder(
				hits([
					[0.01, 'a'],
					[1, 'b'],
					[1, 'c'],
					[1, 'b'],
					[1, 'd']
				])
			)
		).toEqual(['b', 'c', 'd']);
	});

	it('implements cycle next-id rules', () => {
		expect(nextPlacementCycleId('x', [])).toBeUndefined();
		expect(nextPlacementCycleId(null, ['a', 'b'])).toBe('a');
		expect(nextPlacementCycleId('z', ['a', 'b'])).toBe('a');
		expect(nextPlacementCycleId('a', ['a', 'b'])).toBe('b');
		expect(nextPlacementCycleId('b', ['a', 'b'])).toBe('a');
	});

	it('keeps near-invisible hits out of effective lists', () => {
		expect(filterEffectiveHits(hits([[0.01, 'a'], [0.05, 'b'], [1, 'c']]))).toEqual([
			{ opacity: 0.05, placementId: 'b' },
			{ opacity: 1, placementId: 'c' }
		]);
	});
});

// the normal resolver keeps its exact result contract while exposing
// the actionable source hit (with its ray distance) for cross-domain arbitration.
describe('resolveNormalSelectionWithHit', () => {
	it('agrees with resolveNormalSelection for every camera/navigation/placement/deselect shape', () => {
		const fixtures: SelectionHitInfo[][] = [
			// camera helper precedence
			[
				hit('chair-placement', { nodeId: 'paris-seat', handle: 'target' }),
				hit(null, { nodeId: 'paris-seat', handle: 'position' }, 0.01)
			],
			// near-invisible camera ignored → placement
			[
				hit(null, { nodeId: 'paris-seat', handle: 'position' }, 0.01),
				hit('piano-placement')
			],
			// anchor > connection
			[
				{
					opacity: 1,
					placementId: 'chair',
					navigationSelection: { kind: 'connection', connectionId: 'a-b' }
				},
				{
					opacity: 1,
					placementId: null,
					navigationSelection: { kind: 'anchor', connectionId: 'a-b', anchorId: 'a-b-anchor-01' }
				}
			],
			// view-keyframe precedence
			[
				{
					opacity: 1,
					placementId: 'chair',
					navigationSelection: { kind: 'connection', connectionId: 'a-b' }
				},
				{
					opacity: 1,
					placementId: null,
					navigationSelection: {
						kind: 'view-keyframe',
						connectionId: 'a-b',
						direction: 'reverse',
						keyframeId: 'a-b-view-reverse-01'
					}
				}
			],
			// placement
			[hit('chair-placement')],
			// deselect (no hits)
			[],
			// deselect (first effective hit is non-interactive chrome)
			[hit(null)]
		];

		for (const fixture of fixtures) {
			expect(resolveNormalSelectionWithHit(fixture).result).toEqual(
				resolveNormalSelection(fixture)
			);
		}
	});

	it('reports the winning effective hit as the source with its distance', () => {
		// Placement source: the first effective hit, not the nearest tagged hit.
		expect(
			resolveNormalSelectionWithHit([
				{ opacity: 0.01, placementId: 'ghost', distance: 0.5 },
				{ opacity: 1, placementId: 'chair', distance: 1.5 }
			])
		).toEqual({
			result: { action: 'select', id: 'chair' },
			sourceHit: { opacity: 1, placementId: 'chair', distance: 1.5 }
		});

		// Camera source: the effective camera helper wins over a nearer placement.
		expect(
			resolveNormalSelectionWithHit([
				{ opacity: 1, placementId: 'chair', distance: 0.9 },
				{ opacity: 1, placementId: null, cameraSelection: { nodeId: 'n1', handle: 'target' }, distance: 1.2 }
			])
		).toEqual({
			result: { action: 'select-camera', selection: { nodeId: 'n1', handle: 'target' } },
			sourceHit: {
				opacity: 1,
				placementId: null,
				cameraSelection: { nodeId: 'n1', handle: 'target' },
				distance: 1.2
			}
		});
	});

	it('returns sourceHit null for deselect, even with a merely tagged raw intersection', () => {
		expect(resolveNormalSelectionWithHit([])).toEqual({
			result: { action: 'deselect' },
			sourceHit: null
		});
		// A near-invisible tagged hit is filtered → deselect contributes null,
		// not the tagged raw intersection's distance.
		expect(
			resolveNormalSelectionWithHit([{ opacity: 0.01, placementId: 'ghost', distance: 0.5 }])
		).toEqual({
			result: { action: 'deselect' },
			sourceHit: null
		});
		// A lone non-interactive chrome hit deselects with no source distance.
		expect(resolveNormalSelectionWithHit([hit(null)])).toEqual({
			result: { action: 'deselect' },
			sourceHit: null
		});
	});

	it('copies Intersection.distance into hit info', () => {
		const markerGeometry = new Object3D();
		expect(
			selectionHitFromIntersection({ object: markerGeometry, distance: 4.2 } as Intersection)
		).toMatchObject({ opacity: 1, placementId: null, distance: 4.2 });
	});
});

describe('P21.6 Slice B — same-class projected-center arbitration', () => {
	function observer() {
		const observerCamera = new PerspectiveCamera(90, 1, 0.1, 100);
		observerCamera.position.set(0, 0, 5);
		observerCamera.lookAt(0, 0, 0);
		observerCamera.updateMatrixWorld();
		return observerCamera;
	}

	function anchorAt(x: number, y: number, z: number, anchorId: string) {
		const root = new Object3D();
		root.position.set(x, y, z);
		root.userData = { editorEntity: 'camera-anchor', connectionId: 'c1', anchorId };
		return root;
	}

	function asHits(objects: Object3D[]): Intersection[] {
		return objects.map((object) => ({ object, distance: 1 }) as Intersection);
	}

	it('orders same-class overlaps by closest projected center', () => {
		const camera = observer();
		const far = anchorAt(2, 0, 0, 'far');
		const near = anchorAt(0.1, 0, 0, 'near');
		const pointer = { x: 0, y: 0 };
		// Incident order puts the off-pointer anchor first; arbitration
		// promotes the on-pointer one.
		const ordered = sortIntersectionsBySameClassProjectedCenter(
			asHits([far, near]),
			camera,
			pointer
		);
		expect(ordered[0]!.object).toBe(near);
		expect(ordered[1]!.object).toBe(far);
	});

	it('preserves cross-class order for the resolver priority', () => {
		const camera = observer();
		const anchor = anchorAt(0.05, 0, 0, 'a1');
		const node = new Object3D();
		node.position.set(3, 0, 0);
		node.userData = { editorEntity: 'camera-handle', nodeId: 'n1', cameraHandle: 'position' };
		const pointer = { x: 0, y: 0 };
		// Review A/B P2-6 — total order: the winning semantic class leads
		// (nodes outrank anchors per resolver priority) regardless of
		// incident order, so an unrelated hit can never block arbitration.
		const ordered = sortIntersectionsBySameClassProjectedCenter(
			asHits([anchor, node]),
			camera,
			pointer
		);
		expect(ordered.map((hit) => navigationArbitrationClass(hit.object))).toEqual([
			'navigation:node',
			'navigation:anchor'
		]);
	});

	it('sinks helpers behind the observer within their class', () => {
		const camera = observer();
		const behind = anchorAt(0, 0, 10, 'behind');
		const front = anchorAt(2, 0, 0, 'front');
		const ordered = sortIntersectionsBySameClassProjectedCenter(
			asHits([behind, front]),
			camera,
			{ x: 0, y: 0 }
		);
		expect(ordered[0]!.object).toBe(front);
	});
});

describe('P21.6 review (A/B P1-3 + P1-5 + P2-6) — arbitration scope + units', () => {
	function observer() {
		const observerCamera = new PerspectiveCamera(90, 1, 0.1, 100);
		observerCamera.position.set(0, 0, 5);
		observerCamera.lookAt(0, 0, 0);
		observerCamera.updateMatrixWorld();
		return observerCamera;
	}

	function placementAt(x: number, depth: number, id: string) {
		const root = new Object3D();
		root.position.set(x, 0, -5);
		root.updateMatrixWorld();
		root.userData = { editorEntity: 'placement', placementId: id };
		return { object: root, distance: depth, point: new Vector3() } as Intersection;
	}

	function anchorAt(x: number, depth: number, anchorId: string) {
		const root = new Object3D();
		root.position.set(x, 0, -5);
		root.updateMatrixWorld();
		root.userData = { editorEntity: 'camera-anchor', connectionId: 'c', anchorId };
		return { object: root, distance: depth, point: new Vector3() } as Intersection;
	}

	it('preserves distance order for ordinary scene placements', () => {
		const camera = observer();
		// Farther object centered under the cursor must not outrank the
		// nearer intersected object (review probe shape).
		const near = placementAt(1, 1, 'near');
		const far = placementAt(0, 2, 'far');
		expect(
			sortIntersectionsBySameClassProjectedCenter([near, far], camera, { x: 0, y: 0 })[0]
		).toBe(near);
		expect(
			sortIntersectionsBySameClassProjectedCenter([far, near], camera, { x: 0, y: 0 })[0]
		).toBe(near);
	});

	it('sorts anchors even with an unrelated hit between them', () => {
		const camera = observer();
		const a = anchorAt(1, 1, 'a');
		const b = anchorAt(0, 3, 'b');
		const other = placementAt(0, 2, 'other');
		const result = sortIntersectionsBySameClassProjectedCenter(
			[a, other, b],
			camera,
			{ x: 0, y: 0 }
		);
		expect(result.filter((entry) => entry === a || entry === b)[0]).toBe(b);
	});

	it('compares camera handles in CSS pixels on rectangular viewports', () => {
		const camera = observer();
		// NDC: A(0.09, 0) beats B(0, 0.1) on a square viewport…
		const a = anchorAt(0.45, 1, 'a');
		const b = anchorAt(0, 1, 'b');
		b.object.position.set(0, 0.5, -5);
		b.object.updateMatrixWorld();
		const square = sortIntersectionsBySameClassProjectedCenter(
			[b, a],
			camera,
			{ x: 0, y: 0 }
		);
		expect(square[0]).toBe(a);
		// …but on an 800×200 viewport A=36px loses to B=10px.
		const wide = sortIntersectionsBySameClassProjectedCenter(
			[b, a],
			camera,
			{ x: 0, y: 0 },
			{ width: 800, height: 200 }
		);
		expect(wide[0]).toBe(b);
	});

	it('gives FOV handles an explicit class with deterministic order', () => {
		const root = new Object3D();
		root.userData = {
			editorEntity: 'camera-fov-handle',
			owner: 'node',
			nodeId: 'n1',
			side: 'top'
		};
		expect(navigationArbitrationClass(root)).toBe('camera-fov-handle');
	});

	it('excludes hidden FOV roots from tag lookup (review probe shape)', () => {
		const root = new Group();
		root.visible = false;
		root.position.set(0, 0, -5);
		root.userData = {
			editorEntity: 'camera-fov-handle',
			owner: 'node',
			nodeId: 'n',
			side: 'top'
		};
		const shell = new Mesh(
			new SphereGeometry(0.14),
			new MeshBasicMaterial({ colorWrite: false, depthWrite: false, opacity: 1 })
		);
		root.add(shell);
		root.updateMatrixWorld(true);
		const caster = new Raycaster(new Vector3(0.01, 0.01, 0), new Vector3(0, 0, -1));
		const hits = caster.intersectObject(root, true);
		expect(hits.length).toBeGreaterThan(0);
		expect(hits.map((entry) => findCameraFovHandleFromObject(entry.object)).filter(Boolean)).toHaveLength(
			0
		);
		// Visible shells with colorWrite off stay pickable.
		root.visible = true;
		root.updateMatrixWorld(true);
		const visibleHits = caster.intersectObject(root, true);
		expect(
			visibleHits.map((entry) => findCameraFovHandleFromObject(entry.object)).filter(Boolean)
		).not.toHaveLength(0);
		shell.geometry.dispose();
		(shell.material as MeshBasicMaterial).dispose();
	});
});
