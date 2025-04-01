import { Page } from "puppeteer";
const { solveCaptcha } = require('./capchaService');

const attemptCaptcha = async (captchaSrc): Promise<string> => {
  const TWENTY_SECOND_TIMEOUT = 20000;
  const { data: { request: captchaAnswer } } = await solveCaptcha(captchaSrc, TWENTY_SECOND_TIMEOUT);
  return captchaAnswer
};

const proveHumanity = async (page: Page) => {
  try {
    const CAPTCHA_TEXT_FIELD_ID = '#captchaCode';
    const CAPTCHA_IMG_ID = '#img-captcha';
    const CAPTCHA_NOT_READY_ERROR_MSG = 'CAPCHA_NOT_READY';
    const INCORRECT_CAPTCHA_MSG = "Incorrect, Click Here to Try Again";

    // solve the captcha answer
    await page.waitForSelector(CAPTCHA_IMG_ID);
    const captchaSrc = await page.$eval(CAPTCHA_IMG_ID, (el) => el.getAttribute('src'));
    const captchaAnswerStr = await attemptCaptcha(captchaSrc);

    // handling any captcha problems here
    let pageButtons = await page.$$('button.btn');
    const buttonText = await (await pageButtons[1].getProperty('textContent')).jsonValue();
    if (captchaAnswerStr === CAPTCHA_NOT_READY_ERROR_MSG) {
      // reattempt the captcha challenge if the captcha isn't ready yet
      await proveHumanity(page);  
    } else if (buttonText === INCORRECT_CAPTCHA_MSG) {
      // get a new captcha and try again if we got the captcha wrong
      await pageButtons[1].click();
      await proveHumanity(page);
    } else {
      // enter the captch answer on the web page
      await page.waitForSelector(CAPTCHA_TEXT_FIELD_ID);
      await page.focus(CAPTCHA_TEXT_FIELD_ID); //you need to focus on the textField
      await page.type(CAPTCHA_TEXT_FIELD_ID, captchaAnswerStr);

      // get the validate button and click it
      let buttons = await page.$$('button.btn');
      await buttons[1].click();  
    }
  } catch (e: any) {
    console.error(`Error encountered while proving humanity`, e);
  }
};

module.exports = proveHumanity
