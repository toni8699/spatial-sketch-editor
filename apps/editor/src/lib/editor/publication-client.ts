/**
 * P22.4 — owner-side publication client.
 *
 * Authenticated creator surface only: never import from visitor/public
 * modules. All requests attach secure-cookie credentials and never expose
 * tokens. Throws `PublicationClientError`; request aborts propagate as
 * `AbortError` so project-switch teardown stays distinguishable from
 * failure.
 */

export type PublicationStatus = {
	publicationId: string | null;
	activeVersion: number | null;
	revision: number;
	currentVersion: number;
	createdAt: string | null;
	updatedAt: string | null;
};

export type PublicationClientErrorCode =
	| 'configuration'
	| 'auth'
	| 'not-found'
	| 'conflict'
	| 'invalid'
	| 'network'
	| 'server';

export class PublicationClientError extends Error {
	constructor(
		readonly code: PublicationClientErrorCode,
		message: string,
		readonly status?: number,
		/** Server-reported revision on `conflict`; absent otherwise. */
		readonly revision?: number
	) {
		super(message);
		this.name = 'PublicationClientError';
	}
}

export type PublicationFetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type PublicationApi = {
	getStatus(projectId: string, signal?: AbortSignal): Promise<PublicationStatus>;
	publishVersion(
		projectId: string,
		version: number,
		expectedPublicationRevision: number,
		signal?: AbortSignal
	): Promise<PublicationStatus>;
	unpublishVersion(
		projectId: string,
		expectedPublicationRevision: number,
		signal?: AbortSignal
	): Promise<PublicationStatus>;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS_KEYS = [
	'publicationId',
	'activeVersion',
	'revision',
	'currentVersion',
	'createdAt',
	'updatedAt'
] as const;

function normalizeApiOrigin(origin: string): string {
	return origin.trim().replace(/\/+$/, '');
}

export function createPublicationApi(
	config: { apiOrigin?: string; fetch?: PublicationFetchLike },
	fetchImpl?: PublicationFetchLike
): PublicationApi | null {
	const origin = normalizeApiOrigin(config.apiOrigin ?? '');
	if (!origin) return null;
	const requestFetch = fetchImpl ?? config.fetch ?? globalThis.fetch?.bind(globalThis);
	if (!requestFetch) throw new PublicationClientError('configuration', 'Cloud requests are unavailable');

	return {
		getStatus: (projectId, signal) =>
			requestJson(requestFetch, origin, `/projects/${encodeURIComponent(projectId)}/publication`, {
				method: 'GET'
			}, signal).then(readPublicationStatus),
		publishVersion: (projectId, version, expectedPublicationRevision, signal) =>
			requestJson(
				requestFetch,
				origin,
				`/projects/${encodeURIComponent(projectId)}/publication`,
				{ method: 'PUT', body: JSON.stringify({ version, expectedPublicationRevision }) },
				signal
			).then(readPublicationStatus),
		unpublishVersion: (projectId, expectedPublicationRevision, signal) =>
			requestJson(
				requestFetch,
				origin,
				`/projects/${encodeURIComponent(projectId)}/publication`,
				{ method: 'DELETE', body: JSON.stringify({ expectedPublicationRevision }) },
				signal
			).then(readPublicationStatus)
	};
}

/**
 * Same-origin public route for a publication ID. The owner status API
 * returns the ID, never a deployment-specific absolute URL; the editor
 * derives `/p/:publicationId` on the current origin.
 */
export function derivePublicPath(publicationId: string): string {
	return `/p/${publicationId}`;
}

export function derivePublicUrl(publicationId: string, origin: string): string {
	return `${normalizeApiOrigin(origin) || origin}${derivePublicPath(publicationId)}`;
}

async function requestJson(
	fetchImpl: PublicationFetchLike,
	origin: string,
	path: string,
	init: RequestInit,
	signal?: AbortSignal
): Promise<unknown> {
	let response: Response;
	try {
		response = await fetchImpl(`${origin}${path}`, {
			...init,
			credentials: 'include',
			signal,
			headers: {
				Accept: 'application/json',
				...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
				...(init.headers ?? {})
			}
		});
	} catch (error) {
		if (isAbort(error, signal)) throw error;
		throw new PublicationClientError('network', 'Cloud request failed');
	}

	let body: unknown = null;
	if (response.status !== 204) {
		try {
			body = await response.json();
		} catch {
			// Empty error bodies are mapped by status below.
		}
	}
	if (response.ok) return body;
	throw responseError(response.status, body);
}

function responseError(status: number, body: unknown): PublicationClientError {
	if (status === 401) return new PublicationClientError('auth', 'Sign-in is required', status);
	if (status === 404) return new PublicationClientError('not-found', 'Project not found', status);
	if (status === 409) {
		const revision = readConflictRevision(body);
		return new PublicationClientError(
			'conflict',
			readErrorMessage(body) ?? `Publication changed (revision ${revision}); refetch status and retry`,
			status,
			revision
		);
	}
	if (status >= 500) return new PublicationClientError('server', 'Cloud service is unavailable', status);
	return new PublicationClientError('invalid', readErrorMessage(body) ?? 'Cloud request was rejected', status);
}

function readPublicationStatus(value: unknown): PublicationStatus {
	if (!isRecord(value)) throw invalidResponse();
	for (const key of STATUS_KEYS) {
		if (!Object.prototype.hasOwnProperty.call(value, key)) throw invalidResponse();
	}
	if (Object.keys(value).length !== STATUS_KEYS.length) throw invalidResponse();
	const publicationId = readNullablePublicationId(value.publicationId);
	const activeVersion = readNullableVersion(value.activeVersion);
	return {
		publicationId,
		activeVersion,
		revision: readRevision(value.revision),
		currentVersion: readCount(value.currentVersion),
		createdAt: readNullableTimestamp(value.createdAt),
		updatedAt: readNullableTimestamp(value.updatedAt)
	};
}

function readConflictRevision(body: unknown): number {
	if (isRecord(body) && Number.isSafeInteger(body.revision) && (body.revision as number) >= 0) {
		return body.revision as number;
	}
	throw invalidResponse();
}

function readNullablePublicationId(value: unknown): string | null {
	if (value === null) return null;
	if (typeof value === 'string' && UUID_PATTERN.test(value)) return value;
	throw invalidResponse();
}

function readNullableVersion(value: unknown): number | null {
	if (value === null) return null;
	if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 1) return value;
	throw invalidResponse();
}

function readRevision(value: unknown): number {
	const result = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
	if (!Number.isSafeInteger(result) || result < 0) throw invalidResponse();
	return result;
}

function readCount(value: unknown): number {
	return readRevision(value);
}

function readNullableTimestamp(value: unknown): string | null {
	if (value === null) return null;
	if (typeof value !== 'string') throw invalidResponse();
	const time = Date.parse(value);
	if (Number.isNaN(time)) throw invalidResponse();
	return value;
}

function invalidResponse(): PublicationClientError {
	return new PublicationClientError('server', 'Cloud response was invalid');
}

function readErrorMessage(value: unknown): string | null {
	if (!isRecord(value) || !isRecord(value.error) || typeof value.error.message !== 'string') return null;
	return value.error.message;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAbort(error: unknown, signal?: AbortSignal): boolean {
	return signal?.aborted === true || (error instanceof DOMException && error.name === 'AbortError');
}
