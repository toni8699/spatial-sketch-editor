/**
 * P22.4 — Publish surface presentation (pure, no I/O).
 *
 * One clear primary action per state. Callers supply the editor session
 * (ownership, saved version, dirtiness) plus the last known server status;
 * this module never fetches, mutates, or touches local work.
 */
import type { PublicationStatus } from '../publication-client';

export type PublishSessionStatus = 'checking' | 'authenticated' | 'unauthenticated' | 'error';

export type PublishStateKey =
	| 'session-checking'
	| 'guest'
	| 'unconfigured'
	| 'unsaved'
	| 'dirty'
	| 'save-blocked'
	| 'status-loading'
	| 'status-failed'
	| 'stale'
	| 'never-published'
	| 'current'
	| 'behind'
	| 'unpublished';

export type PublishPrimaryAction = 'publish' | 'update' | null;

export type PublishModel = {
	state: PublishStateKey;
	heading: string;
	detail: string;
	primaryAction: PublishPrimaryAction;
	primaryLabel: string | null;
	/** Non-empty when the primary action must stay disabled. */
	primaryDisabledReason: string | null;
	canUnpublish: boolean;
	unpublishDisabledReason: string | null;
	/** Same-origin public path; null until the first successful publish. */
	publicPath: string | null;
	showPublicLink: boolean;
};

