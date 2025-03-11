const mongoose = require("mongoose");
const _ = require("lodash");
const cron = require('node-cron');
const config = require('./utils/environment');
const {
  createMultipleJailbirds,
  findAllJailbirds,
  deleteOldJailbirdsFromFacility,
} = require("./services/jailbirdService");
const { buildJailbirds: buildHenricoJailbirds } = require("./services/henricoScraperService");
const { postToInsta } = require('./services/instagramPostService');
const { 
  filterSavedJailbirds,
  filterBoringJailbirds
} = require('./services/jailbirdFilterService');

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

  const resolvedData = await Promise.all(scraperPromises);
  return resolvedData.flat(1);
};

/**
 * deletes older jailbirds to keep us from running out of space
 */
const pruneDB = async () => {
  const HENRICO_COUNTY_REGIONAL_JAIL = 'HENRICO COUNTY REGIONAL JAIL';
  const THIRTY_DAYS = 30;
  
  const thirtyDaysAgo = new Date(
    new Date().setDate(new Date().getDate() - THIRTY_DAYS)
  );
  
  // get rid of Henrico jailbirds more than thirty days old
  await deleteOldJailbirdsFromFacility(
    HENRICO_COUNTY_REGIONAL_JAIL,
    thirtyDaysAgo
  );
};

const saveNewJailbirdsToDB = async (newJailbirds: Jailbird[]) => {
  try {
    await createMultipleJailbirds(newJailbirds);
  } catch (e: any) {
    console.error("Error encountered while creating jailbird.", e);
  }
};

/**
 * 
 * Filters out Henrico jailbirds that are likely to be uninteresting 
 * 
 * @param jailbirds an array of henrico county jailbirds
 * @param charge the charge we want to filter from the list of Jailbirds
 * @returns a filtered list of Jailbirds
 */
const filterBoringHenricoJBs = (jailbirds: Jailbird[]) => {
  const HENRICO_CONTEMPT_STR: string = 'OTHER OFFENSES-CONTEMPT OF COURT';
  const HENRICO_PROBATION_VIOLATION_STR: string = 'OTHER OFFENSES-PROBATION VIOLATION';
  const BORING_HENRICO_CHARGE_STRINGS = [
    HENRICO_CONTEMPT_STR,
    HENRICO_PROBATION_VIOLATION_STR
  ];
  
  const filteredJailbirds = []
  BORING_HENRICO_CHARGE_STRINGS.forEach((charge: string) => {
    jailbirds = filterBoringJailbirds(jailbirds, charge);
    filteredJailbirds.concat(jailbirds);
  });

  return jailbirds;
};

const run = async () => {
  pruneDB();

  // get the current jailbirds from the webpages
  const webpageJailbirds = await scrapeWebpages();

  // get a list of all known jailbirds (posted or unposted) from the DB
  const allDbJailbirds = await findAllJailbirds();

  // filter the webpage jailbirds we know about already
  const unsavedJailbirds = filterSavedJailbirds(allDbJailbirds, webpageJailbirds);

  // filter out the boring jailbirds (ie Contempt, Probation Violations, etc)
  const filteredUnsavedJBs = filterBoringHenricoJBs(unsavedJailbirds)

  // there will likely be duplicates in the combined array, remove the dupes
  const uniqueJailbirds = _.uniqBy(filteredUnsavedJBs, "inmateID");

  await saveNewJailbirdsToDB(uniqueJailbirds);

  // the remaining jailbirds will be what we want to post to instagram, do that here
  return await postToInsta();
};

cron.schedule('45 16 * * *', () => {
  run().then(() => {
    console.log('Program complete, stopping execution.');
  }).catch((e) => {
    console.log(`Program encountered error: ${e}`)
  });
// });

export { Jailbird };
