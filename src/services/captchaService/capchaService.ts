import { Page } from "puppeteer";
import { getCaptchaSolution, submitCaptcha } from "../../api/captcha";
import { delayMs } from "../delayService/delayService";
import { logMessage } from "../loggerService/loggerService";

const CAPTCHA_API_RESPONSE_FORMAT_ERROR = 'Unable to parse the response from the captcha API';

/**
 * 
 * @param captchaBody 
 * @param ms The number of milliseconds to wait for the captcha solution
 * to be ready.  A higher the delay time means a greater liklihood that the 
 * captcha solution will be correct.
 * @returns A promise for the result of the captcha
 */
const solveCaptcha = async (captchaBody: string, ms?: number): Promise<any> => {
  let result = null;

  const captchaSubmissionResponse = await submitCaptcha(captchaBody);
  if (!captchaSubmissionResponse?.data || !captchaSubmissionResponse?.data?.startsWith('OK|')) {
    const message = `${CAPTCHA_API_RESPONSE_FORMAT_ERROR}, captcha response was: ${captchaSubmissionResponse?.data}`;
    logMessage(message);
    throw new Error(message);
  } else {
    await delayMs(ms || 20000);
    result = await getCaptchaSolution(captchaSubmissionResponse?.data);  
  }
  
  return result;
};

const attemptCaptcha = async (captchaSrc): Promise<string> => {
  const TWENTY_SECOND_TIMEOUT = 20000;
  const response = await solveCaptcha(captchaSrc, TWENTY_SECOND_TIMEOUT);
  
  let captchaAnswer = '';
  if (response?.data?.request) {
    captchaAnswer = response.data.request;
  }
  return captchaAnswer;
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
    let captchaAnswerStr = null;
    try {
      captchaAnswerStr = await attemptCaptcha(captchaSrc);
    } catch (e: any) {
      logMessage(`Captcha service encountered error`);
      throw new Error(e);
    }
    
    if (captchaAnswerStr !== CAPTCHA_NOT_READY_ERROR_MSG) {
      // enter the captch answer on the web page
      await page.waitForSelector(CAPTCHA_TEXT_FIELD_ID);
      await page.focus(CAPTCHA_TEXT_FIELD_ID); //you need to focus on the textField
      await page.type(CAPTCHA_TEXT_FIELD_ID, captchaAnswerStr);

      // get the validate button and click it
      let buttons = await page.$$('button.btn');
      await buttons[1].click();  
    } else {
      // stall for three seconds
      const THREE_SECONDS = 3000;
      await delayMs(THREE_SECONDS);

      // we wont get an error back from the API, so use the button's
      // text to figure out if the captcha answer was incorrect
      let pageButtons = await page.$$('button.btn');
      const buttonText = await (await pageButtons[1].getProperty('textContent')).jsonValue();      

      // If the captcha API got it wrong, try again
      if (buttonText === INCORRECT_CAPTCHA_MSG) {
        const button = pageButtons[1]
        button.click();
        proveHumanity(page);
      }
    }
  } catch (e: any) {
    throw new Error(`Error encountered while proving humanity ${e}`);
  }
};

export {
  proveHumanity
}