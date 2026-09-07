import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LIB_DIR = fileURLToPath(new URL('../../../../src/lib', import.meta.url));

function readLibSource(relativePath: string): string {
	return fs.readFileSync(path.join(LIB_DIR, relativePath), 'utf8');
}

/** Parse a token value (`#hex` or `rgb(… / …%)`) from tokens.css. */
function readToken(source: string, name: string): string {
	const match = source.match(new RegExp(`--editor-${name}:\\s*([^;]+);`));
	expect(match, `tokens.css must define --editor-${name}`).not.toBeNull();
	return match![1]!.trim().toLowerCase();
}

function channel(value: number): number {
	const c = value / 255;
	return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb: [number, number, number]): number {
	const [r, g, b] = rgb.map(channel);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function parseColor(value: string): [number, number, number] {
	const hex = value.match(/^#([0-9a-f]{6})$/);
	if (hex) {
		const n = hex[1]!;
		return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)) as [number, number, number];
	}
	throw new Error(`unsupported pill ink (hex only in this pin): ${value}`);
}

/** Blend `rgb(r g b / a%)` text over an opaque hex background. */
function blendOver(foreground: string, backgroundHex: string): [number, number, number] {
	const match = foreground.match(
		/^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\/\s*(\d+(?:\.\d+)?)%\s*\)$/
	);
	expect(match, `expected rgb(… / …%) pill ink, got: ${foreground}`).not.toBeNull();
	const alpha = Number(match![4]) / 100;
	const bg = parseColor(backgroundHex);
	const fg = [Number(match![1]), Number(match![2]), Number(match![3])];
	return fg.map((c, i) => Math.round(c * alpha + bg[i]! * (1 - alpha))) as [number, number, number];
}

function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
	const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (l1 + 0.05) / (l2 + 0.05);
}

describe('P21.5 Slice 2.5 timing pill contrast (invariant ink)', () => {
	it('pins the nine invariant pill tokens with their calibrated values', () => {
		const tokens = readLibSource('editor/styles/tokens.css');
		for (const [name, value] of [
			['plan-edge-pill-selected-bg', '#0c2d6b'],
			['plan-edge-pill-selected-border', '#2f8cff'],
			['plan-edge-pill-selected-text', '#ffffff'],
			['plan-edge-pill-selected-auto-text', 'rgb(255 255 255 / 78%)'],
			['plan-edge-pill-selected-auto-underline', 'rgb(255 255 255 / 60%)'],
			['plan-edge-pill-unselected-bg', '#ffffff'],
			['plan-edge-pill-unselected-border', '#cbd5e1'],
			['plan-edge-pill-unselected-text', '#1e293b'],
			['plan-edge-pill-auto-underline', '#64748b']
		] as const) {
			expect(readToken(tokens, name), `--editor-${name}`).toBe(value);
		}
	});

	it('keeps pill ink out of every theme block (the canvas is paper in all themes)', () => {
		const tokens = readLibSource('editor/styles/tokens.css');
		for (const id of [
			'salon-espresso',
			'electric-plum',
			'acid-moss',
			'porcelain-atelier',
			'synth-sunset',
			'velvet-kodachrome'
		]) {
			const start = tokens.indexOf(`:root[data-theme='${id}']`);
			expect(start, `missing theme block ${id}`).toBeGreaterThanOrEqual(0);
			const next = tokens.indexOf(":root[data-theme='", start + 1);
			const end = tokens.indexOf('.project-editor', start);
			const block = tokens.slice(start, next === -1 ? end : Math.min(next, end));
			expect(block, `${id} must not re-author pill ink`).not.toContain('plan-edge-pill');
		}
	});

	it('renders the pill from invariant ink — never the theme-contaminated chrome accent', () => {
		const plan = readLibSource('editor/layout/PlanSvg.svelte');
		expect(plan).toContain('fill: var(--editor-plan-edge-pill-unselected-bg);');
		expect(plan).toContain('fill: var(--editor-plan-edge-pill-selected-bg);');
		expect(plan).toContain('stroke: var(--editor-plan-edge-pill-selected-border);');
		expect(plan).not.toContain('.pill-badge.selected rect { fill: var(--editor-accent)');
		// Dotted auto channel keeps its clearance (no glyph collision).
		expect(plan).toContain('text-underline-offset: 3px;');
		expect(plan).toContain('text-decoration-thickness: 1.5px;');
	});

	it('clears WCAG AA (4.5:1) on every pill text pair', () => {
		const tokens = readLibSource('editor/styles/tokens.css');
		const pairs: Array<[string, string, string]> = [
			// [text token, background token, label]
			['plan-edge-pill-selected-text', 'plan-edge-pill-selected-bg', 'selected'],
			['plan-edge-pill-unselected-text', 'plan-edge-pill-unselected-bg', 'unselected']
		];
		for (const [textName, bgName, label] of pairs) {
			const ratio = contrastRatio(
				parseColor(readToken(tokens, textName)),
				parseColor(readToken(tokens, bgName))
			);
			expect(ratio, `${label} pill text contrast`).toBeGreaterThanOrEqual(4.5);
		}
		// Selected auto segments are translucent white over sapphire.
		const blended = blendOver(
			readToken(tokens, 'plan-edge-pill-selected-auto-text'),
			readToken(tokens, 'plan-edge-pill-selected-bg')
		);
		expect(
			contrastRatio(blended, parseColor(readToken(tokens, 'plan-edge-pill-selected-bg'))),
			'selected auto-segment contrast'
		).toBeGreaterThanOrEqual(4.5);
	});
});
