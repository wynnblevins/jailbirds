import puppeteer, { Browser } from "puppeteer";

export const launchBrowser = async (headless: boolean = true): Promise<Browser> => {
  const browser = await puppeteer.launch({ 
    headless,
  });

  return browser;
};