import { describe, expect, it } from 'vitest';
import { generateObbFootprint } from '$lib/content/footprint-generator';
import {
  assetFootprintSignedArea,
  getAssetById,
  validateAssetFootprint
} from '$lib/content/assets';

describe('generateObbFootprint (P24A.2 generated-obb evidence spike)', () => {
  it('recovers an axis-aligned rectangle exactly', () => {
    const result = generateObbFootprint([
      [0, 0],
      [2, 0],
      [2, 1],
      [0, 1]
    ]);
    if (!result.success) throw new Error(result.error);
    expect(result.footprint.width).toBeCloseTo(2, 6);
    expect(result.footprint.depth).toBeCloseTo(1, 6);
    expect(validateAssetFootprint(result.footprint)).toBeNull();
  });

  it('recovers a 45-degree rotated square by its true side, not its axis bbox', () => {
    const half = Math.SQRT2;
    const result = generateObbFootprint([
      [0, half],
      [half, 0],
      [0, -half],
      [-half, 0]
    ]);
    if (!result.success) throw new Error(result.error);
    expect(result.footprint.width).toBeCloseTo(2, 6);
    expect(result.footprint.depth).toBeCloseTo(2, 6);
    expect(validateAssetFootprint(result.footprint)).toBeNull();
  });

  it('matches the hand-authored piano OBB box from its outline points', () => {
    const piano = getAssetById('paris-grand-piano');
    const outline = piano?.footprint?.outline;
    if (!outline) throw new Error('piano footprint outline missing');
    const result = generateObbFootprint(outline);
    if (!result.success) throw new Error(result.error);
    expect(result.footprint.width).toBeCloseTo(1.48, 6);
    expect(result.footprint.depth).toBeCloseTo(1.59, 6);
    expect(validateAssetFootprint(result.footprint)).toBeNull();
  });

  it('ignores duplicate points and interior points deterministically', () => {
    const first = generateObbFootprint([
      [0, 0],
      [2, 0],
      [2, 1],
      [0, 1],
      [0, 0],
      [1, 0.5]
    ]);
    const second = generateObbFootprint([
      [0, 1],
      [1, 0.5],
      [2, 1],
      [2, 0],
      [0, 0],
      [0, 0]
    ]);
    if (!first.success || !second.success) throw new Error('expected success');
    expect(first.footprint.width).toBeCloseTo(second.footprint.width, 9);
    expect(first.footprint.depth).toBeCloseTo(second.footprint.depth, 9);
  });

  it('rejects empty, sparse, and collinear input without inventing geometry', () => {
    expect(generateObbFootprint([]).success).toBe(false);
    expect(generateObbFootprint([[0, 0]]).success).toBe(false);
    expect(
      generateObbFootprint([
        [0, 0],
        [1, 1]
      ]).success
    ).toBe(false);
    expect(
      generateObbFootprint([
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3]
      ]).success
    ).toBe(false);
  });

  it('emits a counter-clockwise outline the existing gate accepts', () => {
    const result = generateObbFootprint([
      [0, 0],
      [3, 0.5],
      [2.5, 2],
      [-0.5, 1.5]
    ]);
    if (!result.success) throw new Error(result.error);
    expect(result.footprint.outline).toHaveLength(4);
    expect(validateAssetFootprint(result.footprint)).toBeNull();
    expect(assetFootprintSignedArea(result.footprint.outline!)).toBeGreaterThan(0);
  });
});
