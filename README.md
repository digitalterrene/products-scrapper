# Product Scraper Documentation

Welcome to the Product Scraper project! This script allows you to scrape product information from an e-commerce site and save the data in a CSV file. It's built using Node.js, with `axios` for HTTP requests, `cheerio` for HTML parsing, and `csv-writer` for saving data.

This documentation will guide you through setting up the project, customizing it for your use case, and running it effectively.

---

## Features

- Scrapes product titles, descriptions, and images.
- Extracts product links from a specified container.
- Downloads product images locally.
- Saves scraped data into a CSV file for easy analysis.

---

## Prerequisites

Ensure you have the following installed:

- **Node.js** (v16 or higher recommended)
- **npm** (comes with Node.js)

---

## Setting Up the Project

1. **Clone the Repository**  
   Clone the project repository to your local machine using the following command:

   ```bash
   git clone `https://github.com/digitalterrene/products-scrapper.git`
   cd `products-scrapper`
   ```

2. **Install Dependencies**  
   Install the required Node.js packages:

   ```bash
   npm install
   ```

3. **Update the Configuration**  
   Open the `index.js` file (or your project’s entry file) and update the placeholders to match the structure of the target e-commerce website:

   - Replace `mainPageUrl` with the URL of the main page you want to scrape.
   - Replace `divClass` with the class name of the container holding product links.
   - Update the `props` object with appropriate CSS selectors for:
     - `titleSelector` – for product titles.
     - `shortDescriptionSelector` – for short descriptions.
     - `longDescriptionSelector` – for long descriptions.
     - `imageSelector` – for product images.

---

## Customizing the Selectors

To ensure accurate scraping, identify the correct CSS selectors from the e-commerce site using browser developer tools:

1. Open the website in your browser.
2. Right-click the element you want to scrape (e.g., product title) and select **Inspect**.
3. Note down the CSS class or ID of the element.
4. Replace the respective properties in the `props` object.

Example `props`:

```javascript
const props = {
  titleSelector: ".product-title-class", // CSS selector for titles
  shortDescriptionSelector: ".short-desc-class", // CSS selector for short descriptions
  longDescriptionSelector: ".long-desc-class", // CSS selector for long descriptions
  imageSelector: ".product-image-class img", // CSS selector for images
};
```

---

## Running the Scraper

To execute the script:

1. Run the following command:

   ```bash
   node main.js
   ```

2. The script will:
   - Extract all product links from the specified `divClass`.
   - Visit each product link and scrape the details as per the configured selectors.
   - Save the data into a CSV file named `scraped_data.csv`.

---

## Output

### CSV File

The scraped data is saved in `scraped_data.csv` in the following format:

| URL         | Title         | Short Description | Long Description | Images                 |
| ----------- | ------------- | ----------------- | ---------------- | ---------------------- |
| Product URL | Product Title | Short Description | Long Description | Image1.jpg, Image2.jpg |

### Images

Downloaded product images are saved in the `images` folder.

---

## Troubleshooting

- **Selectors not working?**  
  Verify the CSS selectors using browser developer tools and update the `props` object accordingly.

- **Script crashes?**  
  Check the error log for issues like:

  - Incorrect URL or selector.
  - Missing internet connection.
  - Missing write permissions for the `images` or `csv` file directory.

- **Rate-limiting issues?**  
  If the target site blocks requests, consider adding a delay between requests using `setTimeout`.

---

## Extending the Script

You can extend the script to:

- **Scrape additional fields**: Add more selectors to the `props` object and extract data accordingly in the `scrapeDetailsFromPage` function.
- **Handle pagination**: Automate navigating through paginated product listings.

---

## Notes

- **Ethical scraping**: Ensure you comply with the site's terms of service and use this tool responsibly.
- **Testing**: Test the script on a small dataset before scaling.

---

Happy scraping! If you have questions or need assistance, feel free to reach out. 😊
