import { ElementHandle, Page } from "puppeteer";

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

const selectFromMenu = async (
  page: Page, 
  menuSelector: string, 
  item: string
): Promise<string[]> => {
  const rowsSelect = await page.waitForSelector(menuSelector);
  return await rowsSelect.select(item);
};

const clickButton = async (page: Page, buttonSelector: string) => {
  await page.waitForSelector(buttonSelector);
  const button = await getHTMLElement(page, buttonSelector);
  return await button.click();
}

export {
  clickButton,
  selectFromMenu
} 