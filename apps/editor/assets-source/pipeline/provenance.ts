/**
 * P24A.0 acquisition/provenance contract (disposable pipeline-side evidence,
 * P24 reconciliation R1). Pipeline-owned like the OBB spike: promote into a
 * real registry package only when R1 selects the canonical ingest seam.
 *
 * Structured rights evidence + the A/B/C/D gate from Phase 2 research:
 * unknown/unresolved rights can never silently promote to Approved.
 * Field shape follows `deep-research-exact-asset-compact.md` §2 verbatim so
 * manifest rows map onto it without reinterpretation.
 */

export type RightsConfidence = 'A' | 'B' | 'C' | 'D';

export type RightsEvidence = {
  sourceUrl: string;
  sourceProvider: string;
  assetOrPackId: string;
  licenseId: string;
  licenseUrl?: string;
  author?: string[];
  commercialUse: boolean | 'unknown';
  derivatives: boolean | 'unknown';
  redistribution: boolean | 'unknown';
  attributionRequired: boolean | 'unknown';
  attributionText?: string;
  termsUrl?: string;
  acquiredAt: string;
  sourceHash?: string;
  evidenceSnapshotHash?: string;
};

export type RightsGateResult =
  | { decision: 'approve' | 'approve-with-conditions'; confidence: 'A' | 'B' }
  | { decision: 'manual-review' | 'reject'; confidence: 'C' | 'D'; reason: string };

function isUnknown(value: boolean | 'unknown' | undefined): boolean {
  return value === undefined || value === 'unknown';
}

/**
 * Classify rights evidence. Returns the confidence plus the gate decision:
 * A approves, B approves with recorded conditions, C needs manual/legal
 * review, D is not suitable for the bundled library. Anything unresolved
 * lands in C or D — never Approved.
 */
export function classifyRights(evidence: Partial<RightsEvidence>): RightsGateResult {
  if (!evidence.sourceUrl || !evidence.sourceProvider || !evidence.assetOrPackId) {
    return { decision: 'reject', confidence: 'D', reason: 'missing source provenance' };
  }
  if (!evidence.licenseId) {
    return { decision: 'reject', confidence: 'D', reason: 'missing license identity' };
  }
  if (
    isUnknown(evidence.commercialUse) ||
    isUnknown(evidence.redistribution) ||
    isUnknown(evidence.attributionRequired)
  ) {
    return { decision: 'manual-review', confidence: 'C', reason: 'unresolved use/redistribution/attribution terms' };
  }
  if (evidence.commercialUse === false || evidence.redistribution === false) {
    return { decision: 'reject', confidence: 'D', reason: 'rights forbid bundled redistribution' };
  }
  if (evidence.attributionRequired === true && !evidence.attributionText) {
    return { decision: 'manual-review', confidence: 'C', reason: 'attribution required but text not recorded' };
  }
  if (evidence.attributionRequired === true) {
    return { decision: 'approve-with-conditions', confidence: 'B' };
  }
  return { decision: 'approve', confidence: 'A' };
}

/** Gate for promotion to Approved: only A passes silently, B with recorded conditions. */
export function gateApproved(result: RightsGateResult): boolean {
  return result.decision === 'approve' || result.decision === 'approve-with-conditions';
}
