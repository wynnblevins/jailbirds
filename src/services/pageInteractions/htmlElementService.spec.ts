import puppeteer, { Browser, Page } from 'puppeteer';
import { getButtonsByText } from './htmlElementService';

let browser: Browser;
let page: Page;

beforeAll(async () => {
  browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
});

afterAll(async () => {
  await browser.close();
});

describe('getButtonsByText', () => {
  const SECONDS = 1000;
  
  it('should return buttons that exactly match the text content', async () => {
    await page.setContent(`
      <html>
        <body>
          <button>Click Me</button>
          <button>Submit</button>
          <button>Click Me</button>
        </body>
      </html>
    `);

    const buttons = await getButtonsByText(page, 'Click Me');
    expect(buttons).toHaveLength(2);

    const texts = await Promise.all(
      buttons.map(btn => page.evaluate(el => el.textContent, btn))
    );

    expect(texts).toEqual(['Click Me', 'Click Me']);
  }, 20 * SECONDS);

  it('should return an empty array if no buttons match', async () => {
    await page.setContent(`
      <html>
        <body>
          <button>Hello</button>
        </body>
      </html>
    `);

    const buttons = await getButtonsByText(page, 'Nonexistent');
    expect(buttons).toHaveLength(0);
  }, 20 * SECONDS);
});