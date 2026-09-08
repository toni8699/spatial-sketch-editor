import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	loadEffectiveTextures,
	resetTextureCachesForTests,
	__resetDefaultSourceLoaderForTests,
	setDefaultTextureSourceLoader,
	acquireEffectiveVariant,
	releaseEffectiveVariant,
	type TextureLoadScope
} from '$lib/museum/materials/texture-cache';
import { remapModelMaterials, releaseModelMaterialRemap } from '$lib/museum/assets/instance-material-remap';
import {
	createReleaseTextureScope,
	type ReleaseBytesEntry
} from '$lib/visitor/visitor-texture-scope';
import {
	composeColdReleaseBundle,
	validateColdReleaseReferences
} from '$lib/visitor/visitor-cold-runtime';
import {
	SHIPPED_STATIC_REGISTRY_VERSION,
	isAllowedShippedTextureUri,
	getShippedMaterialById,
	getShippedModelByAssetId,
	listShippedTextureUris,
	listShippedModelFiles
} from '$lib/visitor/shipped-static-registry';
import { createEmptyProject } from '@portfolio/project-model';
import { Group, Mesh, BoxGeometry, MeshStandardMaterial } from 'three';
import type { Texture as ThreeTexture } from 'three';

function fakeTexture(id: string): ThreeTexture {
	return {
		uuid: id,
		isTexture: true,
		image: { complete: true },
		needsUpdate: false,
		colorSpace: '',
		wrapS: 0,
		wrapT: 0,
		repeat: { set() {}, x: 1, y: 1 },
		rotation: 0,
		center: { set() {} },
		clone(this: ThreeTexture) {
			return { ...this, uuid: `${id}#clone` } as unknown as ThreeTexture;
		},
		dispose() {}
	} as unknown as ThreeTexture;
}

function scopeWith(loader: (uri: string) => Promise<ThreeTexture>, scopeId: string): TextureLoadScope {
	return { scopeId, loader: ((uri: string) => loader(uri)) as TextureLoadScope['loader'] };
}

