import { describe, expect, it, vi } from 'vitest';

import { loginAs, TEST_AUTH_SESSION_COOKIE, TestAuthError } from './test-auth';

const ORIGIN = 'https://api.test';
const SECRET = 'e2e-test-secret-with-enough-length';

function jsonResponse(value: unknown, status = 201, setCookie?: string | string[]): Response {
	const headers = new Headers({ 'Content-Type': 'application/json' });
	for (const cookie of [setCookie ?? []].flat()) headers.append('set-cookie', cookie);
	return new Response(JSON.stringify(value), { status, headers });
}

const successBody = { authenticated: true, user: { id: 'google:e2e-agent-admin' } };
const sessionPair = `${TEST_AUTH_SESSION_COOKIE}=encoded-session-value`;

describe('E2E test-auth helper', () => {
	it('posts the exact seam request and returns the session cookie pair', async () => {
		const fetchImpl = vi.fn(async (input: string, init?: RequestInit) => {
			expect(input).toBe(`${ORIGIN}/test-auth/session`);
			expect(init?.method).toBe('POST');
			expect(init?.headers).toMatchObject({
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: `Bearer ${SECRET}`
			});
			expect(JSON.parse(String(init?.body))).toEqual({ user: 'agent-admin' });
			return jsonResponse(successBody, 201, `${sessionPair}; Path=/; HttpOnly; Secure; SameSite=Lax`);
		});
		await expect(loginAs({ user: 'agent-admin', apiOrigin: `${ORIGIN}/`, secret: SECRET, fetchImpl })).resolves.toEqual({
			cookie: sessionPair,
			userId: 'google:e2e-agent-admin'
		});
	});

	it('reads Node getSetCookie arrays when present', async () => {
		const response = jsonResponse(successBody, 201);
		vi.spyOn(response.headers, 'getSetCookie').mockReturnValue([
			`other=1; Path=/`,
			`${sessionPair}; Path=/; HttpOnly`
		]);
		const fetchImpl = vi.fn(async () => response);
		await expect(loginAs({ user: 'agent-user-a', apiOrigin: ORIGIN, secret: SECRET, fetchImpl })).resolves.toMatchObject({
			cookie: sessionPair
		});
	});

	it('maps rejection codes without leaking the secret', async () => {
		const cases = [
			{ status: 401, code: 'auth' },
			{ status: 404, code: 'configuration' },
			{ status: 400, code: 'server' },
			{ status: 503, code: 'server' }
		] as const;
		for (const { status, code } of cases) {
			const fetchImpl = vi.fn(async () => jsonResponse({ error: { message: 'nope' } }, status));
			const error = await loginAs({ user: 'agent-admin', apiOrigin: ORIGIN, secret: SECRET, fetchImpl }).catch(
				(error: unknown) => error
			);
			expect(error).toBeInstanceOf(TestAuthError);
			expect(error).toMatchObject({ code, status });
			expect(String((error as Error).message)).not.toContain(SECRET);
		}
		const down = vi.fn(async () => {
			throw new TypeError('fetch failed');
		});
		await expect(loginAs({ user: 'agent-admin', apiOrigin: ORIGIN, secret: SECRET, fetchImpl: down })).rejects.toMatchObject({
			code: 'network'
		});
	});

	it('fails closed on invalid sessions and missing cookies', async () => {
		const noCookie = vi.fn(async () => jsonResponse(successBody, 201));
		await expect(loginAs({ user: 'agent-admin', apiOrigin: ORIGIN, secret: SECRET, fetchImpl: noCookie })).rejects.toMatchObject({
			code: 'server'
		});

		const badBody = vi.fn(async () =>
			jsonResponse({ authenticated: false }, 201, `${sessionPair}; Path=/`)
		);
		await expect(loginAs({ user: 'agent-admin', apiOrigin: ORIGIN, secret: SECRET, fetchImpl: badBody })).rejects.toMatchObject({
			code: 'server'
		});

		await expect(loginAs({ user: 'agent-admin', apiOrigin: '  ', secret: SECRET })).rejects.toMatchObject({
			code: 'configuration'
		});
		await expect(loginAs({ user: 'agent-admin', apiOrigin: ORIGIN, secret: '' })).rejects.toMatchObject({
			code: 'configuration'
		});
	});
});
