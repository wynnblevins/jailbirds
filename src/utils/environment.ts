require('dotenv').config();

/* eslint no-process-env:0 */
export const config = {
  maxJailbirdsCount: process.env.MAX_JAILBIRDS_COUNT,
  minJailbirdsCount: process.env.MIN_JAILBIRDS_COUNT,
  lowerWaitTimeBoundary: process.env.LOWER_WAIT_TIME_BOUNDARY,
  upperWaitTimeBoundary: process.env.UPPER_WAIT_TIME_BOUNDARY,
  richmond: {
    lowerSearchCount: process.env.MIN_RICHMOND_JB_SEARCHES,
    upperSearchCount: process.env.MAX_RICHMOND_JB_SEARCHES
  },
  ig: {
    username: process.env.IG_USERNAME,
    password: process.env.IG_PASSWORD
  },
  db: {
    name: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    username: process.env.MONGO_USERNAME,
    password: process.env.MONGO_PASSWORD
  },
  keys: {
    captchaAPIKey: process.env.CAPTCHA_KEY
  }
}