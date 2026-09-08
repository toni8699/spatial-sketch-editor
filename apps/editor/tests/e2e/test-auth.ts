/**
 * Agent/E2E login helper for the API test-auth seam
 * (`POST {apiOrigin}/test-auth/session`).
 *
 * Runs in Node (the agent runtime), not in page context: browsers hide
 * `Set-Cookie` from client-side fetch, so this helper exchanges the bearer
 * secret for the normal `museum-editor-session` cookie and returns it as a
 * `name=value` pair. The caller installs it into the automated browser
 * (e.g. agent-browser cookie primitives) and navigates into the app — from
 * there the session is indistinguishable from an OAuth login.
 *
 * Never imported by application source: lives under `tests/` so it cannot
 * enter editor or visitor bundles. The secret always comes from the
 * caller's environment, never from source.
 */

export const TEST_AUTH_SESSION_COOKIE = 'museum-editor-session';

export type TestAuthUserKey = 'agent-admin' | 'agent-user-a' | 'agent-user-b';

export type TestAuthFetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type TestAuthErrorCode = 'configuration' | 'auth' | 'invalid' | 'network' | 'server';

export class TestAuthError extends Error {
	constructor(
		readonly code: TestAuthErrorCode,
		message: string,
		readonly status?: number
	) {
		super(message);
		this.name = 'TestAuthError';
	}
}

export type TestAuthSession = {
	/** `name=value` cookie pair, ready to install in the browser context. */
	cookie: string;
	userId: string;
};

export async function loginAs(input: {
	user: TestAuthUserKey | string;
	apiOrigin: string;
	secret: string;
	/**
	 * Value for the `Origin` header. Required when the API has an editor
	 * origin configured (always, via `EDITOR_ORIGIN`): its unsafe-method
	 * guard rejects header-less non-browser POSTs with 403. Use the same
	 * origin the automated browser will run from (e.g.
	 * `http://localhost:5173`).
	 */
	origin?: string;
	fetchImpl?: TestAuthFetchLike;
}): Promise<TestAuthSession> {
	const origin = input.apiOrigin.trim().replace(/\/+$/, '');
	if (!origin) throw new TestAuthError('configuration', 'Test-auth API origin is required');
	if (!input.secret) throw new TestAuthError('configuration', 'Test-auth secret is required');
	if (!input.user || typeof input.user !== 'string') {
		throw new TestAuthError('configuration', 'Test-auth user is required');
	}
	const fetchImpl = input.fetchImpl ?? globalThis.fetch?.bind(globalThis);
	if (!fetchImpl) throw new TestAuthError('configuration', 'Network requests are unavailable');

	let response: Response;
	try {
		response = await fetchImpl(`${origin}/test-auth/session`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				...(input.origin ? { Origin: input.origin } : {}),
				Authorization: `Bearer ${input.secret}`
			},
			body: JSON.stringify({ user: input.user })
		});
	} catch {
		throw new TestAuthError('network', 'Test-auth request failed');
	}
	if (response.status === 401) {
		throw new TestAuthError('auth', 'Test-auth secret was rejected', 401);
	}
	if (response.status === 404) {
		throw new TestAuthError(
			'configuration',
			'Test-auth seam is unavailable on this API (correct for production)',
			404
		);
	}
	if (!response.ok) {
		throw new TestAuthError('server', 'Test-auth request failed', response.status);
	}
	let body: unknown = null;
	try {
		body = await response.json();
	} catch {
		throw new TestAuthError('server', 'Test-auth response was invalid', response.status);
	}
	const userId = readSessionUserId(body);
	const cookie = readSessionCookie(response);
	if (!cookie) throw new TestAuthError('server', 'Test-auth response set no session cookie');
	return { cookie, userId };
}

function readSessionUserId(body: unknown): string {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) throw invalid();
	const record = body as Record<string, unknown>;
	if (record.authenticated !== true) throw invalid();
	if (typeof record.user !== 'object' || record.user === null || Array.isArray(record.user)) throw invalid();
	const id = (record.user as Record<string, unknown>).id;
	if (typeof id !== 'string' || id.length === 0) throw invalid();
	return id;

	function invalid(): TestAuthError {
		return new TestAuthError('server', 'Test-auth response was invalid');
	}
}

function readSessionCookie(response: Response): string | null {
	const cookies: string[] =
		typeof (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === 'function'
			? (response.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
			: (() => {
					const single = response.headers.get('set-cookie');
					return single ? [single] : [];
				})();
	for (const entry of cookies) {
		const pair = entry.split(';', 1)[0]?.trim();
		if (pair?.startsWith(`${TEST_AUTH_SESSION_COOKIE}=`) && pair.length > TEST_AUTH_SESSION_COOKIE.length + 1) {
			return pair;
		}
	}
	return null;
}
