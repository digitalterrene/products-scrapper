# Deployment & Execution Verification Runbook

- **Status**: Operational Runbook
- **Last Updated**: 2026-11-22
- **Audience**: Developers, Operators, Automated QA Agents

---

## 1. Pre-Flight Checklist

Before executing a scraping run or releasing changes to `main`:

- [ ] **Node.js Runtime**: Verify Node.js `v16+` is active:
  ```bash
  node -v
  ```
- [ ] **Dependencies Installed & Audited**:
  ```bash
  npm install
  npm audit
  ```
- [ ] **Syntax Validation**: Confirm all JavaScript modules parse without syntax errors:
  ```bash
  npm run check
  node --check functions/fetchPage.js
  node --check functions/scrapeLinksInDivs.js
  node --check functions/scrapeDetailsFromPage.js
  node --check functions/saveToCsv.js
  ```
- [ ] **Repository Hygiene Audit**:
  ```bash
  npm run audit:hygiene
  ```
- [ ] **Configuration Verified**: For CLI mode, confirm `mainPageUrl`, `divClass`, and `props` in [`index.js`](../../index.js) are configured. For API mode, confirm `PORT` (default `3000`) is available.
- [ ] **Output Target Ready**: If starting a fresh export and you want CSV column headers written, remove any pre-existing empty `scraped_data.csv` first.

---

## 2. API Server & Swagger UI Verification

1. **Start the API Server**:
   ```bash
   npm start
   ```
   Expected stdout:
   ```text
   Products Scrapper API listening on http://localhost:3000
   Interactive Swagger UI available at http://localhost:3000/docs
   ```
2. **Probe Health & OpenAPI Endpoints**:
   ```bash
   curl -f http://localhost:3000/api/health
   curl -f http://localhost:3000/docs/openapi.json
   ```
3. **Interactive Browser Smoke Test**:
   - Open `http://localhost:3000/docs`.
   - Expand `GET /api/health` -> **Try it out** -> **Execute** -> confirm `200 OK`.
   - Expand `POST /api/scrape/details` -> **Try it out** -> keep `"downloadImages": false` -> **Execute** -> verify extracted JSON fields.

---

## 3. CLI Execution & Smoke Verification

1. **Run the CLI Scraper**:
   ```bash
   npm run scrape
   ```
   Expected stdout on success:
   ```text
   Data has been scraped and saved to CSV file.
   ```

2. **Verify CSV Output**:
   - Confirm `scraped_data.csv` is non-empty.
   - Inspect the first 5 lines to verify column headers (`URL`, `Title`, `Short Description`, `Long Description`, `Images`) and proper quoting:
     ```powershell
     Get-Content scraped_data.csv -TotalCount 5
     ```
     *(On macOS/Linux: `head -n 5 scraped_data.csv`)*

3. **Verify Downloaded Images**:
   - Confirm `./images/` exists and contains valid, non-zero-byte image files:
     ```powershell
     Get-ChildItem images | Select-Object Name, Length -First 10
     ```

---

## 4. Post-Run Git Hygiene Check

Ensure runtime artifacts are never accidentally staged for commit:

```bash
git status
```

Verify `./images/` is ignored by `.gitignore` and that `scraped_data.csv` changes are not committed unless intentionally tracked.
