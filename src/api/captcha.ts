import { config } from '../utils/environment';
import axios from 'axios';
const CAPCHA_API_KEY = config.keys.captchaAPIKey;
const CAPTCHA_POST_ERROR_MSG = 'The request to submit the captcha encountered an error';

export interface CaptchaRequestBody {
  key: string,
  method: 'post' | 'base64',
  body: string,
  regsense: 0 | 1
}

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
};

export {
  submitCaptcha,
  getCaptchaSolution
};