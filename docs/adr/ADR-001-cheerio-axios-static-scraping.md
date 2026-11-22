# ADR-001: Use Axios and Cheerio for Static HTML Scraping

- **Status**: Accepted
- **Date**: 2026-11-22
- **Authors**: Digital Terrene Engineering
- **Deciders**: Core Maintainers
- **Technical Story**: Initial scraper architecture (`index.js`, `functions/fetchPage.js`)

---

## 1. Context & Problem Statement

**Products Scrapper** needs to fetch e-commerce catalog and product detail pages, query elements by CSS selectors, and extract text and image `src` attributes with minimal resource overhead and fast local setup.

We needed to choose between lightweight HTTP + DOM parsing (`axios` + `cheerio`) and full headless browser automation (`puppeteer` / `playwright`).

---

## 2. Decision

We adopt **Axios (`^1.7.2`)** for HTTP transport and **Cheerio (`^1.0.0-rc.12`)** for server-side HTML DOM parsing.

Implementation details:
- `fetchPage(url)` performs `axios.get(url)` and returns `cheerio.load(data)`.
- CSS selectors configured in `props` and `divClass` are evaluated directly against the parsed Cheerio DOM without executing client-side JavaScript.
- Image downloads reuse Axios with `responseType: "stream"`.

---

## 3. Consequences

### Positive Impacts
- **Minimal Footprint**: Zero Chromium/browser binary downloads (~200–400 MB saved); fast `npm install`.
- **High Throughput & Low Memory**: Parsing static HTML with Cheerio uses a fraction of the CPU/RAM of a headless browser.
- **Simple API**: Familiar jQuery-style CSS selector syntax lowers onboarding friction for customizing `props`.

### Negative Impacts & Operational Costs
- **No JavaScript Execution**: Cannot scrape Single Page Applications (SPAs) that hydrate product data purely via client-side XHR/Fetch calls.
- **Anti-Bot Limitations**: Lacks browser fingerprinting, cookie/challenge execution, and interactive pagination clicks.

### Risks and Mitigations
- **Risk**: Target storefront migrates to client-side rendering, returning empty selectors.
- **Mitigation**: Keep `fetchPage(url)` isolated as the sole transport boundary so it can be swapped for Playwright/Puppeteer in a future ADR without altering downstream parsing or CSV export logic.

---

## 4. Alternatives Considered & Disqualification Rationale

### Option A: Puppeteer / Playwright
- *Pros*: Full JS rendering, handles SPAs and dynamic infinite scroll.
- *Cons*: Heavyweight binary dependency, slower page loads, and higher memory consumption unnecessary for server-rendered HTML catalogs.

### Option B: Native `fetch` + Regex
- *Pros*: Zero external dependencies.
- *Cons*: Regex HTML parsing is brittle, error-prone, and unmaintainable for nested DOM structures.
