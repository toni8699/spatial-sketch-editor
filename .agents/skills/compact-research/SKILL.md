---
name: compact-research
description: Compact verbose LLM research Markdown into dense reference-grade context artifacts without losing substantive material. Invoke for requests like "compact this research markdown", "normalize this research doc", "make research LLM-context friendly", "compress without losing research", or "deduplicate research without summarizing".
---

# Compact Research

Compression and normalization, **not summarization**.

## When to use

- User points at a long/deep-research Markdown file or pastes verbose research and asks to compact, normalize, densify, deduplicate, or make it LLM-context friendly.
- Source contains findings, architecture analysis, technical details, recommendations, repos, citations/URLs, benchmarks, tables/matrices, code/API/types, fixtures, caveats, rejections, open questions.
- Goal is a smaller, navigable, high-retrieval knowledge-base artifact preserving effectively all decision-useful content.

## When NOT to use

- User explicitly wants a summary, TL;DR, executive-summary-only, or information removed.
- Source is not research (e.g. narrative prose, fiction, meeting notes needing minutes style) — ask instead.
- User asks for new research, updated versions, or reinterpretation — out of scope unless explicitly requested to repair structure.

## Core invariants

1. **Target wording and redundancy, never research depth.** Delete filler, transitions, rhetorical setup, restated questions, essay prose, generic explanation implied by technical content. Keep every unique finding, qualifier, caveat, disagreement, uncertainty, assumption, number, version, license, name, path, URL, edge case, rejection, open question, recommendation.
2. **Reconstruction test.** An item counts as preserved only if a future agent using the compact artifact alone can recover the same decision, relationship, test assertion, implementation constraint, or implication without the original prose. Preserving the "general idea" is insufficient.
3. **Source-only.** Use only the source document. Do not add facts from memory, update versions, reconcile contradictions, or "improve" conclusions. Neutral labels/headings to organize are allowed. Preserve uncertainty as-is; distinguish sourced claims from author inference/recommendation when the source does.
4. **No false losslessness.** Never claim "nothing was lost", "all context preserved", "100% preserved", or call rewritten wording "verbatim". Allowed only after real checks: "field-level audit passes", "all substantive source items accounted for", "exact inputs/outputs/invariants preserved in compressed syntax". State inferences as inferences (e.g. do not expand `3m→4m` into `+1m` unless source says it).
5. **Overflow, don't drop.** If material does not fit the structure, put it under `Additional Findings / Raw Notes`. Never delete to hit a size target.

## Workflow (three passes)

### Pass 1 — Inventory (before rewriting)

Extract and hold:

- findings/claims, named projects/products/companies/models/tools, URLs/sources with owning claim, numeric facts (benchmarks, versions, LOC, counts, thresholds, zoom/tolerance values), tables/matrices + their columns, code/API/type/pseudocode blocks, test fixtures/examples, recommendations, rejected/deferred options, caveats/confidence, unresolved questions, plus every substantive enumeration (member lists) and every protected token (field/flag/filename/path/ID/endpoint/status/format) for closure audit.

### Pass 2 — Compact + reorganize by concept

- Reorganize by concept, not source order. Preferred headings (adapt as needed): Thesis/direction; Executive findings; Key concepts/definitions; Current state/SOTA; Relevant projects/implementations; Technical approaches; Comparisons/tradeoffs; Evidence/benchmarks; Concrete tests/fixtures; Product implications; Risks/limitations/unresolved; Recommendations; Source/reference index; Research inventory/loss audit.
- Prefer dense bullets, tables, matrices, short factual blocks. Fragments over prose where meaning stays clear. Merge duplicates per deduplication rule below.

### Pass 3 — Loss audit

Verify against inventory + original section-by-section:

- [ ] every original section accounted for
- [ ] every table/matrix dimension retained (see below)
- [ ] every named project/tool retained
- [ ] every source/link retained and attached to its claim
- [ ] every quantitative fact retained
- [ ] every concrete fixture retained with inputs/outputs/invariants/edges (see below)
- [ ] every enumeration has member-level coverage; no umbrella substitution (see enumeration closure)
- [ ] every protected token preserved or explicitly mapped (see protected-token audit)
- [ ] every rejection/defer decision retained
- [ ] every caveat + unresolved question retained
- [ ] no invented citations; no silent conclusion changes

## Preservation rules

### Structured data (tables/matrices)

- Every meaningful cell is content. May reformat, merge overlapping tables (merge columns, never drop dimensions), or convert to dense structured bullets — but every relationship must stay reconstructable.
- Never collapse away dimensions such as: reference/source, reusable candidate, complexity, risk, license, score, priority, status, bucket, rationale, verdict.
- Example — original row `Intersection snap | LibreCAD | own/Flatten | Medium | Low | P23 Minimum` must survive with all five relations, e.g. `intersection (LibreCAD | own/Flatten | M | Low) → P23 MINIMUM` or equivalent row. A bare `intersection → P23 MINIMUM` fails audit.

### Preserve enumeration and row-level granularity

- Never replace a concrete enumeration with an umbrella term when the members carry information. `polygon/vertex/material/object/animation counts` may not become `counts`.
- When compressing tables, every original row must remain reconstructable independently. Rows may be grouped only when shared fields are truly identical. Lift identical fields to a group header, but retain every non-identical cell value.
- Descriptive cells count as substantive when they encode category, intended use, behavior, appearance, semantics, constraints, or implementation implications. Do not shorten `Gallery/event hall neutral` to `Gallery neutral`, or drop `media plane child`, etc., merely because the broader idea survives.
- During loss audit, compare row × column values, not merely whether each column/category appears somewhere in the compact document.
- Reconstruction test: given any original table row or enumerated list, a future agent must be able to recreate all meaningful members/fields from the compact artifact alone. No abstraction substitution: preserving a parent concept does not prove its children were preserved. `counts`, `metadata`, `parameters`, `tests`, `rights`, `stats`, `fixtures`, `pipeline details`, etc. do not satisfy the audit when the source enumerated their specific members.

