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
import { buildJailbirds as buildRichmondEastWestJailbirds } from './services/jailEastWestScraper';
const { postBatchToInsta, postJailbirdById } = require('./services/instagramPoster/instagramPostService');
import { logMessage } from './services/loggerService';
import { Types } from 'mongoose';

interface IJailbird {
  _id?: Types.ObjectId,
  inmateID: string,
  name: string,
  charges: string,
  picture: string,
  facility: string,
  age: number | undefined,
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
const scrapeWebpages = async (): Promise<IJailbird[]> => {
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

  // scrape the jail east/west web pages
  logMessage(
    "Scraping Richmond Jail East/West webpage...",
    `${JAILS.JAIL_EAST}/${JAILS.JAIL_WEST}`
  )

  try {
    const richmondEastWestJailbirdsPromise = buildRichmondEastWestJailbirds();
    scraperPromises.push(richmondEastWestJailbirdsPromise);
  } catch (e: any) {
    logMessage(
      "Error encountered while building Henrico East/West jailbirds", 
      `${JAILS.JAIL_EAST}/${JAILS.JAIL_WEST}`
    );
  }

  let resolvedData = [];
  try {
    resolvedData = await Promise.all(scraperPromises);
    return resolvedData?.flat(1);
  } catch (e: any) {
    logMessage('Error encountered while waiting for promises to resolve.');
  }

  return Promise.resolve([]);
};

/**
 * deletes older jailbirds to keep us from running out of space
 */
const pruneDB = async () => {
  const ONE_YEAR = 365;

  const oneYearAgo = new Date(
    new Date().setDate(new Date().getDate() - ONE_YEAR)
  )
  
  await deleteOldJailbirdsFromFacility(
    JAILS.RICHMOND_CITY_JAIL,
    oneYearAgo,
  );

  await deleteOldJailbirdsFromFacility(
    JAILS.HENRICO_COUNTY_REGIONAL_JAIL,
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
    }).catch((e: any) => {
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
  cron.schedule('0 18 * * *', () => {
    performBatchPost().then(() => {
      logMessage('Program complete, stopping execution.');
    }).catch((e) => {
      logMessage(`Program encountered error: ${e}`);
      process.exit(1);
    });
  });  
}

export { IJailbird };
