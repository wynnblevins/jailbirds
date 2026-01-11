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

/**
 * Gets all button elements on the page that match the specified text content.
 * @param page - The Puppeteer Page instance.
 * @param buttonText - The text content to match (case-sensitive exact match).
 * @returns An array of element handles to the matching buttons.
 */
export async function getButtonsByText(page: Page, buttonText: string): Promise<ElementHandle<HTMLButtonElement>[]> {
  const handles = await page.$$('button');
  const matchingHandles: ElementHandle<HTMLButtonElement>[] = [];

  for (const handle of handles) {
    const text = await page.evaluate(el => el.textContent?.trim(), handle);
    if (text === buttonText) {
      matchingHandles.push(handle as ElementHandle<HTMLButtonElement>);
    }
  }

  return matchingHandles;
}

export { 
  getHTMLElement 
};