### Enumeration closure invariant

- Before rewriting, extract every substantive enumeration into the loss inventory. Examples: `node names, material names, animation names, extras`; `polygon, vertex, material, object, animation counts`; specific validation checks; specific metadata fields; named pipeline stages; supported/rejected entity lists.
- After rewriting, audit every enumeration member-by-member. Members may be syntactically compressed (`width/height/depth`), but every semantically distinct member must remain recoverable.
- A parent or umbrella term never satisfies preservation: `node/material/animation names + extras → names/extras = FAIL`; `polygon/vertex/material/object/animation counts → counts = FAIL`; `width/height/depth/border profile + media plane child → frame parameters = FAIL`.
- Do not mark the loss audit passed until every inventory enumeration has member-level coverage.

### Protected-token audit

- Identifiers that may matter to implementation receive special treatment: field names, type members, CLI flags, enum values, filenames, module names, paths, IDs, metadata keys, API endpoints, status names, named formats/extensions.
- Never replace several such tokens with a generic category unless the source explicitly treats them as interchangeable. `icon/planIcon` may not become `icons`; `resizable/deformable/texturable` may not become `resizable`; `-kn/-km/-ke` may not become `keep names`; `shelfElevations/shelfBoxes/dropOnTopElevation` may not become `shelf metadata`.

### Concrete tests / fixtures / worked examples

- Protected structured information. Never replace a fixture with its general lesson.
- For each, preserve where present: exact (or semantically equivalent, no added inference) input, operation/action, expected output, invariants, edge condition, failure behavior, purpose. A future agent must be able to re-assert the test from the compact artifact alone.
- Keep transformation/validation rules concrete: e.g. reverse rule `s' = L − s + L/R invert + handedness explicit`; split rule `before-k→w1, after-k→w2 offset s−k, crossing→reject/explicit, no orphan`.

### Provenance

- Keep URLs, citations, repo/file/module paths attached to the claims they support. Keep multiple independent sources for one finding. Never invent citations.

### Citation portability check

- Preserve all source markers exactly as written (URLs, cite/filecite-style handles, internal doc refs).
- If the source contains actual URLs, retain them verbatim (including query strings).
- If it contains only platform-local/opaque citation handles with no resolvable URL, flag `NON-PORTABLE CITATIONS` in the loss audit naming the affected claims; do not invent URLs to replace them.

### Deduplication

- Before deleting a repeat, check for a unique qualifier, number, example, source, caveat, detail, implication, edge case, or confidence delta. Merge all unique parts into one canonical statement.

### Technical fidelity

- Preserve architecture boundaries, ownership rules, data/state flow, operation semantics, type shapes, API/pseudocode contracts, validation/transformation rules, threading/worker decisions, migration constraints, performance assumptions. Compact syntax, not depth.

## Output format

- Dense technical research notes / knowledge-base entry. Short headings, compact tables, semicolon-heavy structured bullets. Minimal narrative. No blog/essay/conversational style, no motivational filler, no executive-summary-only.
- As short as safely possible while keeping every reconstructable item navigable and unambiguous. Density > casual readability, but relationships/tests/provenance/caveats must never disappear for token savings.
- Default: output the reorganized document. If asked to update a file, edit it in place and confirm changed locations briefly.

## Research Inventory (required tail section)

Compact list (not a duplicate of the doc):

- all named projects/products/tools/models/companies
- all source URLs
- all benchmarks/quantitative facts
- all unresolved questions
- original-matrix → compact-section mapping; test-family → compact-section mapping

## Failure modes / anti-patterns

- Summarizing away examples, caveats, or rejections because they "seem repetitive".
- Collapsing a matrix to a category list and dropping score/risk/source/bucket columns.
- Replacing a fixture (`6m wall, opening@4m, split@3m → offset 1m, one transaction`) with "split transfers openings deterministically".
- Adding inferred quantities (`end deterministic` → `end at +1m`) or updated versions from memory.
- Claiming "verbatim" for rewritten text or "nothing was lost" without completing the Pass 3 checklist.
- Reorganizing chronologically instead of conceptually; leaving findings scattered across old answer order.

## Example

Verbose source:

> "For snapping, LibreCAD has a lot of options like grid and endpoint. For your museum product, you probably only need a small set at first. Things like grid, endpoint, midpoint, intersection, and projecting onto walls would cover most needs."

Plus table row:

> `| Intersection snap | LibreCAD | own / Flatten | Medium | Low | P23 Minimum |`

Plus fixture:

> "Take a wall of 6m with an opening centered at 4m. If you split the wall at 3m, the opening should end up on the second wall with a 1m offset, the old reference should be gone, and it should all happen in one transaction."

Correct compact normalization (fields preserved):

> - Snap v1 (LibreCAD ref, do not clone full set): `grid, endpoint/corner, midpoint, intersection, nearest-on-wall, orthogonal, opening-edge (when editing openings)`.
> - `intersection (LibreCAD | own/Flatten | M | Low) → P23 MINIMUM`.
> - Split: `wall 6m, opening center 4m, split@3m → second wall offset=1m (4−3); source ref gone; new ref valid; one transaction; crossing-split→reject/explicit; no orphan`.

Wrong (fails audit): `Snapping should cover basics. Splits transfer openings deterministically.` — drops source, candidate, complexity/risk/bucket, exact inputs/outputs/edge.
