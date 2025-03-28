import { Jailbird } from "../app";
const { getRandNumInRange } = require('./randomNumberService');
const puppeteer = require("puppeteer");
const { solveRichmondCaptcha: solveCaptcha } = require('./capchaService');
const inmatesPageURL: string = "https://omsweb.secure-gps.com/jtclientweb/jailtracker/index/Richmond_Co_VA";
const names = require('../data/names');

const proveHumanity = async (page) => {
  try {
    const CAPTCHA_TEXT_FIELD_ID = '#captchaCode';
    const CAPTCHA_IMG_ID = '#img-captcha';

    // solve the captcha answer
    await page.waitForSelector(CAPTCHA_IMG_ID);
    const captchaSrc = await page.$eval(CAPTCHA_IMG_ID, (el) => el.getAttribute('src'));
    const { data: { request: captchaAnswer } } = await solveCaptcha(captchaSrc);
  
    // enter the captch answer on the web page
    await page.waitForSelector(CAPTCHA_TEXT_FIELD_ID);
    await page.focus(CAPTCHA_TEXT_FIELD_ID); //you need to focus on the textField
    await page.type(CAPTCHA_TEXT_FIELD_ID, captchaAnswer);

    // get the validate button and click it
    let buttons = await page.$$('button.btn');
    await buttons[1].click();  
  } catch (e: any) {
    console.error(`Error encountered while proving humanity`, e);
  }
};

export const buildJailbirds = async (): Promise<Jailbird[]> => {
  console.log('Launching headless browser for Richmond page.');
  const browser = await puppeteer.launch({ 
    headless: false,
  });

  // go to the Henrico inmates page
  console.log(`Going to ${inmatesPageURL}`);
  const page = await browser.newPage();

  try {
    await page.goto(inmatesPageURL, {
      waitUntil: 'load',
      timeout: 10000,
    });
  } catch (e: any) {
    console.error(`Error encountered while loading initial captcha page at ${inmatesPageURL}`);
  }

  // get past the captcha screen
  try {
    await proveHumanity(page);
  } catch (e: any) {
    console.error(`Error encounted while proving humanity`, e);
  }
  
  // begin performing searches
  const jailbirds = await doJBSearches(page);

  return null;
};

const getRandomSubset = (arr, size) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

const doJBSearches = async (page): Promise<Jailbird[]> => {
  // TODO: move these values to .env file
  const upper = 5;
  const lower = 1;
  const numOfSearches = getRandNumInRange(lower, upper)
  const namesSubset = getRandomSubset(names, numOfSearches);

  for (let i = 0; i < namesSubset.length; i++) {
    const jailbirds: Jailbird[] = await doSearch(page, namesSubset[i]);
    if (jailbirds.length) {
      console.log(`richmond jailbirds found! ${JSON.stringify(jailbirds)}`);
    }
  }

  return null;
};

const doSearch = async (page, name: string): Promise<Jailbird[]> => {
  // enter the search text
  const FIRST_NAME_SEARCH_BOX_ID = '#searchFirstName';
  await page.waitForSelector(FIRST_NAME_SEARCH_BOX_ID);
  await page.focus(FIRST_NAME_SEARCH_BOX_ID);
  await page.type(FIRST_NAME_SEARCH_BOX_ID, name);

  // find and click the search button
  const searchButtonSelector = '.form-group.btn.btn-primary';
  const button = await page.$(searchButtonSelector);
  await button.click();

  const tableData = await page.$$eval('table tbody tr td', (tds) =>
    tds.map((td) => {
        return td.innerText;
    })
  );

  // table data now contains a cell by cell list of scraped table data  
  console.log(tableData);
  return null;
};