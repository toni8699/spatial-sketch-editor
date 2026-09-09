import { describe, expect, it } from 'vitest';

import {
	applyMatrix,
	convertSceneDocumentToWorldLocal,
	createLayoutRoomRegistry,
	rotationMatrixFromEulerXyz,
	rotationMatrixY,
	type LayoutDocument,
	type SceneDocument
} from '@portfolio/project-model';
import type { Vec3 } from '$lib/types/scene';

const HALF_PI = Math.PI / 2;

/** Minimal one-room legacy layout: origin [10, 20], yaw 90°, elevation 0.5. */
function legacyLayout(): LayoutDocument {
	return {
		units: 'meters',
		floors: [
			{
				id: 'floor-1',
				name: 'Floor 1',
				elevation: 0.5,
				height: 3,
				rooms: [
					{
						id: 'room-a',
						name: 'A',
						frame: { origin: [10, 20], yaw: HALF_PI },
						wallThickness: 0.2,
						floorThickness: 0.1,
						ceilingThickness: 0.1,
						boundary: {
							closed: true,
							segments: [
								{ id: 's', kind: 'line', start: [0, 0], end: [6, 0] },
								{ id: 'e', kind: 'line', start: [6, 0], end: [6, 4] },
								{ id: 'n', kind: 'line', start: [6, 4], end: [0, 4] },
								{ id: 'w', kind: 'line', start: [0, 4], end: [0, 0] }
							]
						},
						openings: []
					}
				]
			}
		],
		objects: []
	};
}

/** Legacy room-local document: every physical value resolves through room-a. */
function legacyScene(): SceneDocument {
	return {
		textures: [],
		materials: [],
		entities: [
			{
				id: 'entity-1',
				name: 'Box',
				kind: 'primitive',
				primitive: 'box',
				dimensions: { width: 1, height: 1, depth: 1 },
				materialId: 'marble-light',
				castShadow: true,
				receiveShadow: true,
				roomId: 'room-a',
				position: [1, 0.5, 2],
				rotation: [0, HALF_PI, 0],
				scale: 2
			}
		],
		navigationNodes: [
			{
				id: 'node-1',
				label: 'Start',
				roomId: 'room-a',
				position: [2, 1.6, 3],
				cameraTarget: [4, 1, 3],
				fov: 60,
				connectedNodeIds: []
			},
			{
				id: 'node-world',
				label: 'World node',
				position: [100, 2, 200],
				cameraTarget: [104, 2, 200],
				fov: 60,
				connectedNodeIds: []
			}
		],
		connections: [
			{
				id: 'conn-1',
				fromNodeId: 'node-1',
				toNodeId: 'node-world',
				clearance: 0.4,
				positionPath: {
					kind: 'rounded-polyline',
					anchors: [{ id: 'anchor-1', roomId: 'room-a', position: [0.5, 1, 0.5] }]
				},
				viewTracks: {
					forward: [{ id: 'kf-1', progress: 0.5, roomId: 'room-a', cameraTarget: [4, 1, 3], fov: 55 }],
					reverse: []
				}
			}
		],
		clusters: [{ id: 'cluster-1', name: 'Group', roomId: 'room-a', memberIds: ['entity-1'] }]
	};
}

