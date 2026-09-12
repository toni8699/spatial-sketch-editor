import type { LayoutRoom, LayoutVec2 } from '$lib/layout/layout-types';
import type { LayoutPreviewModel } from './layout-mesh-factory';
import {
	primitiveDraftFootprint,
	rectanglePoints,
	wallChainRoleForTool,
	type LayoutInteractionState,
	type LayoutSelection
} from './layout-interaction';
import { worldToPlanScreen, type PlanViewportState } from './layout-plan-transform';
import { geometryId } from '$lib/layout/layout-geometry-types';
import { layoutArchitecturalPreset } from '$lib/layout/layout-wall-first-precision';
import { isLayoutPresetTool, type LayoutPresetTool } from './layout-interaction';
import type { LayoutArchitecturalPresetId, SnapResolution } from '@portfolio/layout-core';
import type {
	PlanHitIdentity,
	PlanInteractionProjection,
	PlanRenderPrimitive,
	PlanSelection,
	PlanStyleToken
} from '$lib/layout/plan-render-model';

/**
 * Transient interaction overlays, derived editor-side into world-space
 * `PlanRenderPrimitive` records. Screen-constant sizing/offsets are carried as
 * px hints (`radiusPx`/`offsetPx`) for the SVG adapter to apply after the view
 * transform. No Svelte/DOM imports; the viewport forwards interaction state
 * into this projection instead of computing overlay screen coordinates.
 */

const SNAP_MARKER_RADIUS_PX = 4;
const ROTATION_HANDLE_OFFSET_PX = 28;
const ROTATION_FEEDBACK_OFFSET_PX = 40;
const DIMENSION_LABEL_OFFSET_PX = 5;

function roomVertices(room: LayoutRoom): LayoutVec2[] {
	return room.boundary.segments.map((segment) => [...segment.start] as LayoutVec2);
}

function selectedPoints(interaction: LayoutInteractionState, selectedRoom: LayoutRoom | undefined): LayoutVec2[] {
	if (!selectedRoom) return [];
	if (interaction.editing?.roomId === selectedRoom.id) return interaction.editing.currentPoints;
	return roomVertices(selectedRoom);
}

/** World top-center of a room's plan bounds (min-Z edge midpoint = screen top). */
function roomTopCenter(model: LayoutPreviewModel, roomId: string): LayoutVec2 | null {
	const room = model.rooms.find((candidate) => candidate.roomId === roomId);
	if (!room) return null;
	const xs = room.floorPolygon.map(([x]) => x);
	const zs = room.floorPolygon.map(([, z]) => z);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minZ = Math.min(...zs);
	return [(minX + maxX) / 2, minZ];
}

function rotationFeedbackText(interaction: LayoutInteractionState): string | null {
	const drag = interaction.roomUnitDrag;
	if (!drag || drag.mode !== 'rotate') return null;
	const degrees = Math.round((drag.yaw * 180) / Math.PI);
	return `${degrees >= 0 ? '+' : ''}${degrees}°`;
}

/** Editor selection → renderer-neutral selection identity for the model. */
function toPlanSelection(selection: LayoutSelection): PlanSelection {
	switch (selection.kind) {
		case 'none':
			return { kind: 'none' };
		case 'room':
			return { kind: 'room', roomId: selection.roomId };
		case 'wall':
			return { kind: 'wall', roomId: selection.roomId, segmentId: selection.segmentId };
		case 'opening':
			return { kind: 'opening', roomId: selection.roomId, segmentId: selection.segmentId, openingId: selection.openingId };
		case 'interiorAnchor':
			return { kind: 'interiorAnchor', roomId: selection.roomId, segmentId: selection.segmentId, anchorId: selection.anchorId };
		case 'object':
			return { kind: 'object', objectId: selection.objectId };
		case 'wallOpening':
			return { kind: 'wallOpening', wallId: selection.wallId, openingId: selection.openingId };
		case 'physicalWall':
			return { kind: 'physicalWall', wallId: selection.wallId };
	}
}

