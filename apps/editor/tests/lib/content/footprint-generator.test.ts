import { describe, expect, it } from 'vitest';
import { generateObbFootprint } from '../../../assets-source/plan-proxy/footprint-generator';
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

  it('keeps the tight oriented outline but reports canonical X/Z bounds', () => {
    const half = Math.SQRT2;
    const result = generateObbFootprint([
      [0, half],
      [half, 0],
      [0, -half],
      [-half, 0]
    ]);
    if (!result.success) throw new Error(result.error);
    // Canonical bounds span 2√2; the outline itself stays the tight 2×2 square.
    expect(result.footprint.width).toBeCloseTo(2 * Math.SQRT2, 6);
    expect(result.footprint.depth).toBeCloseTo(2 * Math.SQRT2, 6);
    expect(Math.abs(assetFootprintSignedArea(result.footprint.outline!))).toBeCloseTo(8, 6);
    expect(validateAssetFootprint(result.footprint)).toBeNull();
  });

  it('matches the hand-authored piano box from its outline points', () => {
    const piano = getAssetById('paris-grand-piano');
    const outline = piano?.footprint?.outline;
    if (!outline) throw new Error('piano footprint outline missing');
    const result = generateObbFootprint(outline);
    if (!result.success) throw new Error(result.error);
    expect(result.footprint.width).toBeCloseTo(1.48, 6);
    expect(result.footprint.depth).toBeCloseTo(1.59, 6);
    expect(validateAssetFootprint(result.footprint)).toBeNull();
  });

  it('is fully deterministic under input reordering', () => {
    const first = generateObbFootprint([
      [0, 0],
      [3, 0.5],
      [2.5, 2],
      [-0.5, 1.5],
      [1, 1]
    ]);
    const second = generateObbFootprint([
      [1, 1],
      [-0.5, 1.5],
      [0, 0],
      [2.5, 2],
      [3, 0.5]
    ]);
    if (!first.success || !second.success) throw new Error('expected success');
    expect(second).toEqual(first);
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

  it('rejects non-finite points instead of silently repairing them', () => {
    const result = generateObbFootprint([
      [0, 0],
      [2, 0],
      [2, 1],
      [Number.NaN, 0.5]
    ]);
    expect(result.success).toBe(false);
    if (result.success) throw new Error('expected failure');
    expect(result.error).toMatch(/non-finite/);
    expect(
      generateObbFootprint([
        [0, 0],
        [2, 0],
        [2, 1],
        [0, Number.POSITIVE_INFINITY]
      ]).success
    ).toBe(false);
  });

  it('bounds a round table archetype by its diameter (oracle shape)', () => {
    const samples: [number, number][] = [];
    for (let index = 0; index < 64; index += 1) {
      const angle = (index / 64) * Math.PI * 2;
      samples.push([0.7 * Math.cos(angle), 0.7 * Math.sin(angle)]);
    }
    const result = generateObbFootprint(samples);
    if (!result.success) throw new Error(result.error);
    // A sampled circle yields a near-square OBB between the inscribed
    // (1.4) and diagonal (1.4√2) bounds — never a collapsed sliver.
    expect(result.footprint.width).toBeCloseTo(result.footprint.depth, 1);
    expect(result.footprint.width).toBeGreaterThanOrEqual(1.4);
    expect(result.footprint.width).toBeLessThanOrEqual(1.4 * Math.SQRT2 + 1e-6);
    expect(validateAssetFootprint(result.footprint)).toBeNull();
  });

  it('bounds a thin-leg table archetype by the leg span, not the top (oracle shape)', () => {
    // Four 0.06m posts at ±0.5 plus a 1.4m top sampled sparsely: the OBB must
    // cover the full occupied span while staying a valid footprint.
    const samples: [number, number][] = [
      [-0.7, -0.45],
      [0.7, -0.45],
      [0.7, 0.45],
      [-0.7, 0.45],
      [-0.5, -0.5],
      [0.5, -0.5],
      [0.5, 0.5],
      [-0.5, 0.5]
    ];
    const result = generateObbFootprint(samples);
    if (!result.success) throw new Error(result.error);
    expect(result.footprint.width).toBeCloseTo(1.4, 6);
    expect(result.footprint.depth).toBeCloseTo(1.0, 6);
    expect(validateAssetFootprint(result.footprint)).toBeNull();
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
