import { describe, expect, it } from 'vitest';
import {
	BufferGeometry,
	Mesh,
	PerspectiveCamera,
	Plane,
	Raycaster,
	Vector3
} from 'three';
import { getRoom } from '$lib/content/rooms';
import {
	clampEditorCameraFrustumDepth,
	createEditorCameraFramingGeometry,
	createEditorCameraFramingBasis,
	createEditorCameraFrustumLinePoints,
	createEditorCameraFovDragBasis,
	evaluateEditorCameraFovDrag,
	framingOwnerKey,
	isFramingSelectionEligible,
	pickShellScale,
	resolveCameraPreviewFramingOwner,
	setEditorCameraFramingOrientation,
	verticalFovFromEditorCameraFrustumPoint,
	writeEditorCameraFrustumLinePositions,
	writeEditorCameraFrustumVolumePositions,
	EDITOR_CAMERA_FRUSTUM_LINE_FLOATS,
	EDITOR_CAMERA_FRUSTUM_VOLUME_FLOATS,
	EDITOR_CAMERA_FRUSTUM_VOLUME_INDEX,
	EDITOR_CAMERA_FRUSTUM_VOLUME_VERTEX_COUNT
} from '$lib/editor/camera/editor-camera-framing';
import { createEditorRoomCameraFrame } from '$lib/editor/camera/editor-camera';

describe('editor camera framing geometry', () => {
	it('clamps finite frustum depth without changing authored target distance', () => {
		expect(clampEditorCameraFrustumDepth(0.5)).toBe(2);
		expect(clampEditorCameraFrustumDepth(4)).toBe(4);
		expect(clampEditorCameraFrustumDepth(20)).toBe(8);
	});

	it('builds a finite vertical-FOV frame around the aim axis', () => {
		const geometry = createEditorCameraFramingGeometry(
			[0, 1, 0],
			[0, 1, -4],
			90,
			2
		);
		expect(geometry.depth).toBe(4);
		expect(geometry.center).toEqual([0, 1, -4]);
		expect(geometry.topHandle[1]).toBeCloseTo(5);
		expect(geometry.bottomHandle[1]).toBeCloseTo(-3);
		expect(geometry.corners[0]![0]).toBeCloseTo(-8);
		expect(geometry.corners[1]![0]).toBeCloseTo(8);
	});

	it('builds eye-to-corner rays and a closed FOV-plane rectangle for the finite frustum', () => {
		const position: [number, number, number] = [0, 1, 0];
		const target: [number, number, number] = [0, 1, -4];
		const geometry = createEditorCameraFramingGeometry(position, target, 90, 2);
		const points = createEditorCameraFrustumLinePoints(position, geometry);
		expect(points).toHaveLength(16);
		expect(points[0]!.toArray()).toEqual([0, 1, 0]);
		expect(points[1]!.toArray()).toEqual(geometry.corners[0]);
		expect(points[2]!.toArray()).toEqual([0, 1, 0]);
		expect(points[3]!.toArray()).toEqual(geometry.corners[1]);
		// The four rectangle edges close the FOV plane back to the first corner.
		expect(points[14]!.toArray()).toEqual(geometry.corners[3]);
		expect(points[15]!.toArray()).toEqual(geometry.corners[0]);
	});

	it('derives and clamps vertical FOV from a side-handle point', () => {
		expect(
			verticalFovFromEditorCameraFrustumPoint(
				[0, 0, 0],
				[0, 0, -4],
				[0, 4, -4]
			)
		).toBeCloseTo(90);
		expect(
			verticalFovFromEditorCameraFrustumPoint(
				[0, 0, 0],
				[0, 0, -4],
				[0, 100, -4]
			)
		).toBe(120);
		expect(
			verticalFovFromEditorCameraFrustumPoint(
				[0, 0, 0],
				[0, 0, -4],
				[0, 0.001, -4]
			)
		).toBe(10);
	});
});