export function publicationPresentation(input: {
	sessionStatus: PublishSessionStatus;
	isOwned: boolean;
	/** Last saved version known to this editor session; null before first save. */
	savedVersion: number | null;
	isDirty: boolean;
	saveBlocker: string | null;
	apiConfigured: boolean;
	status: PublicationStatus | null;
	statusLoading: boolean;
	statusError: string | null;
	mutationBusy: boolean;
}): PublishModel {
	const {
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
	} = input;

	if (sessionStatus === 'checking') {
		return base('session-checking', 'Checking sign-in…', 'Confirming who can publish this project.', null, null);
	}
	if (sessionStatus !== 'authenticated') {
		return {
			...base(
				'guest',
				'Sign in to publish',
				'Publishing needs an owned cloud project. Your draft stays in this browser tab — draft Preview keeps working without an account.',
				null,
				null
			),
			primaryDisabledReason: 'Sign-in is required'
		};
	}
	if (!apiConfigured) {
		return base('unconfigured', 'Publishing is unavailable', 'The publish service is not configured for this site.', null, null);
	}
	if (!isOwned || savedVersion === null) {
		return {
			...base(
				'unsaved',
				'Save before publishing',
				'Publishing shares an exact saved version. Save this project to the cloud first — nothing is published automatically.',
				'publish',
				'Save then publish'
			),
			primaryDisabledReason: 'Save the project before publishing'
		};
	}
	if (isDirty || saveBlocker) {
		const detail = saveBlocker
			? `This draft has unsaved changes that cannot be saved yet: ${saveBlocker}. Resolve it, Save, then publish the saved version.`
			: 'This draft has unsaved changes. Save first, then explicitly publish the saved version — publishing never saves for you.';
		return {
			...base('dirty', 'Save before publishing', detail, 'publish', 'Save then publish'),
			primaryDisabledReason: saveBlocker ?? 'Unsaved draft changes'
		};
	}
	if (statusLoading && !status) {
		return base('status-loading', 'Checking publication status…', 'Fetching the current published version.', null, null);
	}
	if (statusError && !status) {
		return {
			...base(
				'status-failed',
				'Could not check publication status',
				`${statusError} The last working publication is unchanged. Retry to refetch before publishing.`,
				null,
				null
			),
			primaryDisabledReason: statusError
		};
	}
	if (!status) {
		return base('status-loading', 'Checking publication status…', 'Fetching the current published version.', null, null);
	}
	// A saved version this session does not know means cloud state moved
	// (another tab or device saved). Block state-changing actions and never
	// touch local work automatically. When our own fresh save is simply
	// newer than the last status fetch, refresh instead of crying stale —
	// the caller refetches on `savedVersion` change so this resolves fast.
	if (status.currentVersion !== savedVersion) {
		if (status.currentVersion < savedVersion) {
			return {
				state: 'status-loading',
				heading: 'Refreshing publication status…',
				detail: `Version ${savedVersion} just saved. Re-reading the publication status before offering publish actions.`,
				primaryAction: null,
				primaryLabel: null,
				primaryDisabledReason: 'Refreshing publication status…',
				canUnpublish: false,
				unpublishDisabledReason: 'Refreshing publication status…',
				publicPath: status.publicationId ? `/p/${status.publicationId}` : null,
				showPublicLink: false
			};
		}
		return {
			state: 'stale',
			heading: 'Cloud state changed',
			detail: `This session last saved version ${savedVersion}, but the cloud now holds version ${status.currentVersion}. Publishing from a stale baseline is blocked — your draft was left untouched. Save or reload to reconcile, then retry.`,
			primaryAction: null,
			primaryLabel: null,
			primaryDisabledReason: `Cloud holds version ${status.currentVersion}; this session knows ${savedVersion}`,
			canUnpublish: false,
			unpublishDisabledReason: `Cloud holds version ${status.currentVersion}; this session knows ${savedVersion}`,
			publicPath: status.publicationId ? `/p/${status.publicationId}` : null,
			showPublicLink: status.publicationId !== null && status.activeVersion !== null
		};
	}
	if (mutationBusy) {
		const busy: PublishModel = {
			...base('status-loading', 'Working…', 'The publish request is in flight. Late responses cannot leak into another project.', null, null),
			primaryDisabledReason: 'Request in flight',
			canUnpublish: false,
			unpublishDisabledReason: 'Request in flight'
		};
		if (status.publicationId === null) return busy;
		return {
			...busy,
			publicPath: `/p/${status.publicationId}`,
			showPublicLink: status.activeVersion !== null
		};
	}
	if (status.publicationId === null) {
		return {
			state: 'never-published',
			heading: 'Publish this project',
			detail: `Version ${savedVersion} will become publicly readable at a stable unlisted URL, with its referenced assets. Later edits and Saves leave it unchanged until you explicitly update it.`,
			primaryAction: 'publish',
			primaryLabel: `Publish saved version ${savedVersion}`,
			primaryDisabledReason: null,
			canUnpublish: false,
			unpublishDisabledReason: 'Nothing is published yet',
			publicPath: null,
			showPublicLink: false
		};
	}
	const publicPath = `/p/${status.publicationId}`;
	if (status.activeVersion === null) {
		return {
			state: 'unpublished',
			heading: 'Currently unpublished',
			detail: `Version ${savedVersion} is saved and ready. The link ${publicPath} is reserved but visitors currently get “unavailable”. Republishing restores the same URL.`,
			primaryAction: 'publish',
			primaryLabel: `Publish saved version ${savedVersion}`,
			primaryDisabledReason: null,
			canUnpublish: false,
			unpublishDisabledReason: 'Already unpublished',
			publicPath,
			showPublicLink: false
		};
	}
	if (status.activeVersion === savedVersion) {
		return {
			state: 'current',
			heading: 'Published and up to date',
			detail: `Visitors see version ${status.activeVersion}${status.updatedAt ? ` (updated ${status.updatedAt})` : ''}. Editing, renaming and Saving leave this published version unchanged until you update it.`,
			primaryAction: null,
			primaryLabel: null,
			primaryDisabledReason: null,
			canUnpublish: true,
			unpublishDisabledReason: null,
			publicPath,
			showPublicLink: true
		};
	}
	return {
		state: 'behind',
		heading: 'Saved changes are unpublished',
		detail: `Visitors still see version ${status.activeVersion}. Version ${savedVersion} is saved and ready — updating switches the public output to it.`,
		primaryAction: 'update',
		primaryLabel: `Update to version ${savedVersion}`,
		primaryDisabledReason: null,
		canUnpublish: true,
		unpublishDisabledReason: null,
		publicPath,
		showPublicLink: true
	};
}

function base(
	state: PublishStateKey,
	heading: string,
	detail: string,
	primaryAction: PublishPrimaryAction,
	primaryLabel: string | null
): PublishModel {
	return {
		state,
		heading,
		detail,
		primaryAction,
		primaryLabel,
		primaryDisabledReason: primaryAction ? 'Unavailable' : null,
		canUnpublish: false,
		unpublishDisabledReason: 'Unavailable',
		publicPath: null,
		showPublicLink: false
	};
}
