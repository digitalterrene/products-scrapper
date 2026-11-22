# Contributing to Products Scrapper

Thank you for contributing to **Products Scrapper**. Following these engineering standards keeps the scraper reliable, secure, and easy to maintain for both human engineers and AI coding agents.

---

## 1. Code of Conduct

We are committed to maintaining a respectful, inclusive, and constructive engineering environment for all contributors.

---

## 2. Engineering Non-Negotiables

Before opening a Pull Request, review [docs/git-standards.md](./docs/git-standards.md).

**Core Rules:**
1. **Branch Naming**: Cut branches from `main` using `feat/<scope>-<desc>`, `fix/<scope>-<desc>`, `refactor/<scope>-<desc>`, `docs/<scope>-<desc>`, or `chore/<scope>-<desc>`.
2. **Conventional Commits**: Every commit message must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification (`<type>(<scope>): <imperative summary>`).
3. **Chain-of-Thought (CoT)**: Document root causes, trade-offs, and verification notes in the commit body for non-trivial changes.
4. **Zero Secrets & Clean Diffs**: Never commit `.env` files, API credentials, downloaded `images/`, or large scraped datasets.

---

## 3. Local Development Workflow

1. Clone the repository and create a feature branch:
   ```bash
   git checkout -b feat/scraper-add-retry-backoff
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Make atomic, well-scoped changes.
4. Run verification checks before committing:
   ```bash
   # Syntax verification
   node --check index.js
   node --check functions/fetchPage.js
   node --check functions/scrapeLinksInDivs.js
   node --check functions/scrapeDetailsFromPage.js
   node --check functions/saveToCsv.js

   # Repository hygiene audit
   node .agents/skills/senior-repo-standards/scripts/audit-hygiene.js
   ```

---

## 4. Architectural Changes & ADRs

If your change alters the scraping runtime (e.g., adding Playwright/Puppeteer), changes persistence formats (e.g., CSV to SQLite/PostgreSQL), or restructures module boundaries:
1. Review [docs/architecture/](./docs/architecture/).
2. Add a new Architecture Decision Record in [docs/adr/](./docs/adr/) using [ADR-000-template.md](./docs/adr/ADR-000-template.md) and update [docs/adr/README.md](./docs/adr/README.md).

---

## 5. Submitting a Pull Request

1. Rebase onto the latest `main`:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
2. Push your branch and open a PR using the [Pull Request Template](./.github/PULL_REQUEST_TEMPLATE.md).
3. Attach verification evidence (syntax check output, hygiene score, or sample run logs).
