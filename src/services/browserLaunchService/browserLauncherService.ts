import puppeteer, { Browser } from "puppeteer";

export const launchBrowser = async (headless: boolean = true): Promise<Browser> => {
  const browser = await puppeteer.launch({ 
    headless,
    timeout: 480000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  return browser;
};