describe('P21.6 Slice B — frustum volume + line fixed layouts', () => {
	const eye: [number, number, number] = [0, 1, 0];
	const geometry = () => createEditorCameraFramingGeometry(eye, [0, 1, -4], 90, 2);

	it('pins the 6-triangle capped-pyramid index layout over apex + 4 corners', () => {
		expect(EDITOR_CAMERA_FRUSTUM_VOLUME_VERTEX_COUNT).toBe(5);
		expect(EDITOR_CAMERA_FRUSTUM_VOLUME_INDEX).toHaveLength(18);
		expect(EDITOR_CAMERA_FRUSTUM_VOLUME_FLOATS).toBe(15);
		for (const index of EDITOR_CAMERA_FRUSTUM_VOLUME_INDEX) {
			expect(index).toBeGreaterThanOrEqual(0);
			expect(index).toBeLessThan(5);
		}
		// Plan-specified faces: left [0,1,4], right [0,3,2], top [0,2,1],
		// bottom [0,4,3], cap [1,2,3] + [1,3,4].
		expect([...EDITOR_CAMERA_FRUSTUM_VOLUME_INDEX]).toEqual([
			0, 1, 4, 0, 3, 2, 0, 2, 1, 0, 4, 3, 1, 2, 3, 1, 3, 4
		]);
	});

	it('writes apex + TL/TR/BR/BL corners in place and rejects small buffers', () => {
		const out = new Float32Array(EDITOR_CAMERA_FRUSTUM_VOLUME_FLOATS);
		const framing = geometry();
		writeEditorCameraFrustumVolumePositions(out, eye, framing);
		const corners: Array<[number, number, number]> = [
			[0, 1, 0],
			[...framing.corners[0]!],
			[...framing.corners[1]!],
			[...framing.corners[2]!],
			[...framing.corners[3]!]
		];
		for (let vertex = 0; vertex < corners.length; vertex += 1) {
			for (let axis = 0; axis < 3; axis += 1) {
				expect(out[vertex * 3 + axis]).toBeCloseTo(corners[vertex]![axis]!, 6);
			}
		}
		expect(() => writeEditorCameraFrustumVolumePositions(new Float32Array(3), eye, framing)).toThrow();
	});

	it('writes the 16-point perimeter in the allocating variant order', () => {
		const out = new Float32Array(EDITOR_CAMERA_FRUSTUM_LINE_FLOATS);
		const framing = geometry();
		writeEditorCameraFrustumLinePositions(out, eye, framing);
		const points = createEditorCameraFrustumLinePoints(eye, framing);
		expect(points).toHaveLength(16);
		for (let index = 0; index < points.length; index += 1) {
			const point = points[index]!.toArray();
			expect(out[index * 3]).toBeCloseTo(point[0], 6);
			expect(out[index * 3 + 1]).toBeCloseTo(point[1], 6);
			expect(out[index * 3 + 2]).toBeCloseTo(point[2], 6);
		}
		expect(() => writeEditorCameraFrustumLinePositions(new Float32Array(3), eye, framing)).toThrow();
	});
});

