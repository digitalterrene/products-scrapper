# ADR-002: Export Structured Data to Quoted CSV with Local Image Streaming

- **Status**: Accepted
- **Date**: 2026-11-22
- **Authors**: Digital Terrene Engineering
- **Deciders**: Core Maintainers
- **Technical Story**: Output persistence design (`downloadImage`, `saveToCsv`)

---

## 1. Context & Problem Statement

Scraped product catalogs are typically consumed by spreadsheets (Excel, Google Sheets), e-commerce importers (Shopify, WooCommerce), or downstream ETL scripts. Product descriptions frequently contain commas, quotes, and multi-paragraph text, while product images must be archived locally rather than relying on hotlinking remote URLs that may expire.

---

## 2. Decision

We adopt **`csv-writer` (`^1.6.0`)** with `alwaysQuote: true` for tabular data export to `scraped_data.csv`, paired with **Node.js `fs.createWriteStream`** for streaming product images directly to `./images/`.

Implementation details:
- `saveToCsv()` checks `fs.existsSync(csvFilePath)` and enables `append` mode when the output file already exists.
- `downloadImage()` pipes `axios({ url, responseType: "stream" })` directly to disk to avoid buffering large binary payloads in RAM.
- Image downloads for a single product execute concurrently via `Promise.all`, and resulting local paths are stored as a comma-separated string in the `Images` column.

---

## 3. Consequences

### Positive Impacts
- **Universal Compatibility**: Quoted CSV imports cleanly into spreadsheets and e-commerce platforms without schema setup or database servers.
- **Memory-Safe Binary Downloads**: Streaming image bytes directly to disk prevents Node.js heap spikes on high-resolution assets.
- **Incremental Runs**: Append mode preserves previously scraped rows across multiple runs.

### Negative Impacts & Operational Costs
- **Flat Schema Limitations**: Multiple images per product are serialized into a single comma-delimited string rather than a normalized child table.
- **Empty File Header Edge Case**: Because `fs.existsSync()` returns `true` for a 0-byte `scraped_data.csv`, `append: true` suppresses writing the CSV header row unless the empty file is removed first.

### Risks and Mitigations
- **Risk**: Filename collisions or invalid Windows characters from URL query strings in `path.basename(url)`.
- **Mitigation**: Documented in [Data Model](../architecture/data-model.md) and [Incident Response](../runbooks/incident-response.md); future enhancement should sanitize `new URL(url).pathname` and prefix with a product slug or hash.

---

## 4. Alternatives Considered & Disqualification Rationale

### Option A: JSON Lines (`.jsonl`)
- *Pros*: Preserves nested arrays natively (e.g., `images: string[]`) and streams cleanly.
- *Cons*: Not directly openable in Excel/Google Sheets by non-technical stakeholders without a conversion step.

### Option B: SQLite Database
- *Pros*: Normalized relational tables, deduplication via unique constraints on `url`.
- *Cons*: Adds native binary compilation overhead (`better-sqlite3` / `sqlite3`) and extra tooling to inspect results.
