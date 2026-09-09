/**
 * `scene-format.ts` — P23.0a explicit Scene format identification.
 *
 * The Scene counterpart of Layout's `formatVersion` dispatch (P23.0 child
 * plan, "target schema and identification" required policy):
 *
 * - the **new** (world-local) Scene shape will carry an explicit format
 *   discriminator; that shape and its decoder arrive with P23.0b, so today
 *   *every* explicit `formatVersion` in a Scene payload is rejected as an
 *   unsupported version rather than guessed at;
 * - a payload **without** `formatVersion` is accepted only through the
 *   explicit recognized legacy decoder (`validateSceneDocument`, the current
 *   room-local shape). Missing version never silently means "whatever
 *   parses";
 * - schema version is never inferred from presence/absence of arbitrary
 *   fields (H5 §10.1).
 *
 * Separation note (P23.0 required policy): the portable package manifest's
 * generator string and package format are **separate concepts** from this
 * nested Scene schema version — package orchestration must never dispatch on
 * the generator string, and this module never reads package data.
 */
import type { SceneDocument } from './scene';
import type { SceneDocumentIssue } from './scene-codec';
import { validateSceneDocument } from './scene-codec';

/** Where Scene physical values must still be resolved from. */
export type SceneCoordinateSpace = 'legacy-room-local' | 'project-world';

export type RecognizedLegacySceneDecode = {
	kind: 'recognized-legacy';
	/** Current room-local Scene document (the only shipped shape today). */
	document: SceneDocument;
	/** Legacy Scene/Camera values require Room-frame resolution. */
	sceneSpace: 'legacy-room-local';
};

export type UnrecognizedSceneDecode = {
	kind: 'unrecognized';
	reason: 'invalid-json-payload' | 'legacy-invalid' | 'unsupported-format-version';
	issues: SceneDocumentIssue[];
};

export type SceneFormatIdentification = RecognizedLegacySceneDecode | UnrecognizedSceneDecode;

/**
 * Identify a parsed Scene payload's format explicitly.
 *
 * The world-local Scene decoder does not exist until P23.0b, so an explicit
 * `formatVersion` of any value is rejected with
 * `unsupported-format-version`. When P23.0b lands, its discriminator value is
 * added here and routed to the new decoder — the dispatch stays the single
 * Scene format boundary.
 */
export function identifySceneFormat(input: unknown): SceneFormatIdentification {
	if (typeof input !== 'object' || input === null || Array.isArray(input)) {
		return {
			kind: 'unrecognized',
			reason: 'invalid-json-payload',
			issues: [
				{ path: '$', code: 'invalid_type', message: 'Expected a scene document object' }
			]
		};
	}
	if ('formatVersion' in input) {
		return {
			kind: 'unrecognized',
			reason: 'unsupported-format-version',
			issues: [
				{
					path: '$.formatVersion',
					code: 'unsupported_format_version',
					message:
						'No Scene decoder is implemented for explicit formatVersion values yet; the recognized legacy scene shape carries no formatVersion'
				}
			]
		};
	}
	const legacy = validateSceneDocument(input);
	if (legacy.success) {
		return { kind: 'recognized-legacy', document: legacy.document, sceneSpace: 'legacy-room-local' };
	}
	return { kind: 'unrecognized', reason: 'legacy-invalid', issues: legacy.issues };
}
