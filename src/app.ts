const mongoose = require("mongoose");
const _ = require("lodash");
const cron = require('node-cron');
const argv = require('minimist')(process.argv);
const config = require('./utils/environment');
const {
  createMultipleJailbirds,
  findAllJailbirds,
  deleteOldJailbirdsFromFacility,
} = require("./services/jailbirdService");
const { buildJailbirds: buildHenricoJailbirds } = require("./services/henricoScraperService");
const { postToInsta, postJailbirdById } = require('./services/instagramPostService');
const { buildJailbirds: buildRichmondJailbirds } = require("./services/richmondScraperService");
const { filterSavedJailbirds } = require('./services/jailbirdFilterService');
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
  
  // scrape the Henrico mugshot web
  console.log("Scraping Henrico jailbird web page...");
  scraperPromises.push(buildHenricoJailbirds());

  console.log("Scraping Richmond jailbird web page...");
  scraperPromises.push(buildRichmondJailbirds());

  const resolvedData = await Promise.all(scraperPromises);
  return resolvedData.flat(1);
};

/**
 * deletes older jailbirds to keep us from running out of space
 */
const pruneDB = async () => {
  const HENRICO_COUNTY_REGIONAL_JAIL = 'HENRICO COUNTY REGIONAL JAIL';
  const RICHMOND_CITY_JAIL = 'RICHMOND CITY JAIL'
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
    HENRICO_COUNTY_REGIONAL_JAIL,
    thirtyDaysAgo
  );

  // get rid of Richmond jailbirds older than one year
  await deleteOldJailbirdsFromFacility(
    RICHMOND_CITY_JAIL,
    oneYearAgo,
  );
};

const saveNewJailbirdsToDB = async (newJailbirds: Jailbird[]) => {
  try {
    await createMultipleJailbirds(newJailbirds);
  } catch (e: any) {
    console.error("Error encountered while creating jailbird.", e);
  }
};

const performBatchPost = async () => {
  pruneDB();

  // get the current jailbirds from the webpages
  const webpageJailbirds = await scrapeWebpages();

  // get a list of all known jailbirds (posted or unposted) from the DB
  const allDbJailbirds = await findAllJailbirds();

  // filter the webpage jailbirds we know about already
  const unsavedJailbirds = filterSavedJailbirds(allDbJailbirds, webpageJailbirds);

  // there will likely be duplicates in the combined array, remove the dupes
  const uniqueJailbirds = _.uniqBy(unsavedJailbirds, "inmateID");

  await saveNewJailbirdsToDB(uniqueJailbirds);

  // the remaining jailbirds will be what we want to post to instagram, do that here
  return await postToInsta();
};

// check if we are performing the nightly batch or a manual run
if (argv.m) {
  const inmateId = argv._[2];
  if (inmateId) {
    const inmateIdStr = inmateId.toString();
    postJailbirdById(inmateIdStr).then(() => {
      console.log('Program complete, stopping execution.');
      process.exit();
    }).catch((e) => {
      console.error(`Program encountered error while performing manual post: ${e}`)
      process.exit();
    });
  } else {
    performBatchPost().then(() => {
      console.log('Program complete, stopping execution.');
      process.exit();
    }).catch((e) => {
      console.error(`Program encountered error: ${e}`);
      process.exit();
    });
  }
} else {
  // if not running in manual mode, start the cron job
  cron.schedule('0 16 * * *', () => {
    performBatchPost().then(() => {
      console.log('Program complete, stopping execution.');
    }).catch((e) => {
      console.error(`Program encountered error: ${e}`);
    });
  });  
}

export { Jailbird };
