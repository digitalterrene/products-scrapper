const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
async function saveToCsv(data, csvFilePath) {
  const fileExists = fs.existsSync(csvFilePath);
  const csvWriter = createCsvWriter({
    path: csvFilePath,
    header: [
      { id: "url", title: "URL" },
      { id: "title", title: "Title" },
      { id: "shortDescription", title: "Short Description" },
      { id: "longDescription", title: "Long Description" },
      { id: "images", title: "Images" },
    ],
    append: true,
    // If the file exists, don't write the header again
    alwaysQuote: true,
  });

  const records = data.map((item) => ({
    url: item.url,
    title: item.title,
    shortDescription: item.shortDescription,
    longDescription: item.longDescription,
    images: item.images,
  }));

  if (!fileExists) {
    await csvWriter.writeRecords(records); // Write the header and records
  } else {
    await csvWriter.writeRecords(records); // Append records to the existing file
  }
}
module.exports = { saveToCsv };
