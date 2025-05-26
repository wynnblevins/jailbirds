const mongoose = require("mongoose");
const _ = require("lodash");
const cron = require('node-cron');
const argv = require('minimist')(process.argv);
const config = require('./utils/environment');
const { JAILS } = require('./utils/strings');
const {
  createMultipleJailbirds,
  findAllJailbirds,
  deleteOldJailbirdsFromFacility,
} = require("./services/jailbirdService");
import { buildJailbirds as buildHenricoJailbirds } from './services/henricoScraper/henricoScraperService';
import { buildJailbirds as buildRichmondJailbirds } from './services/richmondScraper/richmondScraperService';
const { postBatchToInsta, postJailbirdById } = require('./services/instagramPoster/instagramPostService');
const { 
  filterSavedJailbirds, 
  filterBoringJailbirds 
} = require('./services/jailbirdFilterService');
const { logMessage } = require('./services/loggerService');
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
  const richmondJbsPromise = buildRichmondJailbirds();
  scraperPromises.push(richmondJbsPromise);

  // scrape the Henrico jail roster webpage
  logMessage(
    "Scraping Henrico jailbird web page...", 
    JAILS.HENRICO_COUNTY_REGIONAL_JAIL
  );
  const henricoJbsPromise = buildHenricoJailbirds();
  scraperPromises.push(henricoJbsPromise);

  const resolvedData = await Promise.all(scraperPromises);
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

const saveNewJailbirdsToDB = async (newJailbirds: Jailbird[]) => {
  try {
    await createMultipleJailbirds(newJailbirds);
  } catch (e: any) {
    logMessage(`Error encountered while creating jailbird: ${e}`);
  }
};

const getJailbirdsToPost = async () => {
  let webpageJailbirds: Jailbird[] = [];
  try {
    // get the current jailbirds from the webpages
    webpageJailbirds = await scrapeWebpages();
  } catch (e: any) {
    logMessage(
      `Error encountered while scraping webpage, no new jailbirds will be saved to the db: ${e}`
    );
  }

  // get a list of all known jailbirds (posted or unposted) from the DB
  const allDbJailbirds = await findAllJailbirds();

  // filter the webpage jailbirds we know about already...
  let unsavedJailbirds = filterSavedJailbirds(allDbJailbirds, webpageJailbirds);

  // ...and filter the boring jailbirds
  const CONTEMPT_OF_COURT = "OTHER OFFENSES-CONTEMPT OF COURT";
  const PROBATION_VIOLATION = "OTHER OFFENSES-PROBATION VIOLATION";
  const noContemptJbs = filterBoringJailbirds(unsavedJailbirds, CONTEMPT_OF_COURT);
  const filteredJbs = filterBoringJailbirds(noContemptJbs, PROBATION_VIOLATION);
  
  // there will likely be duplicates in the combined array, remove the dupes
  return _.uniqBy(filteredJbs, "inmateID");
};

/**
 * posts a scrapes the jail webpages then creates a number of 
 * instagram posts based on what is configured in the env file
 */
const performBatchPost = async () => {
  // to keep from running out of database space, get rid of old jailbirds
  pruneDB();

  // scrape the jail webpages to get the refined/filtered list of jailbirds
  let jailbirds = [];
  try {
    jailbirds = await getJailbirdsToPost();
  } catch (e: any) {
    logMessage(`Encountered error while getting the list of Jailbirds: ${e}`);
  }

  // save any jailbirds we've got to the DB
  try {
    logMessage(`Saving ${jailbirds.length} new jailbirds to the database`);
    await saveNewJailbirdsToDB(jailbirds);
  } catch (e: any) {
    logMessage(`Encountered error while saving new jailbirds to the DB: ${e}`);
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
  cron.schedule('0 13 * * *', () => {
    performBatchPost().then(() => {
      logMessage('Program complete, stopping execution.');
    }).catch((e) => {
      logMessage(`Program encountered error: ${e}`);
      process.exit(1);
    });
  });  
}

export { Jailbird };