describe('P21.6 Slice B — frozen FOV-drag solver', () => {
	const eye: [number, number, number] = [0, 0, 0];
	const forward: [number, number, number] = [0, 0, -1];
	const up: [number, number, number] = [0, 1, 0];

	function rayPlaneBasis(
		side: 'top' | 'bottom',
		rayDirection: [number, number, number] = [0, 0, -1]
	) {
		const depth = 4;
		const h0 = depth * Math.tan((90 * Math.PI) / 360);
		const p0: [number, number, number] =
			side === 'top' ? [0, h0, -depth] : [0, -h0, -depth];
		return createEditorCameraFovDragBasis({
			eye,
			forward,
			up,
			depth,
			fov0: 90,
			side,
			rayDirection,
			p0,
			startClientY: 100
		});
	}

	it('locks the ray-plane branch for head-on rays, slider for grazing rays', () => {
		expect(rayPlaneBasis('top', [0, 0, -1]).useSlider).toBe(false);
		// Anti-parallel is still a clean normal hit (|alignment| = 1).
		expect(rayPlaneBasis('top', [0, 0, 1]).useSlider).toBe(false);
		expect(rayPlaneBasis('top', [1, 0, 0]).useSlider).toBe(true);
		// Threshold 0.15 locks the branch: alignment is |ray·normal|, so a
		// near-normal ray holds the ray-plane solver while a near-planar
		// (grazing) ray takes the slider.
		const onThreshold: [number, number, number] = [
			Math.sqrt(1 - 0.15 * 0.15),
			0,
			-0.15
		];
		const belowThreshold: [number, number, number] = [
			Math.sqrt(1 - 0.149 * 0.149),
			0,
			-0.149
		];
		expect(rayPlaneBasis('top', onThreshold).useSlider).toBe(false);
		expect(rayPlaneBasis('top', belowThreshold).useSlider).toBe(true);
	});

	it('locks the slider when the grab point is missing', () => {
		const basis = createEditorCameraFovDragBasis({
			eye,
			forward,
			up,
			depth: 4,
			fov0: 54,
			side: 'top',
			rayDirection: [0, 0, -1],
			p0: null,
			startClientY: 100
		});
		expect(basis.useSlider).toBe(true);
	});

	it('preserves the grab offset with signed handle identity (no abs inversion)', () => {
		const top = rayPlaneBasis('top');
		expect(evaluateEditorCameraFovDrag(top, [0, 5, -4], 100)).toBeCloseTo(
			(2 * Math.atan2(5, 4) * 180) / Math.PI,
			6
		);
		// Bottom handle pulled outward (downward) widens identically.
		const bottom = rayPlaneBasis('bottom');
		expect(evaluateEditorCameraFovDrag(bottom, [0, -5, -4], 100)).toBeCloseTo(
			(2 * Math.atan2(5, 4) * 180) / Math.PI,
			6
		);
	});

	it('clamps a center-crossing pull at min instead of inverting or NaN', () => {
		const bottom = rayPlaneBasis('bottom');
		expect(evaluateEditorCameraFovDrag(bottom, [0, 4, -4], 100)).toBe(10);
		const top = rayPlaneBasis('top');
		expect(evaluateEditorCameraFovDrag(top, [0, -100, -4], 100)).toBe(10);
		expect(evaluateEditorCameraFovDrag(top, [0, 100, -4], 100)).toBe(120);
	});

	it('drives the virtual slider from clientY deltas (up-drag widens)', () => {
		const basis = rayPlaneBasis('top', [1, 0, 0]);
		expect(basis.useSlider).toBe(true);
		expect(evaluateEditorCameraFovDrag(basis, null, 100)).toBe(90);
		expect(evaluateEditorCameraFovDrag(basis, null, 50)).toBe(100);
		// CSS pixels grow downward: dragging down narrows to min,
		// dragging far up clamps at max.
		expect(evaluateEditorCameraFovDrag(basis, null, 600)).toBe(10);
		expect(evaluateEditorCameraFovDrag(basis, null, -600)).toBe(120);
	});

	it('holds the last valid FOV on invalid intersections without switching solvers', () => {
		const basis = rayPlaneBasis('top');
		expect(basis.useSlider).toBe(false);
		expect(evaluateEditorCameraFovDrag(basis, null, 100)).toBe(90);
		expect(
			evaluateEditorCameraFovDrag(basis, [Number.NaN, 0, -4], 100)
		).toBe(90);
		const moved = evaluateEditorCameraFovDrag(basis, [0, 5, -4], 100);
		expect(evaluateEditorCameraFovDrag(basis, null, 100)).toBeCloseTo(moved, 9);
	});
});

describe('P21.6 Slice B — 24px pick-shell clamp', () => {
	it('holds the authored radius at close range and grows at distance', () => {
		// depth 4, 90° vertical, 800px viewport: required r = 4·1·24/800 = 0.12
		// < 0.14 shell → scale 1.
		expect(pickShellScale(4, 90, 800, 0.14)).toBe(1);
		// depth 10: required r = 0.3 → 0.3/0.14 ≈ 2.143.
		expect(pickShellScale(10, 90, 800, 0.14)).toBeCloseTo(0.3 / 0.14, 9);
	});

	it('guards non-finite, non-positive, and empty-viewport inputs', () => {
		expect(pickShellScale(0, 90, 800, 0.14)).toBe(1);
		expect(pickShellScale(-2, 90, 800, 0.14)).toBe(1);
		expect(pickShellScale(4, 90, 0, 0.14)).toBe(1);
		expect(pickShellScale(4, 90, 800, 0)).toBe(1);
		expect(pickShellScale(Number.NaN, 90, 800, 0.14)).toBe(1);
	});
});

