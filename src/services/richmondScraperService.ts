import { Jailbird } from "../app";
import { getRandNumInRange } from "./randomNumberService";
const fs = require('fs');
const readline = require('readline');
const puppeteer = require("puppeteer");
const TwoCaptcha = require("@2captcha/captcha-solver")
const config = require('../utils/environment');

const inmatesPageURL: string = "https://omsweb.secure-gps.com/jtclientweb/jailtracker/index/Richmond_Co_VA";
const solver = new TwoCaptcha.Solver(config.keys.captchaReaderAPI);

const proveHumanity = async (page) => {
  const CAPTCHA_TEXT_FIELD_ID = '#captchaCode';

  try {
    const captchaResult = await solveCaptcha(page);  
    await page.waitForSelector(CAPTCHA_TEXT_FIELD_ID);
    await page.focus(CAPTCHA_TEXT_FIELD_ID); //you need to focus on the textField
    await page.type(CAPTCHA_TEXT_FIELD_ID, captchaResult.data);

    // get the validate button and click it
    let buttons = await page.$$('button.btn');
    await buttons[1].click();  
  } catch (e: any) {
    console.error(`Error encountered while proving humanity`, e);
  }
};

const solveCaptcha = async (page) => {
  const CAPTCHA_IMG_ID = '#img-captcha';
  await page.waitForSelector(CAPTCHA_IMG_ID);
  const captchaSrc = await page.$eval(CAPTCHA_IMG_ID, (el) => el.getAttribute('src'));

  return solver.imageCaptcha({
    body: captchaSrc,
    case: true,
    numeric: 4,
    min_len: 3,
    max_len: 5
  });
}; 

export const buildJailbirds = async (): Promise<Jailbird[]> => {
  let  jailbirds: Jailbird[] = [];
  
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
    console.log(`Error encountered while loading initial captcha page at ${inmatesPageURL}`);
  }

  // get past the captcha screen
  await proveHumanity(page);

  // TODO: move these values to .env file
  const upper = 10;
  const lower = 5;
  
  // begin performing searches
  const numOfSearches = getRandNumInRange(lower, upper);
  
  
  await doJBSearches(numOfSearches);

  return jailbirds;
};

async function processLineByLine(fileName: string) {
  const fileStream = fs.createReadStream(fileName);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    console.log(`Line from file: ${line}`);
  }
}


const doJBSearches = async (searchesToPerform: number): Promise<Jailbird[]> => {
  const NAMES_FILE_PATH = '../names.txt';
  processLineByLine(NAMES_FILE_PATH);  
  
  return null;
};