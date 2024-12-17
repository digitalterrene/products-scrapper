const { fetchPage } = require("./fetchPage");

async function scrapeLinksInDiv(url, divClass) {
  const $ = await fetchPage(url);
  const links = [];
  $(`div.${divClass} a`).each((_, element) => {
    links.push($(element).attr("href"));
  });
  return links;
}
module.exports = { scrapeLinksInDiv };
