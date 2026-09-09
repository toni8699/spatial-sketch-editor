import { describe, expect, it } from 'vitest';

import {
	createEmptyProject,
	parseProjectJson,
	serializeProject
} from '$lib/project/project-codec';
import type { Project } from '$lib/project/project-types';
import { decodeProjectCompatible } from '$lib/content/scene-format';
import { identifySceneFormat } from '$lib/content/scene-format';

function validProject(): Project {
	return createEmptyProject({ id: 'project-test', name: 'Compat Fixture' });
}

function issueCodes(result: { success: boolean; issues?: Array<{ code: string }> }): string[] {
	return result.success ? [] : result.issues!.map((issue) => issue.code);
}

describe('scene format identification (P23.0a)', () => {
	it('identifies the recognized legacy scene shape', () => {
		const project = validProject();
		const identification = identifySceneFormat(project.scene);
		expect(identification.kind).toBe('recognized-legacy');
		if (identification.kind !== 'recognized-legacy') return;
		expect(identification.sceneSpace).toBe('legacy-room-local');
	});

	it('rejects any explicit scene formatVersion until the P23.0b decoder exists', () => {
		const project = validProject();
		const identification = identifySceneFormat({
			...project.scene,
			formatVersion: 1
		});
		expect(identification.kind).toBe('unrecognized');
		if (identification.kind !== 'unrecognized') return;
		expect(identification.reason).toBe('unsupported-format-version');
		expect(identification.issues[0]!.path).toBe('$.formatVersion');
	});

	it('rejects non-object scene payloads explicitly', () => {
		const identification = identifySceneFormat([1, 2, 3]);
		expect(identification.kind).toBe('unrecognized');
		if (identification.kind !== 'unrecognized') return;
		expect(identification.reason).toBe('invalid-json-payload');
	});

	it('keeps strict legacy scene validation as the recognized path', () => {
		const project = validProject();
		const identification = identifySceneFormat({ ...project.scene, units: 'feet' });
		expect(identification.kind).toBe('unrecognized');
		if (identification.kind !== 'unrecognized') return;
		expect(identification.reason).toBe('legacy-invalid');
	});
});

describe('project compatible decode (P23.0a)', () => {
	it('decodes a valid legacy project as legacy-compatible with room-local sceneSpace', () => {
		const decoded = decodeProjectCompatible(validProject());
		expect(decoded.kind).toBe('legacy-compatible');
		if (decoded.kind !== 'legacy-compatible') return;
		expect(decoded.sceneSpace).toBe('legacy-room-local');
		expect(decoded.report.issues).toEqual([]);
		expect(decoded.project.id).toBe('project-test');
	});

	it('decodes JSON round-trips of the legacy shape identically', () => {
		const project = validProject();
		const json = serializeProject(project);
		const parsed = parseProjectJson(json);
		expect(parsed.success).toBe(true);

		const decoded = decodeProjectCompatible(JSON.parse(json));
		expect(decoded.kind).toBe('legacy-compatible');
	});

	it('rejects mixed generations by name', () => {
		const project = validProject();
		const mixed = {
			...project,
			layout: {
				units: 'meters',
				formatVersion: 4,
				junctions: [],
				walls: [],
				rooms: [],
				openings: [],
				objects: []
			}
		};
		const decoded = decodeProjectCompatible(mixed);
		expect(decoded.kind).toBe('unrecognized');
		if (decoded.kind !== 'unrecognized') return;
		expect(decoded.reason).toBe('mixed-format-unsupported');
	});

	it('prefixes layout identification failures at their project path', () => {
		const project = validProject();
		const decoded = decodeProjectCompatible({
			...project,
			layout: { ...project.layout, units: 'feet' }
		});
		expect(decoded.kind).toBe('unrecognized');
		if (decoded.kind !== 'unrecognized') return;
		expect(decoded.reason).toBe('layout-unrecognized');
		expect(decoded.issues).toContainEqual(
			expect.objectContaining({ path: '$.layout.units', code: 'unsupported_units' })
		);
	});

	it('prefixes scene identification failures at their project path', () => {
		const project = validProject();
		const decoded = decodeProjectCompatible({
			...project,
			scene: { ...project.scene, formatVersion: 7 }
		});
		expect(decoded.kind).toBe('unrecognized');
		if (decoded.kind !== 'unrecognized') return;
		expect(decoded.reason).toBe('scene-unrecognized');
		expect(decoded.issues).toContainEqual(
			expect.objectContaining({ path: '$.scene.formatVersion', code: 'unsupported_format_version' })
		);
	});

	it('rejects unknown root keys and invalid ids explicitly', () => {
		const project = validProject() as unknown as Record<string, unknown>;
		project.extra = true;
		const unknownKey = decodeProjectCompatible(project);
		expect(unknownKey).toMatchObject({ kind: 'unrecognized', reason: 'invalid-payload' });

		const badId = decodeProjectCompatible({ ...validProject(), id: 'bad id!' });
		expect(badId).toMatchObject({ kind: 'unrecognized', reason: 'invalid-id' });
	});

	it('does not mutate its input', () => {
		const project = validProject();
		const before = JSON.stringify(project);
		decodeProjectCompatible(project);
		expect(JSON.stringify(project)).toBe(before);
	});
});

describe('P23.0a scaffolding guard', () => {
	it('adds no new-schema write path: legacy codec behavior is unchanged', () => {
		const project = validProject();
		// The strict project codec still validates the legacy shape only —
		// wall-first payloads must NOT pass it while writers are disabled.
		const wallFirstProject = {
			...project,
			layout: {
				units: 'meters',
				formatVersion: 4,
				junctions: [],
				walls: [],
				rooms: [],
				openings: [],
				objects: []
			}
		};
		expect(issueCodes(parseProjectJson(JSON.stringify(wallFirstProject)))).toContain(
			'unknown_key'
		);
	});
});
