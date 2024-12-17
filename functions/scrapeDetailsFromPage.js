const { fetchPage } = require("./fetchPage");

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
    details.longDescription = details.longDescription.join(" "); // Join all long description parts into a single string
  }

  // Scrape images
  if (props.imageSelector) {
    details.images = [];
    $(props.imageSelector).each((_, element) => {
      details.images.push($(element).attr("src"));
    });
    details.images = details.images.join(", "); // Join all image URLs into a single string
  }

  return details;
}
module.exports = { scrapeDetailsFromPage };
