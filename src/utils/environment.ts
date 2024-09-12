require('dotenv').config();

/* eslint no-process-env:0 */
module.exports = {
  maxJailbirdsCount: process.env.MAX_JAILBIRDS_COUNT,
  minJailbirdsCount: process.env.MIN_JAILBIRDS_COUNT,
  lowerWaitTimeBoundary: process.env.LOWER_WAIT_TIME_BOUNDARY,
  upperWaitTimeBoundary: process.env.UPPER_WAIT_TIME_BOUNDARY,
  ig: {
    username: process.env.IG_USERNAME,
    password: process.env.IG_PASSWORD
  },
  db: {
    name: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    username: process.env.MONGO_USERNAME,
    password: process.env.MONGO_PASSWORD
  }
}