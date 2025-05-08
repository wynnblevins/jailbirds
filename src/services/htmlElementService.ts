import { ElementHandle, Page } from "puppeteer";

/**
 * A function which can be used to get any element on the page asynchronously
 * 
 * @param page the puppeteer page object
 * @param selector the CSS selector string to use in order to get the HTML element
 * @returns a promise for the HTML element, or null if an error is encountered
 */
const getHTMLElement = async (
  page: Page,
  selector: string
): Promise<ElementHandle<Element> | null> => {
  try {
    // Wait for the element to appear in the DOM
    await page.waitForSelector(selector, { timeout: 5000 });

    // Get the element handle
    const elementHandle: ElementHandle<Element> | null = await page.$(selector);
    return elementHandle;
  } catch (error) {
    console.error(`Error fetching element: ${error}`);
    return null;
  }
}

export { 
  getHTMLElement 
};