describe('Scene world-local conversion (P23.0b / H5)', () => {
	it('resolves room-local entity positions exactly once through the legacy frame', () => {
		const converted = convertSceneDocumentToWorldLocal(legacyScene(), createLayoutRoomRegistry(legacyLayout()));
		const entity = converted.entities[0]!;
		// layoutRoomPoint: x = 10 + x·cos + z·sin = 10 + 0 + 2 = 12
		//                 y = 0.5 + 0.5 = 1
		//                 z = 20 - x·sin + z·cos = 20 - 1 = 19
		const expected: Vec3 = [12, 1, 19];
		expect(entity.position[0]).toBeCloseTo(expected[0], 12);
		expect(entity.position[1]).toBeCloseTo(expected[1], 12);
		expect(entity.position[2]).toBeCloseTo(expected[2], 12);
		// World-local entities lose their roomId: the frame context is gone.
		expect(entity.roomId).toBeUndefined();
		// Physical metadata passes through untouched.
		expect(entity.scale).toBe(2);
		expect(entity.id).toBe('entity-1');
	});

	it('composes yaw-only rotations to the world orientation Ry(yaw + roomYaw)', () => {
		const converted = convertSceneDocumentToWorldLocal(legacyScene(), createLayoutRoomRegistry(legacyLayout()));
		const entity = converted.entities[0]!;
		// Pure-Y local rotation π/2 + room yaw π/2 = π total world yaw. The
		// XYZ Euler *tuple* may legitimately use a different branch (Ry(π)
		// decomposes to x=−π, y≈0, z=−π just as validly as x=0, y=π, z=0), so
		// assert the physical rotation the renderer consumes: applying the
		// converted Euler must equal Ry(π) exactly.
		const applied = applyMatrix(rotationMatrixFromEulerXyz(entity.rotation), [1, 0, 0]);
		const reference = applyMatrix(rotationMatrixY(Math.PI), [1, 0, 0]);
		expect(applied[0]).toBeCloseTo(reference[0], 10);
		expect(applied[1]).toBeCloseTo(reference[1], 10);
		expect(applied[2]).toBeCloseTo(reference[2], 10);
	});

	it('keeps world-local entities exactly as authored (never re-resolved)', () => {
		const document = legacyScene();
		document.entities.push({
			id: 'entity-world',
			name: 'World box',
			kind: 'primitive',
			primitive: 'box',
			dimensions: { width: 1, height: 1, depth: 1 },
			materialId: 'marble-light',
			castShadow: true,
			receiveShadow: true,
			position: [5, 5, 5],
			rotation: [0, 0, 0]
		});
		const converted = convertSceneDocumentToWorldLocal(document, createLayoutRoomRegistry(legacyLayout()));
		const entity = converted.entities.find((candidate) => candidate.id === 'entity-world')!;
		expect(entity.position).toEqual([5, 5, 5]);
		expect(entity.rotation).toEqual([0, 0, 0]);
	});

	it('converts navigation nodes and leaves world nodes untouched', () => {
		const converted = convertSceneDocumentToWorldLocal(legacyScene(), createLayoutRoomRegistry(legacyLayout()));
		const node = converted.navigationNodes.find((candidate) => candidate.id === 'node-1')!;
		// x = 10 + 3 = 13; y = 0.5 + 1.6 = 2.1; z = 20 - 2 = 18
		expect(node.position[0]).toBeCloseTo(13, 12);
		expect(node.position[1]).toBeCloseTo(2.1, 12);
		expect(node.position[2]).toBeCloseTo(18, 12);
		// cameraTarget [4, 1, 3]: x = 10 + 3 = 13; y = 1.5; z = 20 - 4 = 16
		expect(node.cameraTarget[0]).toBeCloseTo(13, 12);
		expect(node.cameraTarget[1]).toBeCloseTo(1.5, 12);
		expect(node.cameraTarget[2]).toBeCloseTo(16, 12);
		expect(node.roomId).toBeUndefined();

		const worldNode = converted.navigationNodes.find((candidate) => candidate.id === 'node-world')!;
		expect(worldNode.position).toEqual([100, 2, 200]);
		expect(worldNode.roomId).toBeUndefined();
	});

	it('converts connection anchors and view-keyframe targets through the frame', () => {
		const converted = convertSceneDocumentToWorldLocal(legacyScene(), createLayoutRoomRegistry(legacyLayout()));
		const connection = converted.connections[0]!;
		// Anchor [0.5, 1, 0.5]: x = 10 + 0.5 = 10.5; y = 1.5; z = 20 - 0.5 = 19.5
		const anchor = connection.positionPath.kind === 'rounded-polyline' ? connection.positionPath.anchors[0]! : null;
		expect(anchor).not.toBeNull();
		expect(anchor!.position[0]).toBeCloseTo(10.5, 12);
		expect(anchor!.position[1]).toBeCloseTo(1.5, 12);
		expect(anchor!.position[2]).toBeCloseTo(19.5, 12);
		expect(anchor!.roomId).toBeUndefined();
		// Keyframe target [4, 1, 3]: x = 13; y = 1.5; z = 16
		const keyframe = connection.viewTracks?.forward[0]!;
		expect(keyframe.cameraTarget[0]).toBeCloseTo(13, 12);
		expect(keyframe.cameraTarget[1]).toBeCloseTo(1.5, 12);
		expect(keyframe.cameraTarget[2]).toBeCloseTo(16, 12);
		expect(keyframe.roomId).toBeUndefined();
	});

	it('strips cluster room frames while preserving membership', () => {
		const converted = convertSceneDocumentToWorldLocal(legacyScene(), createLayoutRoomRegistry(legacyLayout()));
		expect(converted.clusters).toHaveLength(1);
		expect(converted.clusters![0]!.roomId).toBeUndefined();
		expect(converted.clusters![0]!.memberIds).toEqual(['entity-1']);
	});

	it('marks the output with the world-local format discriminator', () => {
		const converted = convertSceneDocumentToWorldLocal(legacyScene(), createLayoutRoomRegistry(legacyLayout()));
		expect(converted.formatVersion).toBe(1);
	});

	it('is lossless on identity and non-spatial metadata', () => {
		const document = legacyScene();
		const converted = convertSceneDocumentToWorldLocal(document, createLayoutRoomRegistry(legacyLayout()));
		expect(converted.entities.map((entity) => entity.id)).toEqual(document.entities.map((entity) => entity.id));
		expect(converted.navigationNodes.map((node) => node.id)).toEqual(document.navigationNodes.map((node) => node.id));
		expect(converted.connections.map((connection) => connection.id)).toEqual(document.connections.map((connection) => connection.id));
		expect(converted.connections[0]!.clearance).toBe(0.4);
		expect(converted.entities[0]!.name).toBe('Box');
	});
});
