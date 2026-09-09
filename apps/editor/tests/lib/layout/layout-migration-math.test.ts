import { describe, expect, it } from 'vitest';
import { Euler, Matrix4, Vector3 } from 'three';

import {
	applyMatrix,
	composedYawForPureYawRotation,
	eulerXyzFromRotationMatrix,
	legacyRoomFrameRotation,
	migrateEntityTransform,
	multiplyMatrix,
	rotationMatrixFromEulerXyz,
	rotationMatrixY
} from '@portfolio/layout-core';
import type { Vec3 } from '$lib/types/scene';

/** Reference composition: three.js 'XYZ' Euler → rotate → decompose. */
function threeReference(rotation: Vec3, v: Vec3): Vec3 {
	const m = new Matrix4().makeRotationFromEuler(new Euler(rotation[0], rotation[1], rotation[2], 'XYZ'));
	return new Vector3(...v).applyMatrix4(m).toArray() as Vec3;
}

describe('migration math — three.js XYZ Euler parity (P23.0b / H5)', () => {
	it('rotates exactly like Matrix4.makeRotationFromEuler for generic rotations', () => {
		const rotation: Vec3 = [0.3, -1.2, 0.7];
		const v: Vec3 = [1.5, -2, 0.25];
		const ours = applyMatrix(rotationMatrixFromEulerXyz(rotation), v);
		const reference = threeReference(rotation, v);
		expect(ours[0]).toBeCloseTo(reference[0], 12);
		expect(ours[1]).toBeCloseTo(reference[1], 12);
		expect(ours[2]).toBeCloseTo(reference[2], 12);
	});

	it('decomposes the full rotation matrix back to the authored Euler', () => {
		const rotation: Vec3 = [0.3, -1.2, 0.7];
		const roundTrip = eulerXyzFromRotationMatrix(rotationMatrixFromEulerXyz(rotation));
		expect(roundTrip[0]).toBeCloseTo(rotation[0], 10);
		expect(roundTrip[1]).toBeCloseTo(rotation[1], 10);
		expect(roundTrip[2]).toBeCloseTo(rotation[2], 10);
	});

	it('round-trips arbitrary rotations through compose → apply → decompose', () => {
		const rotation: Vec3 = [0.45, 2.4, -1.1];
		const v: Vec3 = [0.75, -0.5, 2];
		const decomposed = eulerXyzFromRotationMatrix(rotationMatrixFromEulerXyz(rotation));
		const ours = applyMatrix(rotationMatrixFromEulerXyz(decomposed), v);
		const reference = threeReference(rotation, v);
		expect(ours[0]).toBeCloseTo(reference[0], 10);
		expect(ours[1]).toBeCloseTo(reference[1], 10);
		expect(ours[2]).toBeCloseTo(reference[2], 10);
	});

	it('handles the gimbal-lock branch like three.js (pitch ±90°)', () => {
		// With y = π/2 the XYZ decomposition is degenerate; three.js resolves
		// x = atan2(m32, m22), z = 0. Our round trip must reproduce the same
		// applied world vector (the pinned convention).
		const rotation: Vec3 = [0.3, Math.PI / 2, -0.4];
		const v: Vec3 = [1, 2, 3];
		const decomposed = eulerXyzFromRotationMatrix(rotationMatrixFromEulerXyz(rotation));
		const ours = applyMatrix(rotationMatrixFromEulerXyz(decomposed), v);
		const reference = threeReference(rotation, v);
		expect(ours[0]).toBeCloseTo(reference[0], 9);
		expect(ours[1]).toBeCloseTo(reference[1], 9);
		expect(ours[2]).toBeCloseTo(reference[2], 9);
	});

	it('composes a room frame and a local rotation like Matrix4.multiply', () => {
		const roomYaw = 1.1;
		const local: Vec3 = [0.2, 0.6, -0.9];
		const composed = multiplyMatrix(legacyRoomFrameRotation(roomYaw), rotationMatrixFromEulerXyz(local));
		const reference = new Matrix4()
			.makeRotationFromEuler(new Euler(0, roomYaw, 0, 'XYZ'))
			.multiply(new Matrix4().makeRotationFromEuler(new Euler(local[0], local[1], local[2], 'XYZ')));
		const v: Vec3 = [1, 0, 0];
		const ours = applyMatrix(composed, v);
		const ref = new Vector3(...v).applyMatrix4(reference).toArray() as Vec3;
		expect(ours[0]).toBeCloseTo(ref[0], 12);
		expect(ours[1]).toBeCloseTo(ref[1], 12);
		expect(ours[2]).toBeCloseTo(ref[2], 12);
	});
});

