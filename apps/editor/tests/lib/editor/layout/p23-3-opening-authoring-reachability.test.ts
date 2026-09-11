/**
 * P23.3 — the canonical wall-first Opening authoring path must stay reachable,
 * and the opening dimension inputs must stay on the HTML step grid.
 *
 * The P23.3 Plan authoring branch
 * (`LayoutPlanViewport` door/window tool → `onWallOpeningCreate` →
 * `createWallFirstOpening`) only runs once the door/window draft tool is
 * armed. Arming is gated in two components: `LayoutDraftToolbar` (toolbar
 * buttons + `chooseTool`) and `EditorInspector` (Place accordion +
 * `armLayoutPlaceTool`). P23.9 disabled both for wall-first documents
 * ("use Architecture · exact") because canonical Opening authoring did not
 * exist yet; P23.3 adds it, so those guards must not come back. A wall-first
 * layout otherwise has no reachable Opening-creation entry point at all — the
 * Inspector's "Architecture · exact" accordion lists Junctions, Walls and
 * Rooms, but no Opening creation.
 *
 * `min` anchors the `step` origin, so `min="0.01" step="0.05"` puts valid
 * values on the `0.01 + 0.05n` grid and makes every default dimension
 * (0.90 m / 2.10 m) permanently `:invalid` in the browser, independent of
 * float noise. Both the canonical and the legacy opening panel must sit on
 * the grid and format to two decimals.
 *
 * These are source contracts because the guards are component event handlers
 * with no exported predicate and the editor has no component-render harness.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const LIB_DIR = fileURLToPath(new URL('../../../../src/lib', import.meta.url));

function readLibSource(relativePath: string): string {
	return fs.readFileSync(path.join(LIB_DIR, relativePath), 'utf8');
}

/** Body of one top-level function declaration, up to the first column-1 `}`. */
function functionBody(source: string, name: string): string {
	const match = new RegExp(`function ${name}\\([\\s\\S]*?\\n\\t\\}`).exec(source);
	return match?.[0] ?? '';
}

describe('P23.3 canonical Opening authoring stays armable', () => {
	const toolbar = readLibSource('editor/layout/LayoutDraftToolbar.svelte');
	const inspector = readLibSource('editor/EditorInspector.svelte');

	it('lets the toolbar arm door/window on a wall-first document while keeping primitives unavailable', () => {
		const allowlist =
			/const WALL_FIRST_DRAFT_TOOLS[^=]*=\s*new Set<LayoutDraftTool>\(\[([\s\S]*?)\]\)/.exec(toolbar)?.[1] ??
			'';
		expect(allowlist).toContain("'select'");
		expect(allowlist).toContain("'wall-chain'");
		expect(allowlist).toContain("'partition-chain'");
		expect(allowlist).toContain("'rectangle'");
		expect(allowlist).toContain("'polygon'");
		expect(allowlist).toContain("'door'");
		expect(allowlist).toContain("'window'");
		expect(allowlist).not.toContain("'box'");
		expect(toolbar).toContain('if (wallFirstLayout && !WALL_FIRST_DRAFT_TOOLS.has(tool))');
	});

	it('does not disable the toolbar door/window buttons for wall-first layouts', () => {
		for (const tool of ['door', 'window']) {
			const attributes =
				new RegExp(`<button type="button"([^>]*)onclick=\\{\\(\\) => chooseTool\\('${tool}'\\)\\}`).exec(
					toolbar
				)?.[1] ?? '';
			expect(attributes).not.toBe('');
			expect(attributes).not.toContain('disabled=');
		}
	});

	it('arms the Inspector place tools for door/window on a wall-first document', () => {
		const armPlace = functionBody(inspector, 'armLayoutPlaceTool');
		expect(armPlace).not.toBe('');
		// The wall-first refusal is primitive-only; door/window fall through.
		expect(armPlace).toContain('primitive && isWallFirstLayout');
		expect(armPlace).toContain('primitive && layoutInteraction.viewMode');
		for (const tool of ['door', 'window']) {
			const disabled =
				new RegExp(
					`disabled=\\{([^}]*)\\} onclick=\\{\\(\\) => armLayoutPlaceTool\\('${tool}'\\)\\}`
				).exec(inspector)?.[1] ?? '';
			expect(disabled).toBe("layoutInteraction.viewMode !== 'plan'");
		}
	});
});

describe('P23.3 wall-first room drafting stays reachable', () => {
	const viewport = readLibSource('editor/layout/LayoutPlanViewport.svelte');

	it('updates the rectangle drag on wall-first documents too', () => {
		// The commit path is format-aware (canonical four-Wall chain vs the legacy
		// Room polygon), but the DRAG update must run for both: skipping it left
		// `rectanglePoints` degenerate, so a Rect Room drag drew nothing and
		// pointer-up committed nothing on a wall-first document — the default
		// document a new project now boots.
		expect(viewport).not.toMatch(
			/if \(interaction\.tool === 'rectangle'\) \{\s*if \('formatVersion' in preview\.project\.layout\) return;/
		);
		expect(viewport).toContain('updateRectangle(interaction, point)');
	});
});

/**
 * P23.3 requires `Escape / pointer-cancel → restore baseline, no history` for
 * the canonical Opening drag, plus wall/room draft Escape and Delete. Those
 * handlers live on the Plan SVG's `onkeydown`, so the keydown has to survive
 * its way to that element: the shared context-menu shell registers a
 * window-CAPTURE Escape listener for the whole session, and stopping
 * propagation there swallowed the key before any element handler (downstream
 * of window capture) could see it — every Plan shortcut looked wired in the
 * source and was dead in the app.
 */
describe('P23.3 Plan keyboard routing reaches the focused surface', () => {
	const viewport = readLibSource('editor/layout/LayoutPlanViewport.svelte');
	const menu = readLibSource('editor/context-menu/ContextMenu.svelte');

	it('never swallows Escape globally while the context menu is closed', () => {
		const keydown = functionBody(menu, 'onWindowKeydown');
		expect(keydown).not.toBe('');
		const guard = keydown.indexOf('if (!menuElement) return;');
		expect(guard).toBeGreaterThan(-1);
		// The guard must precede the actual swallow, not just appear somewhere.
		expect(guard).toBeLessThan(keydown.indexOf('event.stopPropagation();'));
	});

	it('keeps the Plan SVG the keyboard owner that claims focus on pointerdown', () => {
		expect(viewport).toMatch(/<svg[\s\S]{0,500}tabindex="0"[\s\S]{0,300}onkeydown=\{onKeyDown\}/);
		expect(viewport).toContain('svgElement?.focus();');
	});

	it('keeps Escape wired to cancel the canonical Opening drag and the wall draft', () => {
		const keyDown = functionBody(viewport, 'onKeyDown');
		expect(keyDown).toContain('if (interaction.wallOpeningDrag) {');
		expect(keyDown).toContain('clearLayoutDraft(interaction)');
	});
});

describe('P23.3 opening dimension inputs sit on the step grid', () => {
	const inspector = readLibSource('editor/EditorInspector.svelte');

	it('never anchors a 0.05 step at a 0.01 minimum', () => {
		expect(inspector).not.toContain('min="0.01" step="0.05"');
	});

	it('formats both opening panels to document meters', () => {
		for (const panel of ['selectedWallFirstOpening', 'selectedLayoutOpening']) {
			for (const field of ['offset', 'width', 'height', 'sillHeight']) {
				expect(inspector).toContain(`${panel}.${field}.toFixed(2)`);
			}
		}
	});
});
