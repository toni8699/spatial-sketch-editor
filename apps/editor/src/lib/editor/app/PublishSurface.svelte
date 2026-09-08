<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import {
		createPublicationApi,
		PublicationClientError,
		type PublicationApi,
		type PublicationStatus
	} from '$lib/editor/publication-client';
	import { publicationPresentation } from './publication-presentation';

	let {
		projectId,
		savedVersion,
		isDirty,
		saveBlocker,
		sessionStatus,
		isOwned,
		apiOrigin = '',
		publicationApi = null,
		onSaveProject,
		onSignIn
	}: {
		projectId: string | null;
		savedVersion: number | null;
		isDirty: boolean;
		saveBlocker: string | null;
		sessionStatus: 'checking' | 'authenticated' | 'unauthenticated' | 'error';
		isOwned: boolean;
		apiOrigin?: string;
		publicationApi?: PublicationApi | null;
		onSaveProject?: () => void | Promise<void>;
		onSignIn?: () => void | Promise<void>;
	} = $props();

	// Client is session-config, not reactive state: props never change identity
	// at runtime, so cache it instead of rebuilding per render.
	let cachedApi: PublicationApi | null | undefined = undefined;
	function client(): PublicationApi | null {
		if (cachedApi === undefined) {
			cachedApi = publicationApi ?? (apiOrigin ? createPublicationApi({ apiOrigin }) : null);
		}
		return cachedApi;
	}
	const apiConfigured = $derived(publicationApi !== null || Boolean(apiOrigin));

	let status = $state<PublicationStatus | null>(null);
	let statusLoading = $state(false);
	let statusError = $state<string | null>(null);
	let mutationBusy = $state(false);
	let mutationError = $state<string | null>(null);
	let conflictNotice = $state<string | null>(null);
	let transientNotice = $state<string | null>(null);
	let copyNotice = $state<string | null>(null);
	let headingElement = $state<HTMLElement | null>(null);

	let requestToken = 0;
	let activeController: AbortController | null = null;

	const model = $derived(
		publicationPresentation({
			sessionStatus,
			isOwned,
			savedVersion,
			isDirty,
			saveBlocker,
			apiConfigured,
			status,
			statusLoading,
			statusError,
			mutationBusy
		})
	);

	function canFetch(target: string | null): target is string {
		return (
			Boolean(target) &&
			client() !== null &&
			sessionStatus === 'authenticated' &&
			isOwned
		);
	}

	function messageOf(error: unknown, fallback: string): string {
		if (error instanceof PublicationClientError) return error.message;
		return fallback;
	}

	function isAbortError(error: unknown): boolean {
		return error instanceof DOMException && error.name === 'AbortError';
	}

	async function fetchStatus(kind: 'entry' | 'retry' | 'background'): Promise<void> {
		const target = projectId;
		const api = client();
		if (!canFetch(target) || !api) return;
		const token = ++requestToken;
		activeController?.abort();
		const controller = new AbortController();
		activeController = controller;
		if (kind !== 'background') {
			statusLoading = true;
			statusError = null;
			if (kind === 'entry') transientNotice = null;
		}
		try {
			const next = await api.getStatus(target, controller.signal);
			if (token !== requestToken || controller.signal.aborted) return;
			if (projectId !== target) return;
			status = next;
			statusError = null;
			if (kind !== 'background') transientNotice = null;
		} catch (error) {
			if (token !== requestToken || controller.signal.aborted) return;
			if (projectId !== target) return;
			if (isAbortError(error)) return;
			const message = messageOf(error, 'Could not check publication status');
			if (kind === 'background') transientNotice = message;
			else statusError = message;
		} finally {
			if (token === requestToken && activeController === controller) {
				activeController = null;
				statusLoading = false;
			}
		}
	}

	// Entry fetch + project-switch safety: a new project ID aborts the
	// obsolete request, drops prior-project state, and starts over. Late
	// responses can never install into the new project's UI.
	$effect(() => {
		const target = projectId;
		const fetchable =
			Boolean(target) && apiConfigured && sessionStatus === 'authenticated' && isOwned;
		if (!fetchable) {
			requestToken += 1;
			activeController?.abort();
			activeController = null;
			status = null;
			statusLoading = false;
			statusError = null;
			mutationBusy = false;
			mutationError = null;
			conflictNotice = null;
			transientNotice = null;
			copyNotice = null;
			return;
		}
		status = null;
		statusError = null;
		mutationError = null;
		conflictNotice = null;
		copyNotice = null;
		void fetchStatus('entry');
	});

	// A fresh save moves `savedVersion` past the last fetched
	// `currentVersion`: re-read so publish actions unblock without a manual
	// retry. Reads only — the effect never writes `savedVersion`.
	$effect(() => {
		const known = savedVersion;
		const fetched = status?.currentVersion;
		if (known === null || fetched === undefined) return;
		if (fetched === known) return;
		if (!canFetch(projectId)) return;
		void fetchStatus('background');
	});

	onMount(() => {
		headingElement?.focus({ preventScroll: true });
	});

	onDestroy(() => {
		requestToken += 1;
		activeController?.abort();
		activeController = null;
	});

	async function settleMutation(
		target: string,
		api: PublicationApi,
		work: (signal: AbortSignal) => Promise<PublicationStatus>,
		token: number,
		controller: AbortController
	): Promise<void> {
		try {
			const next = await work(controller.signal);
			if (token !== requestToken || controller.signal.aborted) return;
			if (projectId !== target) return;
			status = next;
			statusError = null;
			transientNotice = null;
		} catch (error) {
			if (token !== requestToken || controller.signal.aborted) return;
			if (projectId !== target) return;
			if (isAbortError(error)) return;
			if (error instanceof PublicationClientError && error.code === 'conflict') {
				// ABA/stale writer: the revision moved elsewhere. Refresh to
				// the observed cloud state and explain — never auto-retry the
				// mutation against the new revision.
				conflictNotice = `The publication changed elsewhere (now revision ${error.revision}). Status was refreshed — review and retry.`;
				try {
					const fresh = await api.getStatus(target);
					if (token !== requestToken || projectId !== target) return;
					status = fresh;
					statusError = null;
				} catch {
					// Keep the last working publication; the notice still stands.
				}
				return;
			}
			if (error instanceof PublicationClientError && error.code === 'invalid') {
				mutationError = error.message;
				return;
			}
			// Uncertain outcome (network/server): the request may or may not
			// have applied. Refetch before offering a retry so the next
			// attempt uses observed cloud state.
			mutationError = `${messageOf(error, 'The publish request failed')} The last working publication is unchanged.`;
			try {
				const fresh = await api.getStatus(target);
				if (token !== requestToken || projectId !== target) return;
				status = fresh;
				statusError = null;
			} catch {
				// Keep the last working status; the error above still stands.
			}
			return;
		} finally {
			if (token === requestToken) mutationBusy = false;
		}
	}

	async function runMutation(kind: 'publish' | 'unpublish'): Promise<void> {
		const target = projectId;
		const api = client();
		const current = status;
		if (!target || !api || !current || savedVersion === null || mutationBusy) return;
		// Re-check the presentation gate at click time: a stale baseline or
		// dirty draft that arrived after render must still block.
		if (kind === 'publish' && model.primaryDisabledReason) return;
		if (kind === 'unpublish' && !model.canUnpublish) return;
		mutationBusy = true;
		mutationError = null;
		conflictNotice = null;
		copyNotice = null;
		const token = ++requestToken;
		activeController?.abort();
		const controller = new AbortController();
		activeController = controller;
		if (kind === 'publish') {
			await settleMutation(target, api, (signal) => api.publishVersion(target, savedVersion, current.revision, signal), token, controller);
		} else {
			await settleMutation(target, api, (signal) => api.unpublishVersion(target, current.revision, signal), token, controller);
		}
		if (token === requestToken && activeController === controller) activeController = null;
	}

	async function copyLink(path: string): Promise<void> {
		copyNotice = null;
		try {
			const absolute = `${window.location.origin}${path}`;
			await navigator.clipboard.writeText(absolute);
			copyNotice = 'Link copied to clipboard';
		} catch {
			copyNotice = 'Copy failed — select the link manually';
		}
	}
