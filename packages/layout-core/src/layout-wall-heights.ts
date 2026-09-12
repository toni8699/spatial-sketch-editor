/**
 * `layout-wall-heights.ts` — P23.6H canonical per-Wall height semantics.
 *
 * `LayoutWall.height` is the **authoritative physical height** of that Wall,
 * measured upward from the Floor elevation:
 *
 * ```text
 * bottomY = floor.elevation
 * topY    = floor.elevation + wall.height
 * ```
 *
 * One rule set, consumed by every wall-first surface — the codec's current-format
 * branch, every authoring planner's final gate (through
 * `validateWallFirstLayoutDocument`), the Opening-fit validator and the compiler:
 *
 * ```text
 * 0 < wall.height <= floor.height
 * ```
 *
 * P23.6H is partial-height Wall semantics: `floor.height` is the Floor-level
 * vertical envelope and the **birth default** for new Walls, not a live authority
 * over already-authored Wall heights. Changing Floor height must never silently
 * rewrite an authored Wall height (a future explicit Floor-height operation is the
 * only sanctioned propagation path, and it must reject rather than clamp).
 *
 * Wall height is **not** topology: face extraction reads Junction connectivity +
 * Wall X/Z geometry + `role` only, so a height change never creates, retires,
 * splits or merges Rooms.
 */
import type { LayoutDocumentWallFirst, LayoutWall } from './layout-wall-first-types';

/**
 * Shared tolerance for Wall-height comparisons. One epsilon so the codec, the
 * Opening-set validator and the Height planner can never disagree about the
 * boundary case `wall.height === floor.height` or `opening top === wall top`.
 */
export const WALL_HEIGHT_EPSILON = 1e-9;

/**
 * Canonical birth height for a new Wall: the baseline document's own Floor
 * height. Returns `undefined` when the Floor frame itself is invalid (non-finite
 * or non-positive) so callers can reject with their own stable code instead of
 * birthing a Wall with an unusable height.
 *
 * No fixed literal default may exist anywhere on a Wall-birth path.
 */
export function canonicalWallBirthHeight(floor: { height: number }): number | undefined {
	if (!Number.isFinite(floor.height) || floor.height <= 0) return undefined;
	return floor.height;
}

/** Stable machine codes for Wall-height range violations. */
export type WallHeightIssueCode = 'wall_height_invalid' | 'wall_height_exceeds_floor';

export type WallHeightIssue = {
	wallId: string;
	/** Document path of the offending field. */
	path: string;
	code: WallHeightIssueCode;
	message: string;
};

/**
 * Validate one Wall's authoritative height against the Floor envelope.
 *
 * `path` is the caller's document path (the codec passes `$.walls[i].height`, the
 * document-level helper below derives it from document order).
 */
export function validateWallHeight(
	wall: Pick<LayoutWall, 'id' | 'height'>,
	floor: { height: number },
	path: string
): WallHeightIssue | undefined {
	if (!Number.isFinite(wall.height) || wall.height <= 0) {
		return {
			wallId: wall.id,
			path,
			code: 'wall_height_invalid',
			message: `Wall '${wall.id}' height must be finite and greater than zero`
		};
	}
	if (wall.height > floor.height + WALL_HEIGHT_EPSILON) {
		return {
			wallId: wall.id,
			path,
			code: 'wall_height_exceeds_floor',
			message: `Wall '${wall.id}' height ${wall.height} m exceeds the Floor height ${floor.height} m (P23.6H: Wall height is capped by the Floor envelope)`
		};
	}
	return undefined;
}

/**
 * Validate every Wall in document order. Deterministic: issues follow
 * `document.walls` order, one issue per Wall.
 */
export function validateWallFirstWallHeights(
	document: Pick<LayoutDocumentWallFirst, 'floor' | 'walls'>
): WallHeightIssue[] {
	const issues: WallHeightIssue[] = [];
	document.walls.forEach((wall, index) => {
		const issue = validateWallHeight(wall, document.floor, `$.walls[${index}].height`);
		if (issue) issues.push(issue);
	});
	return issues;
}
