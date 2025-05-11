import puppeteer, { Browser } from "puppeteer";

const launchBrowser = async (headless: boolean = true): Promise<any> => {
  const browser = await puppeteer.launch({ 
    headless,
  });

  return browser;
};

export default launchBrowser;