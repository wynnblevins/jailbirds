require("dotenv").config();
const mongoose = require("mongoose");
const {
  createMultipleJailbirds,
  deleteOldJailbirds,
  findAllJailbirds,
} = require("./services/jailbirdService");
const { buildJailbirds: buildHenricoJailbirds } = require("./services/henricoScraperService");
const { postToInsta } = require('./services/instagramPostService');
const { filterSavedJailbirds } = require('./services/jailbirdFilterService');
const _ = require("lodash");
const cron = require('node-cron');

import { Types } from 'mongoose';

require("dotenv").config();

interface Jailbird {
  _id?: Types.ObjectId,
  inmateID: string,
  name: string,
  charges: string,
  picture: string,
  facility: string,
  age: number,
  timestamp: string,
  isPosted: boolean,
  hashtags: string[]
}

const mongoURL = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.boa43ki.mongodb.net/${process.env.DATABASE_NAME}?retryWrites=true&w=majority`;

mongoose.connect(mongoURL);

const scrapeWebpages = async (): Promise<Jailbird[]> => {
  // scrape the Henrico mugshot web
  console.log("Scraping Henrico jailbird web page...");
  return await buildHenricoJailbirds();
};

const pruneDB = async () => {
  // delete jailbirds older than 30 days
  var d = new Date();
  d.setDate(d.getDate() - 30);
  console.log(d.toString());
  await deleteOldJailbirds(d);
};

const saveNewJailbirdsToDB = async (newJailbirds: Jailbird[]) => {
  try {
    await createMultipleJailbirds(newJailbirds);
  } catch (e: any) {
    console.error("Error encountered while creating jailbird.", e);
  }
};

const run = async () => {
  // delete any jailbirds older than 30 days
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


cron.schedule('30 22 * * *', () => {
  run().then(() => {
    console.log('Program complete, stopping execution.');
  }).catch((e) => {
    console.log(`Program encountered error: ${e}`)
  });
});

export { Jailbird };