</script>

<section class="publish-surface" aria-labelledby="publish-heading">
	<p class="eyebrow">Publish</p>
	<h1 id="publish-heading" tabindex="-1" bind:this={headingElement}>{model.heading}</h1>
	<p class="lede">{model.detail}</p>

	{#if model.state === 'guest'}
		<div class="actions">
			{#if onSignIn}
				<button type="button" class="primary" onclick={() => void onSignIn?.()}>Sign in with Google</button>
			{/if}
		</div>
	{/if}

	{#if model.state === 'unsaved' || model.state === 'dirty' || model.state === 'save-blocked'}
		<div class="actions">
			{#if onSaveProject && !saveBlocker}
				<button type="button" class="primary" onclick={() => void onSaveProject?.()}>
					{model.state === 'unsaved' ? 'Save project' : 'Save now'}
				</button>
			{/if}
		</div>
	{/if}

	{#if model.state === 'status-failed' || model.state === 'stale'}
		<div class="actions">
			<button type="button" onclick={() => void fetchStatus('retry')} disabled={statusLoading}>
				{statusLoading ? 'Checking…' : model.state === 'stale' ? 'Refresh status' : 'Retry'}
			</button>
		</div>
	{/if}

	{#if model.primaryAction}
		<div class="actions">
			<button
				type="button"
				class="primary"
				disabled={model.primaryDisabledReason !== null || mutationBusy || statusLoading}
				title={model.primaryDisabledReason ?? model.primaryLabel}
				onclick={() => void runMutation('publish')}
			>{mutationBusy ? 'Working…' : model.primaryLabel}</button>
		</div>
	{/if}

	{#if model.showPublicLink && model.publicPath}
		{@const path = model.publicPath}
		<div class="link-card">
			<label class="link-label" for="publish-link">Public link (same origin)</label>
			<div class="link-row">
				<input id="publish-link" class="link-input" readonly value={path} onfocus={(event) => event.currentTarget.select()} />
				<button type="button" onclick={() => void copyLink(path)}>Copy link</button>
				<a class="button-link" href={path}>Open published project</a>
			</div>
			{#if copyNotice}<p class="notice" role="status">{copyNotice}</p>{/if}
			<p class="hint">Anyone with this link can view the published version. No sign-in required.</p>
		</div>
	{:else if model.publicPath}
		<p class="hint">Reserved link: <code>{model.publicPath}</code> (currently unpublished — visitors see “unavailable”).</p>
	{/if}

	{#if model.canUnpublish}
		<div class="actions danger">
			<button
				type="button"
				disabled={mutationBusy || statusLoading}
				onclick={() => void runMutation('unpublish')}
			>{mutationBusy ? 'Working…' : 'Unpublish'}</button>
		</div>
	{/if}

	<div class="status-region" aria-live="polite">
		{#if mutationError}<p class="error" role="alert">{mutationError}</p>{/if}
		{#if conflictNotice}<p class="error" role="alert">{conflictNotice}</p>{/if}
		{#if transientNotice}<p class="notice" role="status">{transientNotice}</p>{/if}
		{#if statusError && status}
			<p class="error" role="alert">{statusError} <button type="button" onclick={() => void fetchStatus('retry')}>Retry</button></p>
		{/if}
	</div>

	{#if status && savedVersion !== null}
		<dl class="versions">
			<div><dt>Saved version</dt><dd>{savedVersion}</dd></div>
			<div><dt>Published version</dt><dd>{status.activeVersion ?? '—'}</dd></div>
			<div><dt>Publication revision</dt><dd>{status.revision}</dd></div>
			{#if status.updatedAt}<div><dt>Last update</dt><dd>{status.updatedAt}</dd></div>{/if}
		</dl>
	{/if}
</section>

<style>
	.publish-surface {
		max-width: 44rem;
		margin: 0 auto;
		padding: 2rem 1.25rem 3rem;
		color: var(--editor-text-primary);
	}
	.publish-surface :focus-visible {
		outline: 2px solid var(--editor-accent);
		outline-offset: 2px;
	}
	.eyebrow {
		margin: 0 0 0.4rem;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--editor-accent);
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
		line-height: 1.2;
		outline: none;
	}
	.lede {
		margin: 0.9rem 0 0;
		line-height: 1.55;
		color: var(--editor-text-secondary, inherit);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1.25rem;
	}
	.actions.danger {
		margin-top: 1.75rem;
		padding-top: 1.25rem;
		border-top: 1px solid var(--editor-border-subtle);
	}
	button, .button-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		min-height: 2.25rem;
		padding: 0.45rem 0.9rem;
		border: 1px solid var(--editor-border-normal, currentColor);
		border-radius: 0.4rem;
		background: var(--editor-bg-control);
		color: var(--editor-text-primary);
		font: inherit;
		text-decoration: none;
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.5;
		cursor: default;
	}
	button.primary {
		border-color: var(--editor-accent-border);
		background: var(--editor-accent);
		color: var(--editor-bg-app);
		font-weight: 600;
	}
	.link-card {
		margin-top: 1.5rem;
		padding: 1rem;
		border: 1px solid var(--editor-border-subtle);
		border-radius: 0.5rem;
		background: var(--editor-bg-panel-raised);
	}
	.link-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}
	.link-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}
	.link-input {
		flex: 1 1 12rem;
		min-height: 2.25rem;
		padding: 0.35rem 0.6rem;
		border: 1px solid var(--editor-border-subtle);
		border-radius: 0.35rem;
		background: var(--editor-bg-app);
		color: var(--editor-text-primary);
		font: inherit;
	}
	.hint {
		margin: 0.75rem 0 0;
		font-size: 0.82rem;
		line-height: 1.5;
		opacity: 0.85;
	}
	.notice {
		margin: 0.6rem 0 0;
		font-size: 0.85rem;
	}
	.error {
		margin: 0.6rem 0 0;
		font-size: 0.85rem;
		color: var(--editor-text-error, #ff9d9d);
	}
	.status-region {
		margin-top: 1rem;
	}
	.status-region:empty {
		display: none;
	}
	.versions {
		display: grid;
		gap: 0.4rem;
		margin: 1.75rem 0 0;
		padding: 1rem;
		border: 1px solid var(--editor-border-subtle);
		border-radius: 0.5rem;
		font-size: 0.85rem;
	}
	.versions div {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}
	.versions dt {
		opacity: 0.8;
	}
	.versions dd {
		margin: 0;
		font-variant-numeric: tabular-nums;
	}
</style>
