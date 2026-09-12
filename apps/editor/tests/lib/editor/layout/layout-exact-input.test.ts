import { describe, expect, it } from 'vitest';

import {
	formatDegrees,
	formatMeters,
	parseExactNumber
} from '$lib/editor/layout/layout-exact-input';

describe('parseExactNumber — blank is invalid, never zero', () => {
	it('rejects blank and whitespace-only input with the formatted fallback', () => {
		for (const raw of ['', '   ', '\t\n ']) {
			const parsed = parseExactNumber(raw, 1.5, formatMeters);
			expect(parsed.ok).toBe(false);
			if (!parsed.ok) {
				expect(parsed.reason).toBe('blank');
				expect(parsed.display).toBe('1.50');
			}
		}
		// Zero stays committable: blank must never masquerade as it.
		expect(parseExactNumber('0', 1.5, formatMeters)).toEqual({ ok: true, value: 0 });
	});

	it('rejects non-finite input with the formatted fallback', () => {
		for (const raw of ['abc', '1.2.3', 'Infinity', 'NaN']) {
			const parsed = parseExactNumber(raw, 121.55, formatDegrees);
			expect(parsed.ok).toBe(false);
			if (!parsed.ok) {
				expect(parsed.reason).toBe('non-finite');
				expect(parsed.display).toBe('121.5');
			}
		}
	});

	it('parses the full typed value without rounding', () => {
		expect(parseExactNumber('2.9999999999999999', 4, formatMeters)).toEqual({
			ok: true,
			value: 2.9999999999999999
		});
		expect(parseExactNumber(' 0.2 ', 1, formatMeters)).toEqual({ ok: true, value: 0.2 });
		expect(parseExactNumber('-3.5', 1, formatMeters)).toEqual({ ok: true, value: -3.5 });
	});

	it('bounds presentation formatting', () => {
		expect(formatMeters(3)).toBe('3.00');
		expect(formatMeters(0.2)).toBe('0.20');
		expect(formatMeters(2.9999999999999999)).toBe('3.00');
		expect(formatDegrees(121.57596224827532)).toBe('121.6');
	});
});