/** Canonical Wall centerline endpoints from the compiled wall spans. */
export function physicalWallSpan(
	model: LayoutPreviewModel,
	wallId: string
): { start: LayoutVec2; end: LayoutVec2 } | null {
	const spans = model.queries.spans
		.filter(
			(span) =>
				span.roomId === undefined &&
				span.kind === 'wall' &&
				(span.wallKey ?? span.segmentId) === wallId
		)
		.sort((a, b) => a.startDistance - b.startDistance);
	const first = spans[0];
	const last = spans.at(-1);
	return first && last ? { start: [...first.start] as LayoutVec2, end: [...last.end] as LayoutVec2 } : null;
}

/** World point at a meter offset along a canonical Wall span (unclamped). */
export function pointAtWallOffset(
	span: { start: LayoutVec2; end: LayoutVec2 },
	offset: number
): LayoutVec2 {
	const dx = span.end[0] - span.start[0];
	const dz = span.end[1] - span.start[1];
	const length = Math.hypot(dx, dz);
	if (length <= 0) return [...span.start] as LayoutVec2;
	const t = offset / length;
	return [span.start[0] + dx * t, span.start[1] + dz * t];
}

/**
 * P23.3 — the two jamb points of one canonical Opening, from the compiled
 * query spans. ONE source for both the rendered width handles and the
 * viewport's screen-space handle hit test.
 */
export function wallOpeningEdgeWorldPoints(
	model: LayoutPreviewModel,
	openingId: string
): { start: LayoutVec2; end: LayoutVec2 } | null {
	const span = model.queries.spans.find(
		(candidate) => candidate.kind === 'opening' && candidate.openingId === openingId
	);
	return span ? { start: [...span.start] as LayoutVec2, end: [...span.end] as LayoutVec2 } : null;
}

/** Rendered canonical Opening affordances for one selected Opening. */
function pushWallOpeningAffordances(
	selection: { openingId: string },
	model: LayoutPreviewModel,
	handles: PlanRenderPrimitive[],
	labels: PlanRenderPrimitive[]
): void {
	const edges = wallOpeningEdgeWorldPoints(model, selection.openingId);
	if (!edges) return;
	handles.push(
		{
			kind: 'circle',
			key: geometryId(['plan', 'overlay', 'opening-handle', selection.openingId, 'start']),
			center: edges.start,
			radiusPx: 6,
			style: 'opening-handle'
		},
		{
			kind: 'circle',
			key: geometryId(['plan', 'overlay', 'opening-handle', selection.openingId, 'end']),
			center: edges.end,
			radiusPx: 6,
			style: 'opening-handle'
		}
	);
	labels.push({
		kind: 'text',
		key: geometryId(['plan', 'overlay', 'opening-handle-label', selection.openingId]),
		anchor: [(edges.start[0] + edges.end[0]) / 2, (edges.start[1] + edges.end[1]) / 2],
		text: `${Math.hypot(edges.end[0] - edges.start[0], edges.end[1] - edges.start[1]).toFixed(2)} m`,
		offsetPx: [0, -DIMENSION_LABEL_OFFSET_PX],
		style: 'dimension-label'
	});
}

/**
 * P23.3 — transient drag preview for one canonical Opening gesture. The
 * candidate renders valid or invalid exactly as the drag state reports it: a
 * raw candidate outside fit bounds previews invalid and commits nothing.
 */
function pushWallOpeningDragPreview(
	drag: LayoutInteractionState['wallOpeningDrag'],
	model: LayoutPreviewModel,
	drafts: PlanRenderPrimitive[],
	labels: PlanRenderPrimitive[]
): void {
	if (!drag) return;
	const span = physicalWallSpan(model, drag.wallId);
	if (!span) return;
	const width = Math.max(0, drag.candidateWidth);
	drafts.push({
		kind: 'polyline',
		key: geometryId(['plan', 'overlay', 'opening-drag-preview']),
		points: [pointAtWallOffset(span, drag.candidateOffset), pointAtWallOffset(span, drag.candidateOffset + width)],
		style: drag.valid ? 'opening-drag-preview' : 'opening-drag-preview-invalid'
	});
	labels.push({
		kind: 'text',
		key: geometryId(['plan', 'overlay', 'opening-drag-label']),
		anchor: pointAtWallOffset(span, drag.candidateOffset + width / 2),
		text: `${drag.candidateOffset.toFixed(2)} m`,
		offsetPx: [0, -DIMENSION_LABEL_OFFSET_PX],
		style: 'dimension-label'
	});
}

