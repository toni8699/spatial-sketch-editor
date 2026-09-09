import type { AssetFootprint } from '$lib/types/assets';

/**
 * P24A.2 `generated-obb` pipeline strategy (evidence spike, P24 reconciliation R1).
 *
 * Pure, dependency-free minimum-area oriented bounding rectangle over
 * ground-projected (X/Z) mesh points. The caller projects mesh vertices to the
 * ground plane first (a glTF Transform pipeline step, not app runtime); this
 * module only fits the rectangle.
 *
 * Output honors the canonical `AssetFootprint` contract: pivot-relative metres,
 * `width`/`depth` finite and positive, `outline` a 4-corner simple polygon with
 * non-zero area and no repeated closing point, wound counter-clockwise in X/Z.
 * It is intentionally **not wired into runtime footprint consumption** — the
 * existing hand-authored `validateAssetFootprint` gate stays authoritative until
 * the P24A annex leaves `seed — evidence pending`.
 */

export type ObbInputPoint = readonly [number, number];

export type GenerateObbFootprintResult =
  | { success: true; footprint: AssetFootprint; yawRadians: number }
  | { success: false; error: string };

const POINT_EPSILON = 1e-9;

function pointsEqual(
  a: readonly [number, number],
  b: readonly [number, number]
): boolean {
  return (
    Math.abs(a[0] - b[0]) <= POINT_EPSILON &&
    Math.abs(a[1] - b[1]) <= POINT_EPSILON
  );
}

function deduplicate(points: readonly ObbInputPoint[]): [number, number][] {
  const unique: [number, number][] = [];
  for (const point of points) {
    if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
      continue;
    }
    if (!unique.some((seen) => pointsEqual(seen, point))) {
      unique.push([point[0], point[1]]);
    }
  }
  return unique;
}

function cross(
  origin: readonly [number, number],
  a: readonly [number, number],
  b: readonly [number, number]
): number {
  return (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0]);
}

/** Andrew monotone chain; returns hull counter-clockwise without a repeated endpoint. */
function convexHull(points: [number, number][]): [number, number][] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.length < 3) return sorted;
  const lower: [number, number][] = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, point) <= POINT_EPSILON) {
      lower.pop();
    }
    lower.push(point);
  }
  const upper: [number, number][] = [];
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const point = sorted[index]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, point) <= POINT_EPSILON) {
      upper.pop();
    }
    upper.push(point);
  }
  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

function signedDoubledArea(outline: readonly (readonly [number, number])[]): number {
  let area = 0;
  for (let index = 0; index < outline.length; index += 1) {
    const current = outline[index]!;
    const next = outline[(index + 1) % outline.length]!;
    area += current[0] * next[1] - next[0] * current[1];
  }
  return area;
}

export function generateObbFootprint(
  input: readonly ObbInputPoint[]
): GenerateObbFootprintResult {
  if (input.length === 0) {
    return { success: false, error: 'OBB footprint requires at least one input point' };
  }
  const points = deduplicate(input);
  if (points.length < 3) {
    return { success: false, error: 'OBB footprint requires at least three distinct points' };
  }
  const hull = convexHull(points);
  if (hull.length < 3) {
    return { success: false, error: 'OBB footprint input is collinear or degenerate' };
  }

  // Rotating calipers over hull edges. Smallest area wins; ties within epsilon
  // prefer the smallest absolute yaw (normalized to [-90deg, 90deg)) so
  // axis-aligned inputs keep width on X / depth on Z like hand-authored
  // footprints. First candidate still wins full ties: deterministic.
  const normalizeYaw = (angle: number): number => {
    const turn = Math.PI;
    return ((((angle + turn / 2) % turn) + turn) % turn) - turn / 2;
  };
  let best: { area: number; angle: number; normYaw: number; minX: number; maxX: number; minZ: number; maxZ: number } | undefined;
  for (let index = 0; index < hull.length; index += 1) {
    const current = hull[index]!;
    const next = hull[(index + 1) % hull.length]!;
    const angle = Math.atan2(next[1] - current[1], next[0] - current[0]);
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const point of hull) {
      const x = point[0] * cos - point[1] * sin;
      const z = point[0] * sin + point[1] * cos;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    const area = (maxX - minX) * (maxZ - minZ);
    const normYaw = normalizeYaw(angle);
    if (
      best === undefined ||
      area < best.area - POINT_EPSILON ||
      (Math.abs(area - best.area) <= POINT_EPSILON &&
        Math.abs(normYaw) < Math.abs(best.normYaw) - POINT_EPSILON)
    ) {
      best = { area, angle, normYaw, minX, maxX, minZ, maxZ };
    }
  }
  const winner = best!;
  if (!(winner.area > POINT_EPSILON)) {
    return { success: false, error: 'OBB footprint minimum-area rectangle is degenerate' };
  }

  const cos = Math.cos(winner.angle);
  const sin = Math.sin(winner.angle);
  const corners: [number, number][] = [
    [winner.minX, winner.minZ],
    [winner.maxX, winner.minZ],
    [winner.maxX, winner.maxZ],
    [winner.minX, winner.maxZ]
  ].map(([x, z]) => [x * cos - z * sin, x * sin + z * cos]);
  if (signedDoubledArea(corners) < 0) {
    corners.reverse();
  }
  return {
    success: true,
    footprint: {
      width: winner.maxX - winner.minX,
      depth: winner.maxZ - winner.minZ,
      outline: corners
    },
    yawRadians: winner.angle
  };
}
