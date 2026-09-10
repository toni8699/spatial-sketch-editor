/**
 * P21.4 — editor-side visitor preview coordinator.
 *
 * Computes entry blockers and composes detached preview bundles from the live
 * authoring session. Never touches cloud eligibility (`computeCloudSaveBlocker`
 * is irrelevant: retained local bytes render without Save/auth). Kept outside
 * the visitor import closure (imports editor stores + BinaryTextureStore).
 */
import { MUSEUM_SCENE_VALIDATION_OPTIONS } from '$lib/content/scene-validation';
import { isSafeTextureUri } from '$lib/content/texture-uri';
import { derivePreviewBundle } from '$lib/editor/layout/layout-preview-state.svelte';
import { hasBlockingLayoutIssues } from '$lib/layout/layout-geometry-validation';
import {
	isPackageRewriteUri,
	isProjectAssetUri
} from '$lib/editor/store/project-export-store.svelte';
import { prepareCompatibleRuntime } from '$lib/project/compat-runtime';
import type { SceneDocument, RuntimeScene, NavigationGraph } from '$lib/content/scene';
import type { LayoutRoomRegistry } from '$lib/project/project-layout-semantics';
import type { LayoutDocument } from '$lib/layout/layout-types';
import type { BinaryTextureEntry } from '$lib/editor/store/binary-texture-store.svelte';

export type PreviewTextureStoreLike = {
	has(uri: string): boolean;
	getEntry(uri: string): BinaryTextureEntry | null;
};

export type PreviewEntryConditions = {
	interactionActive: boolean;
	documentTransactionActive: boolean;
	projectMutationInFlight: boolean;
	projectAssetMutationInFlight: boolean;
	pendingPlacementActive: boolean;
	bootstrapBusy: boolean;
	pendingSaveHandoff: boolean;
};

export type PreviewBundleTextures = {
	bytesByUri: Map<string, { bytes: Uint8Array; mime: string }>;
	urlsByUri: Map<string, string>;
	resolveTexture: (uri: string) => string | null;
	dispose: () => void;
};

function requiresRetainedBytes(uri: string): boolean {
	if (isProjectAssetUri(uri)) return true;
	if (isPackageRewriteUri(uri)) return true;
	if (uri.startsWith('/local/')) return true;
	return false;
}

/**
 * Editor-side entry gate. Returns a human reason when preview must stay in
 * Spatial with the session untouched, or null when entry may proceed. Checks
 * busy/gesture conditions first, then project/geometry validation, then
 * retained-byte availability for local/package/project-asset textures.
 */
export function computeVisitorPreviewBlocker(input: {
	scene: SceneDocument;
	layout: LayoutDocument;
	projectId: string;
	projectName: string;
	conditions: PreviewEntryConditions;
	textureStore: PreviewTextureStoreLike;
}): string | null {
	const { scene, layout, projectId, projectName, conditions, textureStore } = input;
	if (conditions.projectMutationInFlight || conditions.bootstrapBusy) {
		return 'Project is loading — try Preview after it finishes';
	}
	if (conditions.projectAssetMutationInFlight) {
		return 'Finish the project asset upload before preview';
	}
	if (conditions.interactionActive || conditions.documentTransactionActive) {
		return 'Stop the current interaction before preview';
	}
	if (conditions.pendingPlacementActive) {
		return 'Finish or cancel placement before preview';
	}
	if (conditions.pendingSaveHandoff) {
		return 'Finish the pending save sign-in before preview';
	}
	const name = projectName.trim();
	if (!name) return 'Project name cannot be empty';
	if (!projectId) return 'Project is not ready for preview';

	const validation = prepareCompatibleRuntime(
		{ id: projectId, name, layout, scene },
		MUSEUM_SCENE_VALIDATION_OPTIONS
	);
	if (validation.kind === 'rejected') {
		return validation.issues[0]?.message ?? 'Project validation failed';
	}
	if (hasBlockingLayoutIssues(validation.issues)) {
		return validation.issues[0]?.message ?? 'Layout geometry is invalid';
	}
	if (validation.decodeKind === 'legacy-compatible') {
		// Legacy render-model preflight (wall-mesh build fails closed): entry
		// still gates on the exact legacy bundle. Wall-first documents have no
		// legacy render model until the post-F0 cutover.
		let bundle;
		try {
			bundle = derivePreviewBundle(projectId, name, layout, scene);
		} catch (error) {
			return error instanceof Error ? error.message : 'Could not prepare preview';
		}
		if (hasBlockingLayoutIssues(bundle.issues)) {
			return bundle.issues[0]?.message ?? 'Layout geometry is invalid';
		}
	}
	// Texture availability: retained bytes for local/package/project-asset,
	// loader-backed safe static otherwise. Unsupported blocks entry.
	for (const texture of scene.textures) {
		const uri = texture.uri;
		if (requiresRetainedBytes(uri)) {
			if (!textureStore.has(uri)) {
				return `Texture “${texture.name}” is not available for preview`;
			}
			const entry = textureStore.getEntry(uri);
			if (!entry || entry.bytes.byteLength === 0) {
				return `Texture “${texture.name}” is not available for preview`;
			}
			continue;
		}
		if (isSafeTextureUri(uri)) continue;
		return `Texture “${texture.name}” uses an unsupported source`;
	}
	return null;
}

