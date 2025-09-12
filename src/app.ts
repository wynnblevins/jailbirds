const mongoose = require("mongoose");
const _ = require("lodash");
const cron = require('node-cron');
const argv = require('minimist')(process.argv);
const config = require('./utils/environment');
const { JAILS } = require('./utils/strings');
const {
  deleteOldJailbirdsFromFacility,
} = require("./services/jailbirdService");
import { buildJailbirds as buildHenricoJailbirds } from './services/henricoScraper/henricoScraperService';
import { buildJailbirds as buildRichmondJailbirds } from './services/richmondScraper/richmondScraperService';
const { postBatchToInsta, postJailbirdById } = require('./services/instagramPoster/instagramPostService');
import { logMessage } from './services/loggerService';
import { Types } from 'mongoose';

interface Jailbird {
  _id?: Types.ObjectId,
  inmateID: string,
  name: string,
  charges: string,
  picture: string,
  facility: string,
  age: number,
  timestamp: Date,
  isPosted: boolean,
  hashtags: string[]
}

const mongoURL = `mongodb+srv://${config.db.username}:${config.db.password}@${config.db.host}/${config.db.name}?retryWrites=true&w=majority`;
mongoose.connect(mongoURL);

/**
 * Scrapes the Richmond and Henrico jail webpages
 * 
 * @returns a promise for the jailbirds currently on the jail webpages
 */
const scrapeWebpages = async (): Promise<Jailbird[]> => {
  const scraperPromises: Promise<any>[] = [];
  
  // scrape the Richmond jail roster webpage
  logMessage(
    "Scraping Richmond jailbird web page...", 
    JAILS.RICHMOND_CITY_JAIL
  );

  try {
    const richmondJbsPromise = buildRichmondJailbirds();
    scraperPromises.push(richmondJbsPromise);
  } catch (e: any) {
    logMessage(
      "Error encountered while building Richmond jailbirds", 
      JAILS.RICHMOND_CITY_JAIL
    );
  }

  // scrape the Henrico jail roster webpage
  logMessage(
    "Scraping Henrico jailbird web page...", 
    JAILS.HENRICO_COUNTY_REGIONAL_JAIL
  );

  try {
    const henricoJbsPromise = buildHenricoJailbirds();
    scraperPromises.push(henricoJbsPromise);
  } catch (e: any) {
    logMessage(
      "Error encountered while building Henrico jailbirds", 
      JAILS.HENRICO_COUNTY_REGIONAL_JAIL
    );
  }
  
  let resolvedData = [];
  try {
    resolvedData = await Promise.all(scraperPromises);
  } catch (e: any) {
    throw new Error('Error encountered while waiting for promises to resolve.');
  }
  
  return resolvedData.flat(1);
};

/**
 * deletes older jailbirds to keep us from running out of space
 */
const pruneDB = async () => {
  const THIRTY_DAYS = 30;
  const ONE_YEAR = 365;

  const thirtyDaysAgo = new Date(
    new Date().setDate(new Date().getDate() - THIRTY_DAYS)
  );

  const oneYearAgo = new Date(
    new Date().setDate(new Date().getDate() - ONE_YEAR)
  )
  
  // get rid of Henrico jailbirds more than thirty days old
  await deleteOldJailbirdsFromFacility(
    JAILS.HENRICO_COUNTY_REGIONAL_JAIL,
    thirtyDaysAgo
  );

  // get rid of Richmond jailbirds older than one year
  await deleteOldJailbirdsFromFacility(
    JAILS.RICHMOND_CITY_JAIL,
    oneYearAgo,
  );
};

/**
 * posts a scrapes the jail webpages then creates a number of 
 * instagram posts based on what is configured in the env file
 */
const performBatchPost = async () => {
  // to keep from running out of database space (free tier plan ftw), get rid of old jailbirds
  pruneDB();

  // scrape the jail webpages and update the database
  try {
    await scrapeWebpages();
  } catch (e: any) {
    logMessage(`Encountered error while getting the list of Jailbirds: ${e}`);
  }

  // remaining jbs in DB will be what we want to post to instagram, do that here
  return await postBatchToInsta();
};

// check if we are performing the nightly batch or a manual run
if (argv.m) {
  const inmateId = argv._[2];
  if (inmateId) {
    const inmateIdStr = inmateId.toString();
    postJailbirdById(inmateIdStr).then(() => {
      logMessage("Program complete, stopping execution.")
      process.exit();
    }).catch((e) => {
      logMessage(`Program encountered error while performing manual post: ${e}`);
      process.exit(1);
    });
  } else {
    performBatchPost().then(() => {
      logMessage('Program complete, stopping execution.');
      process.exit();
    }).catch((e) => {
      logMessage(`Program encountered error: ${e}`);
      process.exit(1);
    });
  }
} else {
  logMessage('Starting cron job.');
  
  // if not running in manual mode, start the cron job
  cron.schedule('0 15 * * *', () => {
    performBatchPost().then(() => {
      logMessage('Program complete, stopping execution.');
    }).catch((e) => {
      logMessage(`Program encountered error: ${e}`);
      process.exit(1);
    });
  });  
}

export { Jailbird };
