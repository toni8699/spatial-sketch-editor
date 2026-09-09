import type { AssetFootprint } from '../../src/lib/types/assets';

/**
 * P24A.2 `generated-obb` pipeline strategy (disposable evidence spike, P24
 * reconciliation R1). Lives under `assets-source/` — the pipeline-owned side —
 * on purpose: it must not establish "asset pipeline code belongs under editor
 * `$lib/content`". Promote it into a real pipeline package only when R1 selects
 * the canonical ingest seam; until then the existing hand-authored
 * `validateAssetFootprint` gate stays authoritative and the P24A annex stays
 * `seed — evidence pending`.
 *
 * Pure, dependency-free minimum-area oriented bounding rectangle over
 * ground-projected (X/Z) mesh points. The caller projects mesh vertices to the
 * ground plane first (a glTF Transform pipeline step, not app runtime); this
 * module only fits the rectangle.
 *
 * Output honors the canonical `AssetFootprint` contract ("canonical
 * floor-plane bounds, relative to an asset placement pivot"): `width`/`depth`
 * are the X/Z bounds of the final canonical outline — not the rotated OBB
 * frame extents — so they stay consistent with `outline` for consumers that
 * fall back to the width/depth rect when no outline is present. The tight
 * oriented rectangle itself is the `outline` (4 corners, simple polygon,
 * non-zero area, no repeated closing point, counter-clockwise in X/Z).
 * `yawRadians` is pipeline diagnostic metadata only.
 */

export type ObbInputPoint = readonly [number, number];

export type GenerateObbFootprintResult =
  | { success: true; footprint: AssetFootprint; yawRadians: number }
  | { success: false; error: string };

const POINT_EPSILON = 1e-9;

function cross(
  origin: readonly [number, number],
  a: readonly [number, number],
  b: readonly [number, number]
): number {
  return (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0]);
}

/**
 * Reject non-finite input instead of silently repairing it — an ingest
 * pipeline validates deterministically. Returns the count of bad points.
 */
function countNonFinite(points: readonly ObbInputPoint[]): number {
  let bad = 0;
  for (const point of points) {
    if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
      bad += 1;
    }
  }
  return bad;
}

/** Sort once (O(n log n)) then single-pass dedup — never O(n^2) on mesh input. */
function deduplicate(points: readonly ObbInputPoint[]): [number, number][] {
  const sorted = points
    .map((point) => [point[0], point[1]] as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const unique: [number, number][] = [];
  for (const point of sorted) {
    const last = unique[unique.length - 1];
    if (
      last === undefined ||
      Math.abs(point[0] - last[0]) > POINT_EPSILON ||
      Math.abs(point[1] - last[1]) > POINT_EPSILON
    ) {
      unique.push(point);
    }
  }
  return unique;
}

/** Andrew monotone chain; returns hull counter-clockwise without a repeated endpoint. */
function convexHull(points: [number, number][]): [number, number][] {
  if (points.length < 3) return [...points];
  const lower: [number, number][] = [];
  for (const point of points) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, point) <= POINT_EPSILON) {
      lower.pop();
    }
    lower.push(point);
  }
  const upper: [number, number][] = [];
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const point = points[index]!;
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
  const bad = countNonFinite(input);
  if (bad > 0) {
    return {
      success: false,
      error: `OBB footprint input contains ${bad} non-finite point(s); refusing to repair`
    };
  }
  const points = deduplicate(input);
  if (points.length < 3) {
    return { success: false, error: 'OBB footprint requires at least three distinct points' };
  }
  const hull = convexHull(points);
  if (hull.length < 3) {
    return { success: false, error: 'OBB footprint input is collinear or degenerate' };
  }

  // Exhaustive minimum-area scan over hull edges: O(h^2) in hull size, not
  // input size. Ground-projected furniture hulls are tens of points (measured:
  // ~100k-point synthetic cloud fits in well under a second; dedup dominates
  // at O(n log n)). True O(h) rotating calipers deferred until a real corpus
  // proves the edge scan is a bottleneck.
  // Smallest area wins; ties within epsilon prefer the smallest absolute yaw
  // (normalized to [-90deg, 90deg)) so axis-aligned inputs keep the tight box.
  // First candidate still wins full ties: deterministic for a sorted hull,
  // hence independent of input order.
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
  // Canonical bounds come from the final outline — never the rotated frame —
  // so width/depth stay consistent with outline for rect-fallback consumers.
  let boundMinX = Infinity;
  let boundMaxX = -Infinity;
  let boundMinZ = Infinity;
  let boundMaxZ = -Infinity;
  for (const [x, z] of corners) {
    if (x < boundMinX) boundMinX = x;
    if (x > boundMaxX) boundMaxX = x;
    if (z < boundMinZ) boundMinZ = z;
    if (z > boundMaxZ) boundMaxZ = z;
  }
  return {
    success: true,
    footprint: {
      width: boundMaxX - boundMinX,
      depth: boundMaxZ - boundMinZ,
      outline: corners
    },
    yawRadians: winner.angle
  };
}
