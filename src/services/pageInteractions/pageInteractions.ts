import { Page } from "puppeteer";
import { logMessage } from "../loggerService";
import { getHTMLElement } from "./htmlElementService";

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
  let textField;
  try {
    textField = await getHTMLElement(page, fieldSelector);
  } catch (e: any) {
    const errorStr = `Error encountered while typing in text field: ${e}`;
    logMessage(errorStr);
    throw new Error(errorStr);
  }
  if (clearField) await textField.click({ clickCount: 3 });
  return await textField.type(text);
};

/**
 * A function which uses puppeteer in order to clear any text from a text field
 * 
 * @param page a puppeteer page object
 * @param fieldSelector the CSS selector string to use in order to get the text field
 * 
 * @returns a promise for the result clearing the text field
 */
const clearTextInput = async (page: Page, fieldSelector: string) => {
  const textField = await getHTMLElement(page, fieldSelector);
  await textField.click({ clickCount: 4 });
  return await textField.type(String.fromCharCode(8));
};

/**
 * A function which places the browser's focus on a specific input or page item
 * 
 * @param page a puppeteer page object
 * @param elementSelector a selector for an element on the page
 */
const focusOn = async (page: Page, fieldSelector: string) => {
  await page.waitForSelector(fieldSelector);
  await page.focus(fieldSelector);
}

export {
  clickButton,
  selectFromMenu,
  typeInField,
  focusOn,
  clearTextInput,
  getHTMLElement
} 