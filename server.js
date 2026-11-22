const express = require("express");
const fs = require("fs");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const {
  scrapeLinksInDiv,
  scrapeDetailsFromPage,
  saveToCsv,
} = require("./index");

const openApiSpec = require("./docs/api/openapi.json");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "1mb" }));

/**
 * Validates that a string is a well-formed HTTP or HTTPS URL.
 */
function isValidHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Restricts CSV file paths to safe basenames within the workspace root.
 */
function resolveSafeCsvPath(inputPath = "scraped_data.csv") {
  const baseName = path.basename(String(inputPath || "scraped_data.csv"));
  if (!baseName.toLowerCase().endsWith(".csv")) {
    throw new Error("csvFilePath must end with .csv");
  }
  return path.join(__dirname, baseName);
}

/**
 * Minimal RFC 4180 CSV parser for reading quoted rows back as JSON.
 */
function parseCsvContent(content) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\r" && next === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return [];

  const headers = rows[0];
  return rows.slice(1).map((values) => {
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] ?? "";
    });
    return record;
  });
}

// Redirect root to interactive Swagger UI
app.get("/", (_req, res) => {
  res.redirect("/docs");
});

// Serve raw OpenAPI 3.0.3 JSON specification
app.get("/docs/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

// Serve interactive Swagger UI (test endpoints directly in the browser)
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    explorer: true,
    customSiteTitle: "Products Scrapper — Interactive API Docs",
  })
);

/**
 * GET /api/health
 */
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "products-scrapper",
    uptimeSeconds: Math.round(process.uptime()),
    nodeVersion: process.version,
    docsUrl: "/docs",
    openApiUrl: "/docs/openapi.json",
  });
});

/**
 * POST /api/scrape/links
 */
app.post("/api/scrape/links", async (req, res, next) => {
  try {
    const { url, divClass } = req.body || {};

    if (!isValidHttpUrl(url)) {
      return res.status(400).json({
        error: "ValidationError",
        message: "A valid http:// or https:// 'url' is required.",
      });
    }
    if (typeof divClass !== "string" || !divClass.trim()) {
      return res.status(400).json({
        error: "ValidationError",
        message: "A non-empty string 'divClass' is required.",
      });
    }

    const links = await scrapeLinksInDiv(url, divClass.trim());
    return res.json({
      sourceUrl: url,
      divClass: divClass.trim(),
      count: links.length,
      links,
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/scrape/details
 */
app.post("/api/scrape/details", async (req, res, next) => {
  try {
    const { url, props, downloadImages = false } = req.body || {};

    if (!isValidHttpUrl(url)) {
      return res.status(400).json({
        error: "ValidationError",
        message: "A valid http:// or https:// 'url' is required.",
      });
    }
    if (!props || typeof props !== "object" || Array.isArray(props)) {
      return res.status(400).json({
        error: "ValidationError",
        message: "A 'props' object containing CSS selectors is required.",
      });
    }

    const details = await scrapeDetailsFromPage(url, props, {
      downloadImages: Boolean(downloadImages),
    });
    details.url = url;

    return res.json({
      url,
      downloadImages: Boolean(downloadImages),
      details,
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/scrape/run
 */
app.post("/api/scrape/run", async (req, res, next) => {
  try {
    const {
      mainPageUrl,
      divClass,
      props,
      downloadImages = true,
      saveCsv = true,
      csvFilePath = "scraped_data.csv",
      maxProducts,
    } = req.body || {};

    if (!isValidHttpUrl(mainPageUrl)) {
      return res.status(400).json({
        error: "ValidationError",
        message: "A valid http:// or https:// 'mainPageUrl' is required.",
      });
    }
    if (typeof divClass !== "string" || !divClass.trim()) {
      return res.status(400).json({
        error: "ValidationError",
        message: "A non-empty string 'divClass' is required.",
      });
    }
    if (!props || typeof props !== "object" || Array.isArray(props)) {
      return res.status(400).json({
        error: "ValidationError",
        message: "A 'props' object containing CSS selectors is required.",
      });
    }

    const safeCsvPath = saveCsv ? resolveSafeCsvPath(csvFilePath) : null;
    const discoveredLinks = await scrapeLinksInDiv(mainPageUrl, divClass.trim());
    const limit =
      Number.isInteger(maxProducts) && maxProducts > 0
        ? Math.min(maxProducts, discoveredLinks.length)
        : discoveredLinks.length;

    const targetLinks = discoveredLinks.slice(0, limit);
    const items = [];

    for (const link of targetLinks) {
      const details = await scrapeDetailsFromPage(link, props, {
        downloadImages: Boolean(downloadImages),
      });
      details.url = link;
      items.push(details);
    }

    if (saveCsv && items.length > 0) {
      await saveToCsv(items, safeCsvPath);
    }

    return res.json({
      mainPageUrl,
      totalLinksFound: discoveredLinks.length,
      processedCount: items.length,
      savedToCsv: Boolean(saveCsv && items.length > 0),
      csvFilePath: safeCsvPath ? path.basename(safeCsvPath) : null,
      items,
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/results
 */
app.get("/api/results", (req, res, next) => {
  try {
    const fileParam = req.query.file || "scraped_data.csv";
    const format = String(req.query.format || "json").toLowerCase();
    const safeCsvPath = resolveSafeCsvPath(fileParam);

    if (!fs.existsSync(safeCsvPath)) {
      return res.status(404).json({
        error: "NotFound",
        message: `CSV file '${path.basename(safeCsvPath)}' does not exist.`,
      });
    }

    const content = fs.readFileSync(safeCsvPath, "utf8");
    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${path.basename(safeCsvPath)}"`
      );
      return res.send(content);
    }

    const trimmed = content.trim();
    const records = trimmed ? parseCsvContent(trimmed) : [];
    return res.json({
      file: path.basename(safeCsvPath),
      count: records.length,
      records,
    });
  } catch (err) {
    return next(err);
  }
});

// Centralized error handler
app.use((err, _req, res, _next) => {
  if (err && err.isAxiosError) {
    const status = err.response ? err.response.status : 502;
    return res.status(502).json({
      error: "UpstreamFetchError",
      upstreamStatus: status,
      message: err.message,
    });
  }

  const statusCode =
    err && err.message && err.message.includes("csvFilePath") ? 400 : 500;
  return res.status(statusCode).json({
    error: statusCode === 400 ? "ValidationError" : "InternalServerError",
    message: err ? err.message : "An unexpected error occurred.",
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Products Scrapper API listening on http://localhost:${PORT}`);
    console.log(`Interactive Swagger UI available at http://localhost:${PORT}/docs`);
  });
}

module.exports = { app };
