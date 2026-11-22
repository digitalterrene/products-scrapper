# ADR-004: Expose Local REST API with Built-In Swagger UI for Interactive Testing

- **Status**: Accepted
- **Date**: 2026-11-22
- **Authors**: Digital Terrene Engineering
- **Deciders**: Core Maintainers
- **Technical Story**: Interactive API documentation and zero-client endpoint testing (`server.js`, `docs/api/openapi.json`)

---

## 1. Context & Problem Statement

Previously, **Products Scrapper** could only be invoked by manually editing hardcoded variables in `index.js` and executing `node index.js`. Testing CSS selectors or verifying link extraction required repeated code edits, and there was no interactive way for developers to test scraping stages without installing external REST clients such as Postman or Thunder Client.

---

## 2. Decision

We adopt **Express** and **`swagger-ui-express`** backed by a declarative **OpenAPI 3.0.3** specification (`docs/api/openapi.json`) served at `GET /docs`.

Implementation details:
- [`index.js`](../../index.js) exports its core scraping functions and guards CLI auto-execution with `if (require.main === module)`, preserving full backward compatibility for `node index.js`.
- [`server.js`](../../server.js) exposes 5 REST endpoints (`/api/health`, `/api/scrape/links`, `/api/scrape/details`, `/api/scrape/run`, `/api/results`) and mounts Swagger UI at `/docs` with pre-populated request examples.
- `swagger-ui-express` serves Swagger UI assets locally from `node_modules`, so interactive testing works even in offline or restricted environments.

---

## 3. Consequences

### Positive Impacts
- **Zero-Client Developer Experience**: Engineers can test link discovery, selector dry-runs (`downloadImages: false`), and capped pipeline runs (`maxProducts`) directly in the browser at `http://localhost:3000/docs`.
- **Contract-First Documentation**: `docs/api/openapi.json` serves as both human-readable interactive docs and a machine-readable schema.
- **No Code Duplication**: `server.js` reuses the exact core primitives exported by `index.js`.

### Negative Impacts & Operational Costs
- **Additional Dependencies**: Adds `express` and `swagger-ui-express` to `package.json`.
- **Local Binding Surface**: `server.js` is intended for local developer use; deploying it to a public network requires adding authentication, rate limiting, and SSRF origin allowlists.

### Risks and Mitigations
- **Risk**: Arbitrary file path access via `csvFilePath` or `file` query parameter.
- **Mitigation**: `resolveSafeCsvPath()` strips directory segments via `path.basename()` and enforces a `.csv` extension restricted to the repository root.

---

## 4. Alternatives Considered & Disqualification Rationale

### Option A: Static Markdown Docs + Postman Collection
- *Pros*: Zero runtime dependencies.
- *Cons*: Requires developers to install and import collections into Postman/Thunder Client, failing the goal of built-in browser testing.

### Option B: Swagger UI via External CDN in a Raw `http` Server
- *Pros*: Fewer npm packages.
- *Cons*: Breaks in offline/air-gapped environments and adds boilerplate for routing, JSON body parsing, and error handling.
