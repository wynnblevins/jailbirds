import { Page } from "puppeteer";

/**
 * scrapes table data which contains jailbird details
 * 
 * @param page 
 * @returns promise for a list of table cells containing jailbird details 
 */
const scrapeTable = async (page: Page): Promise<string[]> => {
  return await page.$$eval('table tbody tr td', (tds) =>
    tds.map((td) => {
        return td.innerText;
    })
  );
};

export default scrapeTable;