export type DetachedPreviewBundle = {
	projectId: string;
	projectName: string;
	scene: RuntimeScene;
	geometry: ReturnType<typeof derivePreviewBundle>['geometry'];
	rooms: LayoutRoomRegistry;
	graph: NavigationGraph;
	textures: PreviewBundleTextures;
};

/**
 * Compose a detached, validated in-memory bundle for the visitor surface.
 * Uses the live Scene document (never the layout state's stale Scene copy),
 * validates without cloud checks/Save/baseline mutation/live installation.
 * Call `computeVisitorPreviewBlocker` first; this throws on invalid input.
 */
export function composeDetachedPreviewBundle(input: {
	scene: SceneDocument;
	layout: LayoutDocument;
	projectId: string;
	projectName: string;
	textureStore: PreviewTextureStoreLike;
}): DetachedPreviewBundle {
	const { scene, layout, projectId, projectName, textureStore } = input;
	const name = projectName.trim();
	const prepared = prepareCompatibleRuntime(
		{ id: projectId, name, layout, scene },
		MUSEUM_SCENE_VALIDATION_OPTIONS
	);
	if (prepared.kind === 'rejected') {
		throw new Error(prepared.issues[0]?.message ?? 'Project validation failed');
	}
	if (hasBlockingLayoutIssues(prepared.issues)) {
		throw new Error(prepared.issues[0]?.message ?? 'Layout geometry is invalid');
	}
	// Legacy render-model preflight preserves the exact pre-cutover bundle
	// (mesh build fails closed). Wall-first documents compile through the
	// shared core with no legacy render model yet.
	const preview =
		prepared.decodeKind === 'legacy-compatible'
			? derivePreviewBundle(projectId, name, layout, scene)
			: null;
	if (preview && hasBlockingLayoutIssues(preview.issues)) {
		throw new Error(preview.issues[0]?.message ?? 'Layout geometry is invalid');
	}
	const rooms = prepared.rooms;
	const runtimeScene = prepared.runtimeScene;
	const graph = prepared.graph;

	const bytesByUri = new Map<string, { bytes: Uint8Array; mime: string }>();
	const urlsByUri = new Map<string, string>();
	try {
		for (const texture of prepared.project.scene.textures) {
			const uri = texture.uri;
			if (!requiresRetainedBytes(uri)) continue;
			const entry = textureStore.getEntry(uri);
			if (!entry || entry.bytes.byteLength === 0) {
				throw new Error(`Texture “${texture.name}” is not available for preview`);
			}
			const bytes = entry.bytes.slice();
			bytesByUri.set(uri, { bytes, mime: entry.mime });
			try {
				const blob = new Blob([bytes.slice()], { type: entry.mime });
				urlsByUri.set(uri, URL.createObjectURL(blob));
			} catch {
				throw new Error(`Texture “${texture.name}” is not available for preview`);
			}
		}
	} catch (error) {
		// The entry gate pre-verifies availability, so this is race-only; still,
		// never leak partially created snapshot URLs on the way out.
		for (const url of urlsByUri.values()) {
			try {
				URL.revokeObjectURL(url);
			} catch {
				// Best effort.
			}
		}
		urlsByUri.clear();
		throw error;
	}

	const resolveTexture = (uri: string): string | null => {
		const previewUrl = urlsByUri.get(uri);
		if (previewUrl) return previewUrl;
		if (requiresRetainedBytes(uri)) return null;
		return isSafeTextureUri(uri) ? uri : null;
	};

	const dispose = () => {
		for (const url of urlsByUri.values()) {
			try {
				URL.revokeObjectURL(url);
			} catch {
				// Already revoked.
			}
		}
		urlsByUri.clear();
	};

	return {
		projectId,
		projectName: name,
		scene: runtimeScene,
		geometry: preview ? preview.geometry : prepared.geometry,
		rooms,
		graph,
		textures: { bytesByUri, urlsByUri, resolveTexture, dispose }
	};
}