/** Screen position of the rotation handle (top-center + 28px vertical offset). */
export function rotationHandleScreenPoint(
	planView: PlanViewportState,
	projection: PlanInteractionProjection
): LayoutVec2 | null {
	const handle = projection.selection.find(
		(primitive) => primitive.kind === 'circle' && primitive.style === 'rotation-handle'
	);
	if (!handle || handle.kind !== 'circle') return null;
	const base = worldToPlanScreen(planView, handle.center);
	return [base[0] + (handle.offsetPx?.[0] ?? 0), base[1] + (handle.offsetPx?.[1] ?? 0)];
}

/** Convert a world-space pivot/handle pair for a component-owned SVG overlay. */
export function planHandleScreenPoints(
	planView: PlanViewportState,
	pivot: LayoutVec2,
	handle: LayoutVec2
): { pivot: LayoutVec2; handle: LayoutVec2 } {
	return {
		pivot: worldToPlanScreen(planView, pivot),
		handle: worldToPlanScreen(planView, handle)
	};
}

/** Add the P2 Scene placement rotation arm without moving SVG rendering into the viewport. */
export function withPlanSceneRotationHandle(
	projection: PlanInteractionProjection,
	overlay: { entityId: string; pivot: LayoutVec2; handle: LayoutVec2 } | null,
	/** P3.3 — live degree readout while a rotate gesture is in progress. */
	feedback: string | null = null
): PlanInteractionProjection {
	if (!overlay) return projection;
	return {
		...projection,
		selection: [
			...projection.selection,
			{
				kind: 'polyline',
				key: geometryId(['plan', 'scene-overlay', 'rotation-arm', overlay.entityId]),
				points: [overlay.pivot, overlay.handle],
				style: 'rotation-arm'
			},
			{
				kind: 'circle',
				key: geometryId(['plan', 'scene-overlay', 'rotation-handle', overlay.entityId]),
				center: overlay.handle,
				radiusPx: 7,
				style: 'rotation-handle'
			},
			// Same live degree label the room rotation already shows (P3.3:
			// one rotation language for every owner).
			...(feedback
				? [{
						kind: 'text',
						key: geometryId(['plan', 'scene-overlay', 'rotation-feedback', overlay.entityId]),
						anchor: overlay.handle,
						text: feedback,
						offsetPx: [0, -ROTATION_FEEDBACK_OFFSET_PX],
						style: 'rotation-feedback'
					} satisfies PlanRenderPrimitive]
				: [])
		]
	};
}

/**
 * Add the P10 Plan layout-object yaw rotation arm (same handle contract as the
 * Scene staging handle; the layout-object handle orbits its own world pivot).
 */
export function withPlanObjectRotationHandle(
	projection: PlanInteractionProjection,
	overlay: { objectId: string; pivot: LayoutVec2; handle: LayoutVec2 } | null,
	/** P3.3 — live degree readout while a rotate gesture is in progress. */
	feedback: string | null = null
): PlanInteractionProjection {
	if (!overlay) return projection;
	return {
		...projection,
		selection: [
			...projection.selection,
			{
				kind: 'polyline',
				key: geometryId(['plan', 'object-overlay', 'rotation-arm', overlay.objectId]),
				points: [overlay.pivot, overlay.handle],
				style: 'rotation-arm'
			},
			{
				kind: 'circle',
				key: geometryId(['plan', 'object-overlay', 'rotation-handle', overlay.objectId]),
				center: overlay.handle,
				radiusPx: 7,
				style: 'rotation-handle'
			},
			...(feedback
				? [{
						kind: 'text',
						key: geometryId(['plan', 'object-overlay', 'rotation-feedback', overlay.objectId]),
						anchor: overlay.handle,
						text: feedback,
						offsetPx: [0, -ROTATION_FEEDBACK_OFFSET_PX],
						style: 'rotation-feedback'
					} satisfies PlanRenderPrimitive]
				: [])
		]
	};
}

