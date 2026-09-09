/**
 * `project-compat.ts` — P23.0a explicit Project-level compatible decode.
 *
 * Combines the Layout and Scene format identification boundaries into one
 * decode result for a whole saved Project (`{ id, name, layout, scene }`).
 * The Project root itself does **not** carry a second schema number: nested
 * Layout/Scene compatibility is delegated to their shared decoders (H5 §10.1).
 *
 * Target result shape (P23.0 child plan, "Compatible decode result"):
 *
 * ```ts
 * type CompatibleProjectDecode =
 *   | { kind: 'wall-first'; ...; sceneSpace: 'project-world' }
 *   | { kind: 'migrated'; ...; report: MigrationReport; sceneSpace: 'project-world' }
 *   | { kind: 'legacy-compatible'; ...; report; sceneSpace: 'legacy-room-local' };
 * ```
 *
 * P23.0a scaffolding status, mapped onto that contract:
 *
 * - `wall-first` requires **both** documents wall-first/world-local. The
 *   world-local Scene decoder does not exist until P23.0b, so today this
 *   result is unreachable for real payloads and is therefore not produced.
 * - `migrated` is produced by P23.0b once legacy migration (P23.8 topology
 *   middle + trusted Room-frame conversion) exists. Not produced today.
 * - `legacy-compatible` is the only reachable project-level success: both
 *   documents decode as the recognized legacy shapes. The `report` is empty
 *   at this stage (pure identification; no conversion is attempted), and
 *   `sceneSpace: 'legacy-room-local'` tells downstream runtime preparation to
 *   resolve Scene/Camera values through Room frames exactly once.
 *
 * The decode is explicit on failure: a mixed payload (one document new, one
 * legacy) names the offending document instead of guessing.
 */
import type { LayoutDocument } from '@portfolio/layout-core';
import {
	decodeLayoutValueCompatible,
	type CompatibleLayoutDecode
} from '@portfolio/layout-core';
import type { ProjectIssue } from './project-types';
import { identifySceneFormat, type SceneFormatIdentification } from './scene-format';
import type { SceneDocument } from './scene';

export type LegacyCompatibleProjectDecode = {
	kind: 'legacy-compatible';
	project: {
		id: string;
		name: string;
		/**
		 * Legacy Room-owned Layout document. Kept as the legacy shape; P23.0b
		 * owns migrating it to wall-first before editable install.
		 */
		layout: LayoutDocument;
		/**
		 * Legacy room-local Scene document. P23.0b owns migrating physical
		 * values to project/world space; until then runtime preparation
		 * resolves Room frames exactly once.
		 */
		scene: SceneDocument;
	};
	/**
		 * Empty at the P23.0a stage: identification only, no migration attempted.
		 * P23.0b fills this with real migration diagnostics.
		 */
	report: ProjectDecodeReport;
	sceneSpace: 'legacy-room-local';
};

export type UnrecognizedProjectDecode = {
	kind: 'unrecognized';
	reason:
		| 'invalid-payload'
		| 'invalid-id'
		| 'invalid-name'
		| 'layout-unrecognized'
		| 'scene-unrecognized'
		| 'mixed-format-unsupported';
	issues: ProjectIssue[];
};

/**
 * Explicit compatible-decode result. Only the reachable P23.0a outcomes are
 * modeled; `wall-first` and `migrated` are intentionally absent until their
 * decoders exist (P23.0b) so callers cannot mistake scaffolding for a
 * migration path.
 */
export type CompatibleProjectDecode = LegacyCompatibleProjectDecode | UnrecognizedProjectDecode;

/** Deterministic migration/identification diagnostics. Not persisted truth. */
export type ProjectDecodeReport = {
	issues: ProjectIssue[];
};

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

/**
 * Decode a whole Project payload with explicit format identification.
 *
 * Accepts an already-parsed value (project codec seam). JSON-string input
 * should go through the caller's JSON parse so `invalid_json` failures keep
 * their existing project-codec semantics.
 */
export function decodeProjectCompatible(input: unknown): CompatibleProjectDecode {
	if (typeof input !== 'object' || input === null || Array.isArray(input)) {
		return {
			kind: 'unrecognized',
			reason: 'invalid-payload',
			issues: [{ path: '$', code: 'invalid_type', message: 'Expected a project object' }]
		};
	}
	const record = input as Record<string, unknown>;
	for (const key of Object.keys(record)) {
		if (key !== 'id' && key !== 'name' && key !== 'layout' && key !== 'scene') {
			return {
				kind: 'unrecognized',
				reason: 'invalid-payload',
				issues: [
					{ path: `$.${key}`, code: 'unknown_key', message: `Unknown key '${key}'` }
				]
			};
		}
	}

	const id = record.id;
	if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
		return {
			kind: 'unrecognized',
			reason: 'invalid-id',
			issues: [
				{
					path: '$.id',
					code: 'invalid_id',
					message: 'Expected an ID matching /^[A-Za-z0-9][A-Za-z0-9._:-]*$/'
				}
			]
		};
	}
	const name = record.name;
	if (typeof name !== 'string' || name.trim().length === 0) {
		return {
			kind: 'unrecognized',
			reason: 'invalid-name',
			issues: [{ path: '$.name', code: 'invalid_value', message: 'Expected a non-empty name' }]
		};
	}
	if (record.layout === undefined || record.scene === undefined) {
		return {
			kind: 'unrecognized',
			reason: 'invalid-payload',
			issues: [
				{
					path: '$',
					code: 'missing_field',
					message: 'Expected both layout and scene documents'
				}
			]
		};
	}

	const layout = decodeLayoutValueCompatible(record.layout);
	const scene = identifySceneFormat(record.scene);

	// Both legacy → the only reachable P23.0a success.
	if (layout.kind === 'legacy' && scene.kind === 'recognized-legacy') {
		return {
			kind: 'legacy-compatible',
			project: {
				id,
				name,
				layout: layout.document,
				scene: scene.document
			},
			report: { issues: [] },
			sceneSpace: 'legacy-room-local'
		};
	}

	if (layout.kind === 'unrecognized') {
		return {
			kind: 'unrecognized',
			reason: 'layout-unrecognized',
			issues: layout.issues.map((issue) => prefixIssue('$.layout', issue))
		};
	}
	if (scene.kind === 'unrecognized') {
		return {
			kind: 'unrecognized',
			reason: 'scene-unrecognized',
			issues: scene.issues.map((issue) => prefixIssue('$.scene', issue))
		};
	}
	// Remaining combinations pair a wall-first Layout with the legacy Scene
	// shape (or vice versa); no migration path exists until P23.0b, so name
	// the mismatch instead of half-decoding.
	return {
		kind: 'unrecognized',
		reason: 'mixed-format-unsupported',
		issues: [
			{
				path: '$',
				code: 'mixed_format_unsupported',
				message:
					'Project documents use different format generations; mixed Layout/Scene formats are not decodable until P23.0b migration lands'
			}
		]
	};
}

function prefixIssue(prefix: '$.layout' | '$.scene', issue: ProjectIssue): ProjectIssue {
	return {
		...issue,
		path: issue.path === '$' ? prefix : `${prefix}${issue.path.slice(1)}`
	};
}
