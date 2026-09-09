/**
 * `document-format-policy.svelte.ts` — P23.0 F0 stage 1: the central
 * document-format dispatch (the "dual-dispatch" policy of the P23.0
 * editor-adapter cutover).
 *
 * H5 §"Editor-adapter cutover before writer enable": before new-schema
 * writes enable, EVERY editor mutation path must be one of
 *
 * - `adapted`   — writes the new canonical model (wall-first Layout /
 *   world-local Scene);
 * - `read-only` — reads compatibility state but never mutates it;
 * - `disabled`  — explicitly blocked with a reason until its later child
 *   slice deepens it.
 *
 * **Why a central table.** The stage-1 plan decision (P23.0 execution
 * order) is central dispatch by default; per-file exceptions need a named
 * reason. Both authoring transaction domains funnel through exactly one
 * guard call each (`beginLayoutTransaction` / `beginDocumentTransaction`
 * + the matching commits on the `EditorStore` facade), so one table +
 * two call sites cover every mutator. The exhaustive architecture test
 * (`p23-f0-stage1-format-policy.test.ts`) pins the call-site inventory:
 * a file that starts opening document transactions must either route
 * through the facade (already guarded) or be added to the reviewed
 * exception list with a named reason.
 *
 * **Stage-1 semantics (no behavior change for reachable documents).**
 * The editor today only boots/loads strictly-validated LEGACY documents
 * (the cloud Load path validates with the legacy `validateProject`;
 * `createEmptyProject` boots legacy). For every format the editor can
 * currently hold, the policy below is `adapted`, so the guards are
 * provably behavioral no-ops — the stage-1 suite demonstrates this on
 * legacy AND world-local Scene documents. The moment stage 2 (canonical
 * writers) introduces wall-first Layout documents, the `wall-first`
 * Layout entry is the single switch that flips from `disabled` to
 * `adapted` — no call site revisits.
 */

import {
	SCENE_WORLD_LOCAL_FORMAT_VERSION,
	type SceneDocument
} from '$lib/content/scene';
import { decodeLayoutValueCompatible } from '$lib/layout/layout-compat';

/** The three P23.0 adapter classifications. */
export type DocumentFormatMutationPolicy = 'adapted' | 'read-only' | 'disabled';

/** Scene format discriminators (P23.0b world-local Scene). */
export type SceneFormatKey = 'legacy-room-local' | 'project-world';

/**
 * Layout format discriminators (P23.0a compat decode kinds). The legacy
 * key covers the `legacy` decode kind; `unrecognized` covers every
 * decode outcome that is neither legacy nor wall-first — it must never
 * be mutable.
 */
export type LayoutFormatKey = 'legacy' | 'wall-first' | 'unrecognized';

/** One classification decision, consumable by guards and diagnostics. */
export type DocumentFormatMutationClass = {
	/** Which authoring transaction domain the entry gates. */
	domain: 'scene' | 'layout';
	format: SceneFormatKey | LayoutFormatKey;
	policy: DocumentFormatMutationPolicy;
	/** Required for anything not `adapted`; surfaced on refusal. */
	reason: string | null;
};

/**
 * Scene-domain policy. Both scene formats stay `adapted` in stage 1: the
 * Scene mutators already carry the world-local branch (P23.0b adapter
 * audit — identity frame for absent `roomId`), and legacy scene mutation
 * is the current authoring behavior.
 */
export const SCENE_MUTATION_POLICY: Record<SceneFormatKey, DocumentFormatMutationPolicy> = {
	'legacy-room-local': 'adapted',
	'project-world': 'adapted'
};

/** Refusal reasons for the scene domain (empty while everything is adapted). */
export const SCENE_MUTATION_REASONS: Record<SceneFormatKey, string | null> = {
	'legacy-room-local': null,
	'project-world': null
};

/**
 * Layout-domain policy. Legacy layout mutation is the current authoring
 * behavior (adapted). Wall-first layout mutation is **explicitly
 * disabled** until the stage-2 canonical writers land: no editor mutator
 * may write wall-first shape before the writers, the reconciliation
 * planner wiring and the replay fixtures exist. Unrecognized layouts are
 * never mutable by construction.
 */
export const LAYOUT_MUTATION_POLICY: Record<LayoutFormatKey, DocumentFormatMutationPolicy> = {
	legacy: 'adapted',
	'wall-first': 'disabled',
	unrecognized: 'disabled'
};

/** Refusal reasons for the layout domain. */
export const LAYOUT_MUTATION_REASONS: Record<LayoutFormatKey, string | null> = {
	legacy: null,
	'wall-first': 'Wall-first layout mutation enables with the canonical writers (P23.0 stage 2)',
	unrecognized: 'Unrecognized layout format cannot be authored'
};

/** Classify a Scene document by its P23.0b format discriminator. */
export function classifySceneFormat(document: SceneDocument): SceneFormatKey {
	return document.formatVersion === SCENE_WORLD_LOCAL_FORMAT_VERSION
		? 'project-world'
		: 'legacy-room-local';
}

/** Classify an unknown layout value through the P23.0a compat decoder. */
export function classifyLayoutFormat(layout: unknown): LayoutFormatKey {
	const decode = decodeLayoutValueCompatible(layout);
	if (decode.kind === 'wall-first') return 'wall-first';
	if (decode.kind === 'legacy') return 'legacy';
	return 'unrecognized';
}

/** Scene-domain classification for a candidate document. */
export function sceneMutationClassFor(document: SceneDocument): DocumentFormatMutationClass {
	const format = classifySceneFormat(document);
	return { domain: 'scene', format, policy: SCENE_MUTATION_POLICY[format], reason: SCENE_MUTATION_REASONS[format] };
}

/** Layout-domain classification for an unknown layout value. */
export function layoutMutationClassFor(layout: unknown): DocumentFormatMutationClass {
	const format = classifyLayoutFormat(layout);
	return { domain: 'layout', format, policy: LAYOUT_MUTATION_POLICY[format], reason: LAYOUT_MUTATION_REASONS[format] };
}

/** Only `adapted` formats may open/commit authoring transactions. */
export function isMutationAllowed(classification: DocumentFormatMutationClass): boolean {
	return classification.policy === 'adapted';
}
