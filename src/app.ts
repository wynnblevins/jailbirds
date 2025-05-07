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

const scrapeWebpages = async (): Promise<Jailbird[]> => {
  const scraperPromises: Promise<any>[] = [];
  
  logMessage("Scraping Richmond jailbird web page...", JAILS.RICHMOND_CITY_JAIL);
  const richmondJbs = buildRichmondJailbirds();
  scraperPromises.push(richmondJbs);

  // scrape the Henrico mugshot web
  logMessage("Scraping Henrico jailbird web page...", JAILS.HENRICO_COUNTY_REGIONAL_JAIL);
  const henricoJbs = buildHenricoJailbirds();
  scraperPromises.push(henricoJbs);

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
    logMessage(`Error encountered while creating jailbird. ${e}`);
  }
};

const getJailbirdsToPost = async () => {
  // get the current jailbirds from the webpages
  const webpageJailbirds = await scrapeWebpages();

  // get a list of all known jailbirds (posted or unposted) from the DB
  const allDbJailbirds = await findAllJailbirds();

  // filter the webpage jailbirds we know about already...
  let unsaveJailbirds = filterSavedJailbirds(allDbJailbirds, webpageJailbirds);
  
  // ...and filter the boring jailbirds
  const CONTEMPT_OF_COURT = "OTHER OFFENSES-CONTEMPT OF COURT";
  const PROBATION_VIOLATION = "OTHER OFFENSES-PROBATION VIOLATION";
  const noContemptJbs = filterBoringJailbirds(unsaveJailbirds, CONTEMPT_OF_COURT);
  const filteredJbs = filterBoringJailbirds(noContemptJbs, PROBATION_VIOLATION);
  
  // there will likely be duplicates in the combined array, remove the dupes
  const jailbirds = _.uniqBy(filteredJbs, "inmateID");

  return jailbirds;
};

const performBatchPost = async () => {
  // to keep from running out of database space, get rid of old jailbirds
  pruneDB();

  // get the refined/filtered list of jailbirds and save to the db
  const jailbirds = await getJailbirdsToPost();
  await saveNewJailbirdsToDB(jailbirds);

  // remaining jbs will be what we want to post to instagram, do that here
  await postBatchToInsta();
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
      process.exit();
    });
  } else {
    performBatchPost().then(() => {
      logMessage('Program complete, stopping execution.');
      process.exit();
    }).catch((e) => {
      logMessage(`Program encountered error: ${e}`);
      process.exit();
    });
  }
} else {
  // if not running in manual mode, start the cron job
  cron.schedule('0 16 * * *', () => {
    performBatchPost().then(() => {
      logMessage('Program complete, stopping execution.');
    }).catch((e) => {
      logMessage(`Program encountered error: ${e}`);
    });
  });  
}

export { Jailbird };