describe('P21.6 review (A/B) — preview ownership + owner identity', () => {
	it('resolves playhead / selection / none across transport, selection, Frame, and eligibility', () => {
		const base = {
			hasDirectorPreview: true,
			previewPlaying: false,
			hasEditableSelection: false,
			framingVisible: true,
			selectionEligible: true
		};
		// No preview: default owner (callers only consult under preview).
		expect(
			resolveCameraPreviewFramingOwner({ ...base, hasDirectorPreview: false })
		).toBe('playhead');
		// Playing Director → playhead even with an editable selection.
		expect(
			resolveCameraPreviewFramingOwner({
				...base,
				previewPlaying: true,
				hasEditableSelection: true
			})
		).toBe('playhead');
		// Paused + editable → selection owns the filled helper.
		expect(
			resolveCameraPreviewFramingOwner({ ...base, hasEditableSelection: true })
		).toBe('selection');
		// Paused + no editable selection → none (deselect never resurrects
		// the wireframe).
		expect(resolveCameraPreviewFramingOwner(base)).toBe('none');
		// Frame off suppresses both implementations, including playback.
		expect(
			resolveCameraPreviewFramingOwner({
				...base,
				previewPlaying: true,
				framingVisible: false
			})
		).toBe('none');
		expect(
			resolveCameraPreviewFramingOwner({
				...base,
				hasEditableSelection: true,
				framingVisible: false
			})
		).toBe('none');
		// An ineligible selection helper (wrong workspace / pending
		// placement) cannot suppress the playhead.
		expect(
			resolveCameraPreviewFramingOwner({
				...base,
				hasEditableSelection: true,
				selectionEligible: false
			})
		).toBe('playhead');
		expect(
			resolveCameraPreviewFramingOwner({ ...base, selectionEligible: false })
		).toBe('playhead');
	});

	it('gates selection-helper eligibility on workspace + pending placement', () => {
		expect(
			isFramingSelectionEligible({ workspace: 'camera', hasPendingPlacement: false })
		).toBe(true);
		expect(
			isFramingSelectionEligible({ workspace: 'camera', hasPendingPlacement: true })
		).toBe(false);
		expect(
			isFramingSelectionEligible({ workspace: 'scene', hasPendingPlacement: false })
		).toBe(false);
		expect(
			isFramingSelectionEligible({ workspace: null, hasPendingPlacement: false })
		).toBe(false);
	});

	it('keys owners by node ID and full view-keyframe identity', () => {
		expect(framingOwnerKey({ owner: 'node', nodeId: 'a' })).toBe('node:a');
		expect(framingOwnerKey({ owner: 'node', nodeId: 'b' })).not.toBe(
			framingOwnerKey({ owner: 'node', nodeId: 'a' })
		);
		const keyframe = {
			owner: 'view-keyframe' as const,
			connectionId: 'c1',
			direction: 'forward',
			keyframeId: 'k1'
		};
		expect(framingOwnerKey(keyframe)).toBe('view-keyframe:c1:forward:k1');
		expect(
			framingOwnerKey({ ...keyframe, direction: 'reverse' })
		).not.toBe(framingOwnerKey(keyframe));
		expect(framingOwnerKey({ ...keyframe, keyframeId: 'k2' })).not.toBe(
			framingOwnerKey(keyframe)
		);
	});
});