describe('P22.1 cold runtime + asset seam', () => {
	beforeEach(() => {
		resetTextureCachesForTests();
		__resetDefaultSourceLoaderForTests();
	});

	afterEach(() => {
		resetTextureCachesForTests();
		__resetDefaultSourceLoaderForTests();
	});

	it('renders a custom P20 texture from supplied bytes with no global loader', async () => {
		// No editor setup: global loader stays null throughout.
		setDefaultTextureSourceLoader(null);
		const p20Uri = '/project-assets/custom-tex-1';
		const tex = fakeTexture('p20-bytes-A');
		const loader = vi.fn(async (uri: string) => {
			expect(uri).toBe(p20Uri);
			return tex;
		});
		const scope = scopeWith(loader, 'project-a@v1');
		const result = await loadEffectiveTextures(
			{
				catalogue: 'plaster-warm',
				slotUris: { map: p20Uri },
				roughness: 0.9,
				metalness: 0,
				color: '#ffffff',
				defaultTileSizeMeters: [1, 1],
				variantSeed: 'vP20A'
			},
			scope
		);
		expect(result.status).toBe('ready');
		expect(loader).toHaveBeenCalledTimes(1);
		expect(loader).toHaveBeenCalledWith(p20Uri);
	});

	it('texture override on a built-in model uses the supplied resolver', async () => {
		const overrideUri = '/project-assets/override-1';
		const tex = fakeTexture('override-bytes');
		const loader = vi.fn(async () => tex);
		const scope = scopeWith(loader, 'project-a@v1');
		const effective = {
			catalogue: 'plaster-warm' as const,
			slotUris: { map: overrideUri },
			roughness: 0.9,
			metalness: 0,
			color: '#ffffff',
			defaultTileSizeMeters: [1, 1] as [number, number],
			variantSeed: 'vOVERRIDE1'
		};
		const loaded = await loadEffectiveTextures(effective, scope);
		expect(loaded.status).toBe('ready');
		expect(loader).toHaveBeenCalledWith(overrideUri);

		const group = new Group();
		group.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial()));
		const { acquiredKey } = remapModelMaterials(group, effective, [1, 1], scope);
		expect(acquiredKey.scopeId).toBe('project-a@v1');
		const mesh = group.children[0] as Mesh;
		const material = mesh.material as MeshStandardMaterial;
		expect(material.map).toBeDefined();
		releaseModelMaterialRemap(acquiredKey, scope);
	});

	it('colliding logical URIs in two releases do not share textures', async () => {
		const uri = '/project-assets/shared-logical';
		const texA = fakeTexture('bytes-A');
		const texB = fakeTexture('bytes-B');
		const loaderA = vi.fn(async () => texA);
		const loaderB = vi.fn(async () => texB);
		const scopeA = scopeWith(loaderA, 'project-a@v1');
		const scopeB = scopeWith(loaderB, 'project-b@v9');
		const effective = {
			catalogue: 'plaster-warm' as const,
			slotUris: { map: uri },
			roughness: 0.9,
			metalness: 0,
			color: '#ffffff',
			defaultTileSizeMeters: [1, 1] as [number, number],
			variantSeed: 'vSHARED'
		};
		const [a, b] = await Promise.all([
			loadEffectiveTextures(effective, scopeA),
			loadEffectiveTextures(effective, scopeB)
		]);
		expect(a.status).toBe('ready');
		expect(b.status).toBe('ready');
		expect(loaderA).toHaveBeenCalledTimes(1);
		expect(loaderB).toHaveBeenCalledTimes(1);
		if (a.status === 'ready' && b.status === 'ready') {
			expect(a.maps.map).toBe(texA);
			expect(b.maps.map).toBe(texB);
			expect(a.maps.map).not.toBe(b.maps.map);
		}
		const variantA = acquireEffectiveVariant(effective, 1, 1, 0, scopeA);
		const variantB = acquireEffectiveVariant(effective, 1, 1, 0, scopeB);
		expect(variantA).not.toBe(variantB);
		expect(variantA.map?.uuid).not.toBe(variantB.map?.uuid);
		releaseEffectiveVariant(effective.variantSeed, 1, 1, 0, scopeA);
		releaseEffectiveVariant(effective.variantSeed, 1, 1, 0, scopeB);
		// Extra releases are idempotent.
		releaseEffectiveVariant(effective.variantSeed, 1, 1, 0, scopeA);
	});

	it('shipped-static registry is checked in, versioned, and present on disk', () => {
		expect(SHIPPED_STATIC_REGISTRY_VERSION).toBe(1);
		expect(isAllowedShippedTextureUri('/textures/plaster-warm/map.png')).toBe(true);
		expect(isAllowedShippedTextureUri('/textures/wall-detail.webp')).toBe(false);
		expect(getShippedMaterialById('plaster-warm')?.textureUris).toContain(
			'/textures/plaster-warm/map.png'
		);
		expect(getShippedModelByAssetId('paris-grand-piano')?.productionFile).toBe(
			'/museum/models/piano/grand-piano.glb'
		);
		// Fallback-only placeholders resolve as known assets with no bytes.
		expect(getShippedModelByAssetId('paris-writing-desk')?.fallbackOnly).toBe(true);

		const testDir = dirname(fileURLToPath(import.meta.url));
		const staticRoot = resolve(testDir, '../../../static');
		for (const uri of listShippedTextureUris()) {
			expect(existsSync(resolve(staticRoot, uri.slice(1))), uri).toBe(true);
		}
		for (const file of listShippedModelFiles()) {
			expect(existsSync(resolve(staticRoot, file.slice(1))), file).toBe(true);
		}
	});

	it('catalogue-implied dependencies validate without P20 bytes (drift-proof)', () => {
		const issues = validateColdReleaseReferences(
			{
				scene: {
					textures: [],
					materials: [],
					entities: [{ kind: 'primitive', materialId: 'plaster-warm', materialInstanceId: null }]
				},
				manifest: { releaseId: 'r1', bytesByUri: new Map() }
			}
		);
		expect(issues).toEqual([]);
	});

	it('release reference validation rejects session-local, unknown, and missing sources', () => {
		const bytes = new Map<string, ReleaseBytesEntry>();
		expect(
			validateColdReleaseReferences({
				scene: {
					textures: [{ id: 't1', name: 'Local', uri: '/local/abcdef123456/albedo.png' }],
					materials: [],
					entities: []
				},
				manifest: { releaseId: 'r1', bytesByUri: bytes }
			}).length
		).toBeGreaterThan(0);
		expect(
			validateColdReleaseReferences({
				scene: {
					textures: [{ id: 't1', name: 'Mystery', uri: '/textures/mystery-pack/map.png' }],
					materials: [],
					entities: []
				},
				manifest: { releaseId: 'r1', bytesByUri: bytes }
			}).length
		).toBeGreaterThan(0);
		expect(
			validateColdReleaseReferences({
				scene: {
					textures: [{ id: 't1', name: 'Missing', uri: '/project-assets/gone' }],
					materials: [],
					entities: []
				},
				manifest: { releaseId: 'r1', bytesByUri: bytes }
			}).length
		).toBeGreaterThan(0);
		expect(
			validateColdReleaseReferences({
				scene: {
					textures: [{ id: 't1', name: 'Data', uri: 'data:image/png;base64,AAAA' }],
					materials: [],
					entities: []
				},
				manifest: { releaseId: 'r1', bytesByUri: bytes }
			}).length
		).toBeGreaterThan(0);
	});

	it('composes an empty project store-free and disposes cleanly', () => {
		setDefaultTextureSourceLoader(null);
		const project = createEmptyProject({ id: 'project:cold-a', name: 'Cold A' });
		const bundle = composeColdReleaseBundle({
			projectId: project.id,
			projectName: project.name,
			layout: project.layout,
			scene: project.scene,
			manifest: { releaseId: `${project.id}@v1`, bytesByUri: new Map() }
		});
		expect(bundle.graph.navigationNodes).toHaveLength(0);
		expect(bundle.textureScope.resolveTexture('/textures/plaster-warm/map.png')).toBe(
			'/textures/plaster-warm/map.png'
		);
		expect(bundle.textureScope.resolveTexture('/project-assets/missing')).toBeNull();
		bundle.dispose();
		bundle.dispose();
		expect(bundle.textureScope.resolveTexture('/textures/plaster-warm/map.png')).toBeNull();
	});

	it('composes a P20-textured release from supplied bytes; missing bytes fail closed', () => {
		const project = createEmptyProject({ id: 'project:cold-b', name: 'Cold B' });
		const uri = '/project-assets/pinned-1';
		const scene = {
			...project.scene,
			textures: [{ id: 'tex-1', name: 'Pinned', uri }]
		};
		const bytes = new Map<string, ReleaseBytesEntry>([
			[uri, { bytes: new Uint8Array([137, 80, 78, 71]), mime: 'image/png' }]
		]);
		const bundle = composeColdReleaseBundle({
			projectId: project.id,
			projectName: project.name,
			layout: project.layout,
			scene,
			manifest: { releaseId: `${project.id}@v3`, bytesByUri: bytes }
		});
		expect(bundle.textureScope.objectUrlByUri.has(uri)).toBe(true);
		bundle.dispose();

		expect(() =>
			composeColdReleaseBundle({
				projectId: project.id,
				projectName: project.name,
				layout: project.layout,
				scene,
				manifest: { releaseId: `${project.id}@v4`, bytesByUri: new Map() }
			})
		).toThrow(/missing release bytes/i);
	});

	it('failed scope creation releases partial URLs (no leak)', () => {
		const created: string[] = [];
		const revoked: string[] = [];
		const originalCreate = URL.createObjectURL;
		const originalRevoke = URL.revokeObjectURL;
		URL.createObjectURL = vi.fn(() => {
			const url = `blob:test/${created.length + 1}`;
			created.push(url);
			return url;
		});
		URL.revokeObjectURL = vi.fn((url: string) => {
			revoked.push(url);
		});
		try {
			expect(() =>
				createReleaseTextureScope({
					releaseId: 'r-fail',
					bytesByUri: new Map<string, ReleaseBytesEntry>([
						['/project-assets/ok', { bytes: new Uint8Array([1, 2, 3]), mime: 'image/png' }],
						['/project-assets/empty', { bytes: new Uint8Array(0), mime: 'image/png' }]
					])
				})
			).toThrow(/no bytes/i);
			expect(created).toHaveLength(1);
			expect(revoked).toEqual(created);
		} finally {
			URL.createObjectURL = originalCreate;
			URL.revokeObjectURL = originalRevoke;
		}
	});

	it('scope dispose revokes URLs and is idempotent', () => {
		const revoked: string[] = [];
		const originalRevoke = URL.revokeObjectURL;
		URL.revokeObjectURL = vi.fn((url: string) => {
			revoked.push(url);
		});
		try {
			const scope = createReleaseTextureScope({
				releaseId: 'r-dispose',
				bytesByUri: new Map<string, ReleaseBytesEntry>([
					['/project-assets/a', { bytes: new Uint8Array([1]), mime: 'image/png' }]
				])
			});
			const url = scope.resolveTexture('/project-assets/a');
			expect(url?.startsWith('blob:')).toBe(true);
			scope.dispose();
			scope.dispose();
			expect(revoked).toHaveLength(1);
			expect(scope.resolveTexture('/project-assets/a')).toBeNull();
		} finally {
			URL.revokeObjectURL = originalRevoke;
		}
	});
});
