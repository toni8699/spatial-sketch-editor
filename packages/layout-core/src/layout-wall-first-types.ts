/**
 * `layout-wall-first-types.ts` — P23.0a wall-first Layout schema types.
 *
 * These types are the wall-first `LayoutDocument` shape ratified by
 * the P23 umbrella ([P23 umbrella §F0.1](../../../../docs/plans/2026-09-07-P23-layout-depth-minimum-build.md))
 * and the P23.0 child plan. The Foundation Gate is closed; these records are
 * now consumed by the wall-first Save and P23.1 precise semantic operations.
 * Legacy Room-owned records remain available through the compatibility path.
 *
 * Identity rules (P23 umbrella F0.1, P23.0 "Identity rules"):
 * - Junction IDs are the only normal-authoring connectivity authority.
 * - Wall IDs are document-global and survive deformation; canonical Wall
 *   orientation (start → end) is stable and identity-bearing because opening
 *   offsets are measured from start.
 * - Opening IDs are document-global in the new schema.
 * - Room IDs remain product identities, never face-extractor IDs.
 * - IDs never derive from coordinates, traversal order, timestamps or random
 *   allocation (allocation happens in P23.8/P23.0b authoring operations, not
 *   in this codec).
 */
import type { LayoutObject, LayoutVec2 } from './layout-types';

/**
 * Explicit wall-first format discriminator value.
 *
 * Historical usage recheck (P23.0 requires this before freezing): the active
 * legacy Layout JSON carries no `formatVersion` key (the legacy codec rejects
 * it as `unknown_key`), so a missing version can only mean the Room-owned
 * legacy shape. Archived Museum terminology called the immediately preceding
 * Layout model "v3"; the least surprising wall-first number is therefore `4`
 * (H5 §10.1). Any other explicit value is rejected as unrecognized — a real
 * decoder must exist before a number becomes loadable.
 */
export const LAYOUT_WALL_FIRST_FORMAT_VERSION = 4 as const;

/** All explicit `formatVersion` values the compatible decoder recognizes. */
export const KNOWN_LAYOUT_FORMAT_VERSIONS = [LAYOUT_WALL_FIRST_FORMAT_VERSION] as const;

export type LayoutFormatVersion = (typeof KNOWN_LAYOUT_FORMAT_VERSIONS)[number];

/** Semantic Wall role: only `boundary` Walls participate in Room face extraction. */
export type LayoutWallRole = 'boundary' | 'partition';

/** First-class connectivity point. Junction ID equality *is* connectivity. */
export type LayoutJunction = {
  id: string;
  point: LayoutVec2;
};

/**
 * One physical Wall between two explicit Junctions. A Wall exists once even
 * when it bounds two Rooms; no Wall stores or infers Room ownership.
 *
 * `height` is the birth default (floor height) carried as data. Authored
 * height editing is deferred: the canonical compiler, bounds, mesh, and
 * opening-fit validation all derive vertical geometry from the floor, so an
 * editor for this field would violate authored-state → compiler → render
 * until partial-height Wall semantics are designed (post-P23.6).
 */
export type LayoutWall = {
  id: string;
  startJunctionId: string;
  endJunctionId: string;
  role: LayoutWallRole;
  thickness: number;
  height: number;
};

/** Directed Wall reference used by persistent Room boundaries. */
export type OrientedWallRef = {
  wallId: string;
  direction: 'forward' | 'reverse';
};

/**
 * Wall-hosted opening. `offset` is physical meters from the canonical Wall
 * start (H1 meter-offset semantics, never normalized coordinates).
 *
 * `connectsRoomIds` stays an optional explicit semantic inter-Room relation on
 * doors (legacy meaning preserved on read); the stricter P23.8 new-schema
 * adjacency contract arrives with the topology child plan, not here.
 */
export type LayoutWallOpening = {
  id: string;
  wallId: string;
  kind: 'door' | 'window';
  offset: number;
  width: number;
  height: number;
  sillHeight: number;
  profile: 'rectangular' | 'rounded' | 'pointed';
  connectsRoomIds?: [string, string];
};

/**
 * Floor descriptor (P23.0b). Floor-level Y coordinates stay floor-owned
 * exactly as in the legacy schema (H5: `LayoutFloor.elevation`/`.height` are
 * floor-level properties, not Room metadata). One floor is the P23 minimum
 * storey; the codec enforces the same floor-height/opening-height rules the
 * legacy geometry validation applies.
 */
export type LayoutWallFirstFloor = {
  id: string;
  name: string;
  elevation: number;
  height: number;
};

/**
 * Persistent semantic Room over a derived candidate face. `boundary` holds
 * oriented Wall references (derived/reconciled by P23.8 — this codec only
 * validates the reference structure). Surface thicknesses stay Room metadata;
 * wall thickness belongs to Walls.
 */
export type LayoutWallFirstRoom = {
  id: string;
  name: string;
  boundary: OrientedWallRef[];
  floorThickness: number;
  ceilingThickness: number;
};

/**
 * Wall-first Layout document root. `objects` keeps the existing
 * `LayoutObject[]` record type: Layout objects remain document-level and
 * project/world-local; P23.0a does not move them under Floors and does not
 * change their transform ownership.
 */
export type LayoutDocumentWallFirst = {
  units: 'meters';
  formatVersion: LayoutFormatVersion;
  /**
   * Floor-level Y frame (P23.0b). Exactly one floor for the P23 minimum;
   * multi-floor legacy payloads are compatibility-only (H5 excludes
   * multi-floor topology).
   */
  floor: LayoutWallFirstFloor;
  junctions: LayoutJunction[];
  walls: LayoutWall[];
  rooms: LayoutWallFirstRoom[];
  openings: LayoutWallOpening[];
  objects: LayoutObject[];
};
