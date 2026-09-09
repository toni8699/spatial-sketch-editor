import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

// Regression fixture for the P24A.1 normalization job (evidence spike, R1).
// Gated on tool availability: sh + shasum + the pinned CLI + the piano source
// fixture. Skips (rather than fails) where the pipeline toolchain is absent.
const editorRoot = path.resolve(__dirname, '..', '..', '..');
const repoRoot = path.resolve(editorRoot, '..', '..');
const script = path.join(editorRoot, 'assets-source', 'pipeline', 'normalize-asset.sh');
const cli = path.join(repoRoot, 'node_modules', '.bin', 'gltf-transform');
const piano = path.join(editorRoot, 'assets-source', 'models', 'grand-piano.glb');

function hasTools(): boolean {
  try {
    execSync('command -v sh shasum', { stdio: 'ignore' });
    return existsSync(script) && existsSync(cli) && existsSync(piano);
  } catch {
    return false;
  }
}

function runJob(args: string[], cwd: string): { status: number } {
  try {
    execFileSync('sh', [script, ...args], { cwd, stdio: 'pipe', timeout: 120000 });
    return { status: 0 };
  } catch (error: unknown) {
    const status = (error as { status?: number }).status;
    return { status: typeof status === 'number' ? status : 1 };
  }
}

function readProvenance(outdir: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path.join(outdir, 'provenance.json'), 'utf8'));
}

describe.runIf(hasTools())('normalize-asset.sh (P24A.1 pipeline fixture)', () => {
  it('produces identical content hashes on identical reruns', () => {
    const base = mkdtempSync(path.join(tmpdir(), 'p24a-rerun-'));
    const first = path.join(base, 'run1');
    const second = path.join(base, 'run2');
    expect(runJob([piano, 'furniture-floor', '0.032', first], repoRoot).status).toBe(0);
    expect(runJob([piano, 'furniture-floor', '0.032', second], repoRoot).status).toBe(0);
    const a = readProvenance(first);
    const b = readProvenance(second);
    expect(a.sourceSha256).toBe(b.sourceSha256);
    expect(a.contentSha256).toBe(b.contentSha256);
    expect(a.toolVersionActual).toBe('4.4.1');
    expect(a.recipe).toBe('furniture-floor');
    expect(a.recipeVersion).toBe(1);
    expect(typeof a.recipeHash).toBe('string');
    expect(a.unitScaleToMeters).toBe(0.032);
    expect(existsSync(path.join(first, 'model.glb'))).toBe(true);
    expect(existsSync(path.join(first, 'metrics.json'))).toBe(true);
  }, 240000);

  it('rejects unknown recipes and missing inputs without touching the destination', () => {
    const base = mkdtempSync(path.join(tmpdir(), 'p24a-reject-'));
    const dest = path.join(base, 'out');
    writeFileSync(path.join(base, 'sentinel.txt'), 'untouched');
    expect(runJob([piano, 'no-such-recipe', '0.032', dest], repoRoot).status).not.toBe(0);
    expect(runJob([path.join(base, 'missing.glb'), 'furniture-floor', '0.032', dest], repoRoot).status).not.toBe(0);
    expect(existsSync(dest)).toBe(false);
  }, 120000);

  it('leaves a pre-existing destination unchanged when normalization fails', () => {
    const base = mkdtempSync(path.join(tmpdir(), 'p24a-atomic-'));
    const dest = path.join(base, 'out');
    const corrupt = path.join(base, 'corrupt.glb');
    writeFileSync(corrupt, 'not a glb');
    mkdirSync(dest, { recursive: true });
    writeFileSync(path.join(dest, 'sentinel.txt'), 'untouched');
    expect(runJob([corrupt, 'furniture-floor', '0.032', dest], repoRoot).status).not.toBe(0);
    expect(readFileSync(path.join(dest, 'sentinel.txt'), 'utf8')).toBe('untouched');
    expect(existsSync(path.join(dest, 'model.glb'))).toBe(false);
  }, 120000);
});
