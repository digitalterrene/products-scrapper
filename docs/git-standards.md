# Git Engineering Non-Negotiables & Repository Hygiene

All engineers and automated AI agents contributing to **Products Scrapper** must follow these repository standards.

---

## 1. Branching Strategy

All changes are developed on short-lived branches cut from `main`.

| Prefix | Usage | Example |
|---|---|---|
| `feat/` | New scraping capabilities or CLI flags | `feat/scraper-pagination-support` |
| `fix/` | Bug fixes in parsing, URL normalization, or CSV export | `fix/images-sanitize-query-params` |
| `refactor/` | Internal restructuring without behavior changes | `refactor/modules-unify-functions` |
| `docs/` | Architecture docs, diagrams, ADRs, or runbooks | `docs/architecture-add-er-diagrams` |
| `chore/` | Dependency updates, `.gitignore`, or tooling | `chore/deps-update-axios` |

---

## 2. Atomic Conventional Commits & Chain-of-Thought (CoT)

Every commit isolates a single logical change and follows Conventional Commits:

```text
<type>(<scope>): <imperative summary>

[Optional body: Root cause, alternatives considered, and verification proof]

[Optional footer: Closes #123, BREAKING CHANGE: ...]
```

**Approved Types:** `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `chore`.

---

## 3. Pre-Commit Verification Gates

Before pushing or opening a PR:
- **Syntax Check**: `npm run check` (`index.js` and `server.js`) and all files under `functions/` exit with code `0`.
- **API Contract Sync**: Any change to routes, request payloads, or response fields in `server.js` must be reflected in [`docs/api/openapi.json`](./api/openapi.json) and [`docs/api/README.md`](./api/README.md).
- **Hygiene Audit**: `npm run audit:hygiene` reports zero missing governance or `.gitignore` issues.
- **Secret & Artifact Check**: `git diff --cached` contains no `.env` files, private keys, downloaded `images/`, or unintended scraped CSV rows.

---

## 4. Credential & Secret Protection

- Never commit `.env`, `.env.*`, `*.pem`, `*.key`, or credential JSON files.
- Keep target-site authentication headers or proxy credentials in environment variables excluded by `.gitignore`.
- Document any future environment variable keys in `.env.example` without real values.

---

## 5. Pull Request Completeness

Every PR must document:
- **Problem Statement**: Issue or requirement being solved.
- **Technical Approach**: Module, selector, or pipeline changes made.
- **Proof of Verification**: Terminal output from syntax checks, tests, or dry-run logs.
- **Breaking Changes**: Any changes to CSV column headers, `props` keys, or module exports.
