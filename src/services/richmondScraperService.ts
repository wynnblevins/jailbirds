import { Jailbird } from "../app";

const puppeteer = require("puppeteer");
const TwoCaptcha = require("@2captcha/captcha-solver")
const API_KEY = '6b7c98873007a170794cebfb8964a332';
const solver = new TwoCaptcha.Solver(API_KEY);
const inmatesPageURL: string = "https://omsweb.secure-gps.com/jtclientweb/jailtracker/index/Richmond_Co_VA";

const proveHumanity = async (page) => {
  const CAPTCHA_TEXT_FIELD_ID = '#captchaCode';

  try {
    const captchaResult = await solveCaptcha(page);  
    await page.waitForSelector(CAPTCHA_TEXT_FIELD_ID);
    await page.focus(CAPTCHA_TEXT_FIELD_ID); //you need to focus on the textField
    await page.type(CAPTCHA_TEXT_FIELD_ID, captchaResult.data); //you are also missing  keyboard  property
  } catch (e: any) {
    console.error(`Error encountered while proving humanity`, e);
  }

  // get the validate button and click it
  let buttons = await page.$$('button.btn');
  await buttons[1].click();
};

const solveCaptcha = async (page) => {
  const CAPTCHA_IMG_ID = '#img-captcha';
  await page.waitForSelector(CAPTCHA_IMG_ID);
  const captchaSrc = await page.$eval(CAPTCHA_IMG_ID, (el) => el.getAttribute('src'));

  return solver.imageCaptcha({
    body: captchaSrc,
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

  return jailbirds;
};