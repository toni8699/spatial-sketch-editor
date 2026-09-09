import { describe, expect, it } from 'vitest';
import { classifyRights, gateApproved } from '../../../assets-source/pipeline/provenance';

describe('classifyRights (P24A.0 rights gate evidence)', () => {
  it('approves CC0 evidence with no conditions (A)', () => {
    const result = classifyRights({
      sourceUrl: 'https://polyhaven.com/a/sofa_03',
      sourceProvider: 'Poly Haven',
      assetOrPackId: 'sofa_03',
      licenseId: 'CC0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      commercialUse: true,
      derivatives: true,
      redistribution: true,
      attributionRequired: false,
      acquiredAt: '2026-09-09'
    });
    expect(result).toEqual({ decision: 'approve', confidence: 'A' });
    expect(gateApproved(result)).toBe(true);
  });

  it('approves CC-BY evidence with recorded attribution conditions (B)', () => {
    const result = classifyRights({
      sourceUrl: 'https://sketchfab.com/3d-models/grand-piano-371090c279ff4e77a59acdebc25b5892',
      sourceProvider: 'Sketchfab',
      assetOrPackId: 'grand-piano-371090c279ff4e77a59acdebc25b5892',
      licenseId: 'CC BY 4.0',
      author: ['farhad.Guli'],
      commercialUse: true,
      derivatives: true,
      redistribution: true,
      attributionRequired: true,
      attributionText: 'Grand Piano by farhad.Guli, licensed under CC BY 4.0.',
      acquiredAt: '2026-09-09',
      sourceHash: '09627e34106e4e558bc9785f129fe9cb82e1fa5722613a8186dbd64cc6778e39'
    });
    expect(result).toEqual({ decision: 'approve-with-conditions', confidence: 'B' });
    expect(gateApproved(result)).toBe(true);
  });

  it('sends attribution-required-but-unrecorded to manual review (C)', () => {
    const result = classifyRights({
      sourceUrl: 'https://example.com/model',
      sourceProvider: 'Example',
      assetOrPackId: 'model-1',
      licenseId: 'CC-BY-3.0',
      commercialUse: true,
      derivatives: true,
      redistribution: true,
      attributionRequired: true,
      acquiredAt: '2026-09-09'
    });
    expect(result.decision).toBe('manual-review');
    expect(result.confidence).toBe('C');
    expect(gateApproved(result)).toBe(false);
  });

  it('rejects missing license identity (D) — never silently Approved', () => {
    const result = classifyRights({
      sourceUrl: 'https://example.com/model',
      sourceProvider: 'Example',
      assetOrPackId: 'model-1',
      acquiredAt: '2026-09-09'
    });
    expect(result.decision).toBe('reject');
    expect(result.confidence).toBe('D');
    expect(gateApproved(result)).toBe(false);
  });

  it('rejects unresolved or forbidding terms (C/D)', () => {
    const unresolved = classifyRights({
      sourceUrl: 'https://example.com/model',
      sourceProvider: 'Example',
      assetOrPackId: 'model-1',
      licenseId: 'CC0',
      commercialUse: 'unknown',
      redistribution: true,
      attributionRequired: false,
      acquiredAt: '2026-09-09'
    });
    expect(unresolved.confidence).toBe('C');
    expect(gateApproved(unresolved)).toBe(false);

    const forbidding = classifyRights({
      sourceUrl: 'https://example.com/model',
      sourceProvider: 'Example',
      assetOrPackId: 'model-1',
      licenseId: 'CC-NC',
      commercialUse: true,
      derivatives: true,
      redistribution: false,
      attributionRequired: false,
      acquiredAt: '2026-09-09'
    });
    expect(forbidding).toEqual({
      decision: 'reject',
      confidence: 'D',
      reason: 'rights forbid bundled redistribution'
    });
    expect(gateApproved(forbidding)).toBe(false);
  });
});