describe('migration math — legacy Room frame composition (P23.0b)', () => {
	it('composes positions exactly like layoutRoomPoint (Ry(yaw) + origin + elevation)', () => {
		// layoutRoomPoint: world = Ry(yaw)·local + [origin.x, elevation, origin.z]
		const frame = { origin: [10, -4] as const, yaw: -Math.PI / 4, floorElevation: 2.5 };
		const local = { position: [1, 0.5, 2] as Vec3, rotation: [0, 0.3, 0] as Vec3 };
		const migrated = migrateEntityTransform(local, frame);
		// Manual layoutRoomPoint computation:
		const cos = Math.cos(frame.yaw);
		const sin = Math.sin(frame.yaw);
		const expected: Vec3 = [
			frame.origin[0] + local.position[0] * cos + local.position[2] * sin,
			frame.floorElevation + local.position[1],
			frame.origin[1] - local.position[0] * sin + local.position[2] * cos
		];
		expect(migrated.position[0]).toBeCloseTo(expected[0], 12);
		expect(migrated.position[1]).toBeCloseTo(expected[1], 12);
		expect(migrated.position[2]).toBeCloseTo(expected[2], 12);
	});

	it('never applies the room yaw by scalar addition for non-yaw rotations (H5 rule)', () => {
		// The forbidden `yaw += roomYaw` shortcut diverges from the matrix
		// composition the moment the local rotation carries X or Z: prove the
		// implementation uses the matrix.
		const frame = { origin: [0, 0] as const, yaw: Math.PI / 2, floorElevation: 0 };
		const local = { position: [0, 0, 0] as Vec3, rotation: [0.5, 0.2, 0.3] as Vec3 };
		const migrated = migrateEntityTransform(local, frame);
		// Reference: R_room · R_local decomposed back to Euler.
		const reference = eulerXyzFromRotationMatrix(
			multiplyMatrix(legacyRoomFrameRotation(frame.yaw), rotationMatrixFromEulerXyz(local.rotation))
		);
		expect(migrated.rotation[0]).toBeCloseTo(reference[0], 12);
		expect(migrated.rotation[1]).toBeCloseTo(reference[1], 12);
		expect(migrated.rotation[2]).toBeCloseTo(reference[2], 12);
		// The scalar shortcut would claim yaw = 0.2 + π/2 — demonstrably wrong.
		expect(migrated.rotation[1]).not.toBeCloseTo(local.rotation[1] + frame.yaw, 3);
	});

	it('agrees with the runtime rotation[1] + yaw convention for pure-Y locals', () => {
		// The editor's Plan gestures compose yaw-only entities as
		// `rotation[1] + yaw`; the general matrix path must produce exactly
		// that yaw (modulo 2π) for the yaw-only case the runtime specialises.
		for (const [localYaw, roomYaw] of [
			[0.2, 0.4],
			[3.0, -3.1],
			[-2.5, 1.3]
		] as const) {
			const frame = { origin: [5, 5] as const, yaw: roomYaw, floorElevation: 0 };
			const local = { position: [0, 0, 0] as Vec3, rotation: [0, localYaw, 0] as Vec3 };
			const migrated = migrateEntityTransform(local, frame);
			const composed = composedYawForPureYawRotation(localYaw, roomYaw);
			expect(migrated.rotation[0]).toBeCloseTo(0, 10);
			expect(migrated.rotation[2]).toBeCloseTo(0, 10);
			// Compare on the unit circle so ±π wrap cannot flake.
			expect(Math.cos(migrated.rotation[1])).toBeCloseTo(Math.cos(composed), 10);
			expect(Math.sin(migrated.rotation[1])).toBeCloseTo(Math.sin(composed), 10);
		}
	});

	it('rotationMatrixY matches the legacy frame exactly', () => {
		const yaw = 0.77;
		const m = rotationMatrixY(yaw);
		const reference = new Matrix4().makeRotationY(yaw);
		const v: Vec3 = [2, -1, 0.5];
		const ours = applyMatrix(m, v);
		const ref = new Vector3(...v).applyMatrix4(reference).toArray() as Vec3;
		expect(ours[0]).toBeCloseTo(ref[0], 12);
		expect(ours[1]).toBeCloseTo(ref[1], 12);
		expect(ours[2]).toBeCloseTo(ref[2], 12);
	});
});
