import { describe, expect, it } from 'vitest';
import {
	createEmptyLayoutPreviewState,
	commitWallChain,
	layoutPreviewDocument,
	layoutPreviewIsDirty
} from '$lib/editor/layout/layout-preview-state.svelte';
import {
	createEmptyWallFirstLayoutDocument,
	serializeWallFirstLayoutDocument
} from '$lib/layout/layout-wall-first-codec';
import { importLayoutPreviewJson } from '$lib/editor/layout/layout-preview-state.svelte';
import type { LayoutDocumentWallFirst } from '$lib/layout/layout-wall-first-types';

function wallFirstPreviewState(): ReturnType<typeof createEmptyLayoutPreviewState> {
	const state = createEmptyLayoutPreviewState();
	const document = createEmptyWallFirstLayoutDocument();
	document.floor = { id: 'floor-1', name: 'Floor 1', elevation: 0, height: 3 };
	const imported = importLayoutPreviewJson(state, serializeWallFirstLayoutDocument(document));
	if (!imported) throw new Error('wall-first import failed');
	return state;
}

function wallFirstDocument(state: ReturnType<typeof createEmptyLayoutPreviewState>): LayoutDocumentWallFirst {
	const document = layoutPreviewDocument(state);
	if (!('formatVersion' in document)) throw new Error('expected wall-first document');
	return document;
}

describe('P23.9 commitWallChain editor path', () => {
	it('commits a closed boundary chain and births a Room through the preview state', () => {
		const state = wallFirstPreviewState();
		const result = commitWallChain(
			state,
			[[0, 0], [4, 0], [4, 3], [0, 3]],
			'boundary',
			{ close: true }
		);
		expect(result.success).toBe(true);
		if (!result.success || result.operation !== 'wall-chain-commit') return;
		expect(result.wallIds).toHaveLength(4);
		expect(result.roomIds).toHaveLength(1);

		const document = wallFirstDocument(state);
		expect(document.rooms).toHaveLength(1);
		expect(document.walls).toHaveLength(4);
		expect(layoutPreviewIsDirty(state)).toBe(true);
	});

	it('a rejected chain leaves the document unchanged', () => {
		const state = wallFirstPreviewState();
		const before = serializeWallFirstLayoutDocument(wallFirstDocument(state));
		// Collinear overlapping legs must reject atomically.
		const result = commitWallChain(state, [[0, 0], [4, 0], [2, 0]], 'boundary', { close: false });
		expect(result.success).toBe(false);
		expect(serializeWallFirstLayoutDocument(wallFirstDocument(state))).toBe(before);
		expect(layoutPreviewIsDirty(state)).toBe(false);
	});

	it('a partition chain never touches Rooms', () => {
		const state = wallFirstPreviewState();
		const enclosure = commitWallChain(state, [[0, 0], [4, 0], [4, 3], [0, 3]], 'boundary', { close: true });
		expect(enclosure.success).toBe(true);

		const partition = commitWallChain(state, [[1, 1], [2, 1]], 'partition', { close: false });
		expect(partition.success).toBe(true);
		if (!partition.success || partition.operation !== 'wall-chain-commit') return;
		expect(partition.roomIds).toHaveLength(0);
		const document = wallFirstDocument(state);
		expect(document.rooms).toHaveLength(1);
		expect(document.walls.some((wall) => wall.role === 'partition')).toBe(true);
	});

	it('an open boundary chain commits without creating a Room', () => {
		const state = wallFirstPreviewState();
		const result = commitWallChain(state, [[0, 0], [4, 0]], 'boundary', { close: false });
		expect(result.success).toBe(true);
		if (!result.success || result.operation !== 'wall-chain-commit') return;
		expect(result.roomIds).toHaveLength(0);
		expect(wallFirstDocument(state).rooms).toHaveLength(0);
	});

	it('rejects when the preview is not wall-first', () => {
		const state = createEmptyLayoutPreviewState(); // legacy empty layout
		const result = commitWallChain(state, [[0, 0], [4, 0]], 'boundary', { close: false });
		expect(result.success).toBe(false);
	});
});