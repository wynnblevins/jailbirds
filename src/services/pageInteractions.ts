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
 * A function which uses puppeteer to select a menu item
 * from an HTML menu select box.
 * 
 * @param page a puppeteer page object
 * @param menuSelector the CSS selector string to use in order to get the button
 * @param item the menu item to select
 * 
 * @returns a promise for the selected string
 */
const selectFromMenu = async (
  page: Page, 
  menuSelector: string, 
  item: string
): Promise<string[]> => {
  const rowsSelect = await page.waitForSelector(menuSelector);
  return await rowsSelect.select(item);
};

/**
 * A function which uses puppeteer to click a button
 * 
 * @param page a puppeteer page object
 * @param fieldSelector the CSS selector string to use in order to get the button
 * 
 * @returns a promise for the result of the button click
 */
const clickButton = async (page: Page, buttonSelector: string) => {
  await page.waitForSelector(buttonSelector);
  const button = await getHTMLElement(page, buttonSelector);
  return await button.click();
}

/**
 * A function which uses puppeteer in order to type in a text field
 * 
 * @param page a puppeteer page object
 * @param fieldSelector the CSS selector string to use in order to get the text field
 * @param text the text to enter into the text field
 * @param clearField boolean for whether to clear the field before typing, defaults to false
 * 
 * @returns a promise for the result typing in the text field
 */
const typeInField = async (
  page: Page, 
  fieldSelector: string, 
  text: string, 
  clearField?: boolean
) => {
  const textField = await getHTMLElement(page, fieldSelector);
  if (clearField) await textField.click({ clickCount: 3 });
  return await textField.type(text);
};

export {
  clickButton,
  selectFromMenu,
  typeInField,
  getHTMLElement
} 