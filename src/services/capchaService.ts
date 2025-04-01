const axios = require('axios');
const config = require('../utils/environment');
const CAPCHA_API_KEY = config.keys.captchaAPIKey;

interface CaptchaRequestBody {
  key: string,
  method: 'post' | 'base64',
  body: string,
  regsense: 0 | 1
}

const CAPTCHA_POST_ERROR_MSG = 'The request to submit the captcha encountered an error';
const CAPTCHA_API_RESPONSE_FORMAT_ERROR = 'Unable to parse the response from the captcha API';

const submitCaptcha = async (captchaBody: string) => {
  const captchaAPIInEndpoint = 'https://2captcha.com/in.php';
  const requestBody: CaptchaRequestBody = {
    key: CAPCHA_API_KEY,
    method: 'base64',
    body: captchaBody,
    regsense: 1
  };

  try {
    return await axios.post(captchaAPIInEndpoint, requestBody);
  } catch (e: any) {
    console.error(CAPTCHA_POST_ERROR_MSG, e);
  }
};

const getCaptchaSolution = async (captchaIdStr: string) => {
  const captchaAPIResEndpoint = 'https://2captcha.com/res.php';
  
  if (captchaIdStr.startsWith('OK|')) {
    const captchaId = captchaIdStr.split('|')[1];
    const getReqParamsObj = {
      params: {
        key: CAPCHA_API_KEY,
        action: 'get',
        id: captchaId,
        json: 1
      }
    };
    return await axios.get(captchaAPIResEndpoint, getReqParamsObj);
  } else {
    console.error(CAPTCHA_API_RESPONSE_FORMAT_ERROR);
  }
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 
 * @param captchaBody 
 * @param delayMs The number of milliseconds to wait for the captcha solution
 * to be ready.  A higher the delay time means a greater liklihood that the 
 * captcha solution will be correct.
 * @returns 
 */
const solveCaptcha = async (captchaBody: string, delayMs?: number) => {
  const submissionResponse = await submitCaptcha(captchaBody)

  return new Promise(async (resolve, reject) => {
    delay(delayMs || 20000).then(async () => {
      const result = await getCaptchaSolution(submissionResponse?.data);  
      resolve(result);
    }).catch((e: any) => {
      reject(e);
    });
  });
};

module.exports = {
  solveCaptcha
};