describe('P21.6 review (A/B P1-4 + P2-7) — drag grazing guard + shared orientation', () => {
	function dragBasis() {
		return createEditorCameraFovDragBasis({
			eye: [0, 0, 0],
			forward: [0, 0, -1],
			up: [0, 1, 0],
			depth: 4,
			fov0: 54,
			side: 'top',
			rayDirection: [0, 0, -1],
			p0: [0, 2, -4],
			startClientY: 0
		});
	}

	it('holds the last valid FOV when the movement ray turns near-parallel', () => {
		const basis = dragBasis();
		expect(basis.useSlider).toBe(false);
		// Grazing move (alignment ≈ 1e-5): the plane hit is a 1/sin(θ)
		// blowup at y ≈ 5e5 — hold 54° instead of clamping to the 120° rail.
		const grazing = new Raycaster(
			new Vector3(0, 0, 1),
			new Vector3(0, 1, -0.00001).normalize()
		);
		const plane = new Plane(new Vector3(0, 0, -1), -4);
		const p = grazing.ray.intersectPlane(plane, new Vector3());
		expect(p).not.toBeNull();
		expect(
			evaluateEditorCameraFovDrag(basis, p!.toArray() as [number, number, number], 1)
		).toBe(54);
		// Same blowup with the live ray supplied: per-move recheck holds too.
		const basis2 = dragBasis();
		expect(
			evaluateEditorCameraFovDrag(
				basis2,
				p!.toArray() as [number, number, number],
				1,
				grazing.ray.direction.toArray() as [number, number, number]
			)
		).toBe(54);
	});

	it('still solves well-aligned moves and clamps on-screen pulls to the rails', () => {
		const basis = dragBasis();
		const moved = evaluateEditorCameraFovDrag(
			basis,
			[0, 5, -4],
			0,
			[0, 0, -1]
		);
		expect(moved).toBeGreaterThan(54);
		expect(moved).toBeLessThan(120);
		// On-screen rail pull (existing contract): clamps, never holds.
		expect(evaluateEditorCameraFovDrag(dragBasis(), [0, 100, -4], 0)).toBe(120);
	});

	it('orients meshes (+Z) and cameras (−Z) from the same basis, including near-vertical aim', () => {
		for (const target of [
			new Vector3(0, 0, -4),
			new Vector3(0.01, 1, 0),
			new Vector3(0, 5, -0.001)
		]) {
			const eye = new Vector3(0, 0, 0);
			const mesh = new Mesh(new BufferGeometry());
			const preview = new PerspectiveCamera();
			setEditorCameraFramingOrientation(mesh, eye, target);
			setEditorCameraFramingOrientation(preview, eye, target);
			const basis = createEditorCameraFramingBasis(eye, target);
			// Mesh +Z tracks the framing forward; camera −Z tracks it too.
			const meshForward = new Vector3(0, 0, 1).applyQuaternion(mesh.quaternion);
			const cameraForward = new Vector3(0, 0, -1).applyQuaternion(preview.quaternion);
			expect(meshForward.dot(basis.forward)).toBeCloseTo(1, 9);
			expect(cameraForward.dot(basis.forward)).toBeCloseTo(1, 9);
			// Mesh and preview agree with each other (the P2-7 probe shape).
			expect(meshForward.dot(cameraForward)).toBeCloseTo(1, 9);
			mesh.geometry.dispose();
		}
	});

	it('leaves orientation untouched for coincident eye/target', () => {
		const mesh = new Mesh(new BufferGeometry());
		const before = mesh.quaternion.clone();
		setEditorCameraFramingOrientation(mesh, new Vector3(1, 2, 3), new Vector3(1, 2, 3));
		expect(mesh.quaternion.equals(before)).toBe(true);
		mesh.geometry.dispose();
	});
});

// Slice 4 — the `editor room camera framing` describe block (pure helper,
// invocation-bound to the Paris room from the fixture) lives on this file
// now alongside the geometry helpers.
describe('editor room camera framing', () => {
	it('centers the target in Paris and follows its authored yaw', () => {
		const room = getRoom('paris');
		const frame = createEditorRoomCameraFrame(room);

		expect(frame.target).toEqual([
			room.position[0],
			room.position[1] + room.dimensions[1] / 2,
			room.position[2]
		]);
		expect(frame.position.every(Number.isFinite)).toBe(true);
		expect(frame.radius).toBeGreaterThan(0);
		expect(frame.minDistance).toBe(0.2);
		expect(frame.minDistance).toBeLessThan(frame.maxDistance);

		const dx = frame.position[0] - frame.target[0];
		const dz = frame.position[2] - frame.target[2];
		expect(Math.atan2(dx, dz)).toBeCloseTo(room.rotation[1]);
	});
});
