const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const { createObjectCsvWriter } = require("csv-writer");

async function fetchPage(url) {
  const { data } = await axios.get(url);
  return cheerio.load(data);
}

async function scrapeLinksInDiv(url, divClass) {
  const $ = await fetchPage(url);
  const links = [];
  $(`div.${divClass} a`).each((_, element) => {
    const link = $(element).attr("href");
    if (link) {
      links.push(link.startsWith("http") ? link : url + link);
    }
  });
  return links;
}

async function scrapeDetailsFromPage(url, props) {
  const $ = await fetchPage(url);
  const details = {};

  // Scrape title
  if (props.titleSelector) {
    details.title = $(props.titleSelector).text().trim();
  }

  // Scrape short description
  if (props.shortDescriptionSelector) {
    details.shortDescription = $(props.shortDescriptionSelector).text().trim();
  }

  // Scrape long description
  if (props.longDescriptionSelector) {
    details.longDescription = [];
    $(props.longDescriptionSelector).each((_, element) => {
      details.longDescription.push($(element).text().trim());
    });
    details.longDescription = details.longDescription.join(" ");
  }

  // Scrape images and download them
  if (props.imageSelector) {
    details.images = [];
    const imagePromises = [];
    $(props.imageSelector).each((_, element) => {
      const imgSrc = $(element).attr("src");
      if (imgSrc) {
        const imgURL = imgSrc.startsWith("http") ? imgSrc : url + imgSrc;
        imagePromises.push(
          downloadImage(imgURL).then((imgPath) => {
            details.images.push(imgPath);
          })
        );
      }
    });
    await Promise.all(imagePromises);
    details.images = details.images.join(", ");
  }

  return details;
}

async function downloadImage(url) {
  const response = await axios({
    url,
    responseType: "stream",
  });

  // Ensure the images directory exists
  const imagesDir = path.join(__dirname, "images");
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
  }

  const filename = path.basename(url);
  const imgPath = path.join(imagesDir, filename);
  const writer = fs.createWriteStream(imgPath);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(imgPath));
    writer.on("error", reject);
  });
}

async function saveToCsv(data, csvFilePath) {
  const fileExists = fs.existsSync(csvFilePath);
  const csvWriter = createObjectCsvWriter({
    path: csvFilePath,
    header: [
      { id: "url", title: "URL" },
      { id: "title", title: "Title" },
      { id: "shortDescription", title: "Short Description" },
      { id: "longDescription", title: "Long Description" },
      { id: "images", title: "Images" },
    ],
    append: fileExists, // Append if file already exists
    alwaysQuote: true,
  });

  const records = data.map((item) => ({
    url: item.url,
    title: item.title,
    shortDescription: item.shortDescription,
    longDescription: item.longDescription,
    images: item.images,
  }));

  await csvWriter.writeRecords(records);
}

async function main() {
  const mainPageUrl = "mainPageUrl"; // Replace with the actual URL
  const divClass = "products"; // Replace with the actual div class containing links
  const props = {
    titleSelector: ".product-info-main h1", // Replace with the actual selector for the title
    shortDescriptionSelector: ".product-info-main div.prose p ", // Replace with the actual selector for the short description
    longDescriptionSelector: "section.product-description .product-info-main p", // Replace with the actual selector for the long description
    imageSelector: ".product-info-main div img", // Replace with the actual selector for images
  };
  const csvFilePath = "scraped_data.csv";

  try {
    const links = await scrapeLinksInDiv(mainPageUrl, divClass);
    const scrapedData = [];

    for (const link of links) {
      const details = await scrapeDetailsFromPage(link, props);
      details.url = link; // Include the URL in the details
      scrapedData.push(details);
    }

    await saveToCsv(scrapedData, csvFilePath);
    console.log("Data has been scraped and saved to CSV file.");
  } catch (error) {
    console.error("Error occurred while scraping:", error);
  }
}

main();