/**
 * P23.2 — transient snap feedback as render primitives. Session state only:
 * the resolution is recomputed per pointer event and never mutates the
 * document or history. Guides render as thin dashed screen-space lines; the
 * marker shows the resolved point, muted for the grid fallback so semantic
 * candidates are visually distinct.
 */
export function withLayoutSnapFeedback(
	projection: PlanInteractionProjection,
	resolution: SnapResolution | null
): PlanInteractionProjection {
	if (!resolution || resolution.kind !== 'snap') return projection;
	const { candidate, guides } = resolution;
	const primitives: PlanRenderPrimitive[] = guides.map((guide, index) => ({
		kind: 'polyline',
		key: geometryId(['plan', 'snap-feedback', 'guide', candidate.sourceId, String(index)]),
		points: [guide.start, guide.end],
		style: 'snap-guide'
	}));
	primitives.push({
		kind: 'circle',
		key: geometryId(['plan', 'snap-feedback', 'marker', candidate.sourceId]),
		center: candidate.point,
		radiusPx: SNAP_MARKER_RADIUS_PX,
		style: candidate.kind === 'grid' ? 'snap-marker-grid' : 'snap-marker'
	});
	return { ...projection, drafts: [...projection.drafts, ...primitives] };
}

/** Shared `+NN°` gesture feedback formatting (matches the room label). */
export function yawFeedbackText(yaw: number): string {
	const degrees = Math.round((yaw * 180) / Math.PI);
	return `${degrees >= 0 ? '+' : ''}${degrees}°`;
}

/**
 * P3.3 — the hovered Arrange target's outline as a render primitive, so the
 * presentation-only hover flows through the same projection → PlanSvg path
 * as every other plan visual (the viewport owns no world→screen transform).
 */
export function withArrangeHoverOutline(
	projection: PlanInteractionProjection,
	outline: { id: string; points: readonly LayoutVec2[] } | null
): PlanInteractionProjection {
	if (!outline) return projection;
	return {
		...projection,
		selection: [
			...projection.selection,
			{
				kind: 'polygon',
				key: geometryId(['plan', 'arrange-hover', outline.id]),
				points: [...outline.points],
				style: 'arrange-hover'
			}
		]
	};
}

function draftPolyline(interaction: LayoutInteractionState): LayoutVec2[] | null {
	if (interaction.tool === 'rectangle') return rectanglePoints(interaction);
	if (wallChainRoleForTool(interaction.tool) !== null) {
		if (!interaction.wallChainStart) return null;
		// P23.9 segment-first — only the currently previewed next segment is
		// transient: committed Walls live in the document, never here.
		return interaction.wallChainCursor
			? [interaction.wallChainStart, interaction.wallChainCursor]
			: [interaction.wallChainStart];
	}
	return interaction.polygonPoints.length > 0 ? interaction.polygonPoints : null;
}

/** P23.9 — the active sketch's role, for explicit Wall vs Partition feedback. */
function draftStyle(interaction: LayoutInteractionState): PlanStyleToken {
	return wallChainRoleForTool(interaction.tool) === 'partition' ? 'draft-outline-partition' : 'draft-outline';
}

function ghostStyle(interaction: LayoutInteractionState): PlanStyleToken {
	const draft = interaction.primitiveDraft;
	if (!draft) return 'primitive-ghost';
	if (!draft.valid) return 'primitive-ghost-invalid';
	if (draft.kind === 'sphere') return 'primitive-ghost-sphere';
	if (draft.kind === 'cylinder') return 'primitive-ghost-circle';
	return 'primitive-ghost';
}

/** P23.5 — the preset ID a preset tool authors (`preset-column` → `column`). */
export function presetIdForTool(tool: LayoutPresetTool): LayoutArchitecturalPresetId {
	return tool.replace(/^preset-/, '') as LayoutArchitecturalPresetId;
}

/**
 * P23.5 — one-click preset footprint preview (presentation only). Resolves
 * the tool's preset dimensions; `null` when no candidate is live or the
 * preset table is missing the tool (which would be a wiring bug).
 */
