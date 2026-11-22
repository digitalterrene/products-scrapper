# ADR-003: Consolidate Monolithic `index.js` and `functions/` Modules

- **Status**: Proposed
- **Date**: 2026-11-22
- **Authors**: Digital Terrene Engineering
- **Deciders**: Core Maintainers
- **Technical Story**: Eliminating behavioral drift between `index.js` and `functions/*`

---

## 1. Context & Problem Statement

Currently, the repository maintains two separate implementations of its core scraping functions:
1. **`index.js`**: Defines `fetchPage`, `scrapeLinksInDiv`, `scrapeDetailsFromPage`, `downloadImage`, and `saveToCsv` inline, including relative URL normalization, local image downloading, and conditional CSV header writing.
2. **`functions/`**: Exports standalone modules (`fetchPage.js`, `scrapeLinksInDivs.js`, `scrapeDetailsFromPage.js`, `saveToCsv.js`) that are not imported by `index.js` and diverge in behavior (no relative URL resolution, URL-only images without downloading, unconditional `append: true`).

Maintaining duplicate implementations creates maintenance drift and confuses contributors and AI agents about which files are authoritative.

---

## 2. Decision

We propose making `functions/` (or `src/`) the **single source of truth** for all scraping primitives, adding `functions/downloadImage.js`, and refactoring `index.js` to be a thin CLI orchestrator that imports from `functions/`.

Target module layout:
- `functions/fetchPage.js`: HTTP fetch + Cheerio loader (with configurable timeout/headers).
- `functions/scrapeLinksInDivs.js`: Link extraction with `new URL(link, baseUrl).href` resolution.
- `functions/downloadImage.js`: Safe image streaming with sanitized filenames.
- `functions/scrapeDetailsFromPage.js`: Detail extraction with an optional `{ downloadImages: boolean }` flag.
- `functions/saveToCsv.js`: CSV export checking both file existence and non-zero file size (`stat.size > 0`) before suppressing headers.
- `index.js`: Loads configuration and invokes the modular pipeline.

---

## 3. Consequences

### Positive Impacts
- **Single Source of Truth**: Eliminates duplicated logic and behavioral drift.
- **Unit Testability**: Each module in `functions/` can be unit-tested in isolation with mocked HTTP responses.
- **Reusability**: Both local image downloading and URL-only scraping are supported via a clean option flag.

### Negative Impacts & Operational Costs
- **Minor Refactor Effort**: Requires updating `functions/*` and wiring imports in `index.js` with regression verification.

### Risks and Mitigations
- **Risk**: Breaking scripts that currently import `functions/*` expecting URL-only image behavior.
- **Mitigation**: Default `downloadImages` to `false` in `scrapeDetailsFromPage` (preserving backward compatibility) and pass `{ downloadImages: true }` from `index.js`.

---

## 4. Alternatives Considered & Disqualification Rationale

### Option A: Delete `functions/` and Keep Everything in `index.js`
- *Pros*: Simplest immediate cleanup.
- *Cons*: Reduces modularity and makes isolated unit testing harder as features (pagination, retries, rate limiting) are added.

### Option B: Leave Both Implementations As-Is
- *Pros*: Zero code changes.
- *Cons*: Guarantees continued drift and confusion for maintainers.
