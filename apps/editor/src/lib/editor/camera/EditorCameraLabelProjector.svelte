<script lang="ts">
	import { useTask, useThrelte } from '@threlte/core';
	import { Vector3, type Camera } from 'three';
	import { editorCameraLabels, type CameraNodeLabelScreen } from './editor-camera-labels.svelte';
	import type { CameraNodeLabelKind } from './editor-camera-labels';
	import type { EditorStore } from '../editor-store.svelte';

	// P1.7 — shell spec "Viewport MUST show": guided sequence numbering +
	// unsequenced distinction in Camera 3D. Runs inside the Canvas: each frame
	// it resolves every navigation node's world position through the store's
	// runtime scene (same source the camera-handle markers use) and publishes
	// CSS-pixel viewport coordinates to the shared module state the HTML
	// overlay reads. Never renders a mesh, never raycasts, never intercepts
	// pointer events.
	let {
		store,
		kinds
	}: {
		store: EditorStore;
		kinds: CameraNodeLabelKind[];
	} = $props();

	const { camera, canvas } = useThrelte();
	const worldPoint = new Vector3();
	const viewPoint = new Vector3();
	const ndcPoint = new Vector3();

	function sameScreen(a: CameraNodeLabelScreen, b: Omit<CameraNodeLabelScreen, 'nodeId'>) {
		return (
			a.x === b.x &&
			a.y === b.y &&
			a.occluded === b.occluded &&
			a.order === b.order &&
			a.unsequenced === b.unsequenced
		);
	}

	function projectKind(
		observer: Camera,
		position: readonly [number, number, number],
		width: number,
		height: number,
		kind: CameraNodeLabelKind
	): CameraNodeLabelScreen {
		worldPoint.set(...position).project(observer);
		// Camera space: the camera looks down -Z, so a positive view-space Z
		// sits behind the camera — its NDC flip is meaningless, hide it.
		viewPoint.set(...position).applyMatrix4(observer.matrixWorldInverse);
		ndcPoint.copy(viewPoint).applyMatrix4(observer.projectionMatrix);
		const offscreen =
			ndcPoint.x < -1.15 || ndcPoint.x > 1.15 || ndcPoint.y < -1.15 || ndcPoint.y > 1.15;
		return {
			nodeId: kind.nodeId,
			x: (worldPoint.x * 0.5 + 0.5) * width,
			y: (-worldPoint.y * 0.5 + 0.5) * height,
			occluded: viewPoint.z > 0 || offscreen,
			order: kind.order,
			unsequenced: kind.unsequenced
		};
	}

	useTask(() => {
		const current = camera.current;
		if (!current || kinds.length === 0) {
			if (editorCameraLabels.labels.length !== 0) editorCameraLabels.labels = [];
			editorCameraLabels.ready = current !== undefined;
			return;
		}
		current.updateMatrixWorld();
		const width = Math.max(1, canvas.clientWidth);
		const height = Math.max(1, canvas.clientHeight);
		// P21.6 Slice B §4.1 — no per-tick allocation: when the kind list is
		// identical, project into scratch values and mutate the published
		// array in place ($state tracks element writes); a fresh array is
		// built only when membership changes. `occluded` stays
		// behind-observer / outside-viewport only (no wall testing, incomplete
		// near/far rejection) — node discoverability through walls comes from
		// the non-depth-tested markers/rings, and the overlay stays
		// pointer-events-none.
		const previous = editorCameraLabels.labels;
		let sameMembership =
			previous.length === kinds.length;
		if (sameMembership) {
			for (let index = 0; index < kinds.length; index += 1) {
				if (previous[index]!.nodeId !== kinds[index]!.nodeId) {
					sameMembership = false;
					break;
				}
			}
		}
		if (!sameMembership) {
			const next: CameraNodeLabelScreen[] = [];
			for (const kind of kinds) {
				const runtime = store.getRuntimeNavigationNode(kind.nodeId);
				if (!runtime) continue;
				next.push(projectKind(current, runtime.position, width, height, kind));
			}
			editorCameraLabels.labels = next;
			editorCameraLabels.ready = true;
			return;
		}
		let changed = false;
		for (let index = 0; index < kinds.length; index += 1) {
			const kind = kinds[index]!;
			const slot = previous[index]!;
			const runtime = store.getRuntimeNavigationNode(kind.nodeId);
			if (!runtime) {
				if (!slot.occluded) {
					slot.occluded = true;
					changed = true;
				}
				continue;
			}
			const screen = projectKind(current, runtime.position, width, height, kind);
			if (!sameScreen(slot, screen)) {
				slot.x = screen.x;
				slot.y = screen.y;
				slot.occluded = screen.occluded;
				slot.order = screen.order;
				slot.unsequenced = screen.unsequenced;
				changed = true;
			}
		}
		if (changed) editorCameraLabels.labels = [...previous];
		editorCameraLabels.ready = true;
	});
</script>