function presetGhostPoints(interaction: LayoutInteractionState): LayoutVec2[] | null {
	const draft = interaction.presetDraft;
	if (!draft) return null;
	if (!isLayoutPresetTool(draft.tool)) return null;
	const preset = layoutArchitecturalPreset(presetIdForTool(draft.tool));
	if (!preset || !draft.valid) return null;
	const [width, , depth] = preset.dimensions;
	const [x, z] = draft.point;
	const halfWidth = width / 2;
	const halfDepth = depth / 2;
	if (preset.kind === 'cylinder') {
		const radius = Math.max(halfWidth, halfDepth);
		return Array.from({ length: 32 }, (_, index) => {
			const angle = (index / 32) * Math.PI * 2;
			return [x + Math.cos(angle) * radius, z + Math.sin(angle) * radius] as LayoutVec2;
		});
	}
	return [
		[x - halfWidth, z - halfDepth],
		[x + halfWidth, z - halfDepth],
		[x + halfWidth, z + halfDepth],
		[x - halfWidth, z + halfDepth]
	];
}

export function buildPlanInteractionProjection(
	interaction: LayoutInteractionState,
	rooms: readonly LayoutRoom[],
	model: LayoutPreviewModel
): PlanInteractionProjection {
	const selection: PlanRenderPrimitive[] = [];
	const handles: PlanRenderPrimitive[] = [];
	const drafts: PlanRenderPrimitive[] = [];
	const labels: PlanRenderPrimitive[] = [];

	const activeSelection = interaction.selection;
	const selectedRoom =
		interaction.tool === 'select' && activeSelection.kind === 'room'
			? rooms.find((room) => room.id === activeSelection.roomId)
			: undefined;
	const points = selectedPoints(interaction, selectedRoom);

	if (selectedRoom && points.length > 0) {
		selection.push({
			kind: 'polygon',
			key: geometryId(['plan', 'overlay', 'selection-bounds', selectedRoom.id]),
			points: points.map(([x, z]) => [x, z] as LayoutVec2),
			style: 'selection-bounds'
		});
		const topCenter = roomTopCenter(model, selectedRoom.id);
		if (topCenter) {
			selection.push({
				kind: 'polyline',
				key: geometryId(['plan', 'overlay', 'rotation-arm', selectedRoom.id]),
				points: [topCenter, topCenter],
				endOffsetPx: [0, -ROTATION_HANDLE_OFFSET_PX],
				style: 'rotation-arm'
			});
			selection.push({
				kind: 'circle',
				key: geometryId(['plan', 'overlay', 'rotation-handle', selectedRoom.id]),
				center: topCenter,
				radiusPx: 7,
				offsetPx: [0, -ROTATION_HANDLE_OFFSET_PX],
				style: 'rotation-handle',
				hit: { kind: 'room', roomId: selectedRoom.id }
			});
			const feedback = rotationFeedbackText(interaction);
			if (feedback) {
				selection.push({
					kind: 'text',
					key: geometryId(['plan', 'overlay', 'rotation-feedback', selectedRoom.id]),
					anchor: topCenter,
					text: feedback,
					offsetPx: [0, -ROTATION_FEEDBACK_OFFSET_PX],
					style: 'rotation-feedback'
				});
			}
		}
		for (const [index, point] of points.entries()) {
			handles.push({
				kind: 'circle',
				key: geometryId(['plan', 'overlay', 'vertex-handle', selectedRoom.id, String(index)]),
				center: point,
				radiusPx: 6,
				style: 'vertex-handle',
				hit: { kind: 'vertex', roomId: selectedRoom.id, vertexIndex: index } satisfies PlanHitIdentity
			});
		}
		for (let edgeIndex = 0; edgeIndex < points.length; edgeIndex += 1) {
			const start = points[edgeIndex]!;
			const end = points[(edgeIndex + 1) % points.length]!;
			const edgeLength = model.rooms.find((room) => room.roomId === selectedRoom.id)?.walls[edgeIndex]?.length;
			const text = edgeLength === undefined
				? Math.hypot(end[0] - start[0], end[1] - start[1]).toFixed(2)
				: edgeLength.toFixed(2);
			labels.push({
				kind: 'text',
				key: geometryId(['plan', 'overlay', 'dimension-label', selectedRoom.id, String(edgeIndex)]),
				anchor: [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2],
				text: `${text} m`,
				offsetPx: [0, -DIMENSION_LABEL_OFFSET_PX],
				style: 'dimension-label'
			});
		}
	}

	for (const record of model.queries.points) {
		if (record.kind !== 'interior-anchor') continue;
		if (record.roomId === undefined) continue;
		handles.push({
			kind: 'circle',
			key: geometryId(['plan', 'overlay', 'interior-anchor', record.roomId, record.segmentId, record.sourceId]),
			center: record.point,
			radiusPx: 5,
			style: activeSelection.kind === 'interiorAnchor' &&
				activeSelection.roomId === record.roomId &&
				activeSelection.segmentId === record.segmentId &&
				activeSelection.anchorId === record.sourceId
				? 'interior-anchor-selected'
				: 'interior-anchor',
			hit: { kind: 'interiorAnchor', roomId: record.roomId, segmentId: record.segmentId, anchorId: record.sourceId } satisfies PlanHitIdentity
		});
	}

	if (interaction.primitiveDraft) {
		drafts.push({
			kind: 'polygon',
			key: geometryId(['plan', 'overlay', 'primitive-ghost']),
			points: primitiveDraftFootprint(interaction.primitiveDraft),
			style: ghostStyle(interaction)
		});
	}

	// P23.5 — the preset candidate previews the same ghost language as a
	// primitive draft (footprint of the object the preset will create).
	const presetGhost = presetGhostPoints(interaction);
	if (presetGhost) {
		drafts.push({
			kind: 'polygon',
			key: geometryId(['plan', 'overlay', 'preset-ghost']),
			points: presetGhost,
			style: 'primitive-ghost'
		});
	}

	const draft = draftPolyline(interaction);
	if (draft) {
		drafts.push({
			kind: 'polyline',
			key: geometryId(['plan', 'overlay', 'draft-outline']),
			points: draft,
			style: draftStyle(interaction)
		});
		for (const [index, point] of draft.entries()) {
			drafts.push({
				kind: 'circle',
				key: geometryId(['plan', 'overlay', 'draft-point', String(index)]),
				center: point,
				radiusPx: 5,
				style: 'draft-point'
			});
		}
	}

	// P23.3 — canonical Opening affordances + transient drag preview. Both are
	// session-only projections: no document write ever happens during a drag.
	if (activeSelection.kind === 'wallOpening') {
		pushWallOpeningAffordances(activeSelection, model, handles, labels);
	}
	pushWallOpeningDragPreview(interaction.wallOpeningDrag, model, drafts, labels);

	const roomOverrides = interaction.editing
		? [{ roomId: interaction.editing.roomId, points: interaction.editing.currentPoints }]
		: [];

	const objectOverrides = interaction.objectDrag
		? model.objects
				.filter((object) => object.objectId === interaction.objectDrag!.objectId)
				.map((object) => {
					const drag = interaction.objectDrag!;
					const dx = drag.candidatePosition[0] - drag.originalPosition[0];
					const dz = drag.candidatePosition[2] - drag.originalPosition[2];
					const yawDelta = drag.candidateRotation[1] - drag.originalRotation[1];
					if (Math.abs(yawDelta) <= 1e-9) {
						return {
							objectId: object.objectId,
							points: object.planFootprint.map(([x, z]) => [x + dx, z + dz] as LayoutVec2)
						};
					}
					// Rotate around the object's world pivot using the shared positive-Y
					// Plan convention, then apply the translate delta.
					const cos = Math.cos(yawDelta);
					const sin = Math.sin(yawDelta);
					const pivot: LayoutVec2 = [object.position[0], object.position[2]];
					return {
						objectId: object.objectId,
						points: object.planFootprint.map(([x, z]) => {
							const lx = x - pivot[0];
							const lz = z - pivot[1];
							return [pivot[0] + cos * lx + sin * lz + dx, pivot[1] - sin * lx + cos * lz + dz] as LayoutVec2;
						})
					};
				})
		: [];

	return { selected: toPlanSelection(interaction.selection), selection, handles, drafts, labels, roomOverrides, objectOverrides };
}
