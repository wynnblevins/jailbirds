import { getCaptchaSolution, submitCaptcha } from "../api/captcha";
import { delayMs } from "./delayService";

const CAPTCHA_API_RESPONSE_FORMAT_ERROR = 'Unable to parse the response from the captcha API';

/**
 * 
 * @param captchaBody 
 * @param ms The number of milliseconds to wait for the captcha solution
 * to be ready.  A higher the delay time means a greater liklihood that the 
 * captcha solution will be correct.
 * @returns A promise for the result of the captcha
 */
const solveCaptcha = async (captchaBody: string, ms?: number) => {
  return new Promise(async (resolve, reject) => {
    submitCaptcha(captchaBody).then((submissionResponse: any) => {
      if (!submissionResponse?.data || !submissionResponse?.data?.startsWith('OK|')) {
        logMessage(`${CAPTCHA_API_RESPONSE_FORMAT_ERROR}, captcha response was: ${submissionResponse?.data}`)
        reject(submissionResponse);
      } else {
        delayMs(ms || 20000).then(async () => {
          const result = await getCaptchaSolution(submissionResponse?.data);  
          resolve(result);
        }).catch((e: any) => {
          reject(e);
        });
      }
    });
  });
};

export {
  solveCaptcha
}