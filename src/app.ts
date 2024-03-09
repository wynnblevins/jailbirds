require("dotenv").config();
const mongoose = require("mongoose");
const cron = require('node-cron');
const {
  findAllJailbirds,
  createJailbird,
  deleteOldJailbirds
} = require("./services/jailbirdService");
const { buildJailbirds: buildRichmondJailbirds } = require("./services/richmondScraperService");
const { buildJailbirds: buildHenricoJailbirds } = require("./services/henricoScraperService");
const { postToInsta } = require('./services/instagramPostService');
const { shuffle } = require('./services/shuffleService');
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
  // scrape both the Henrico and Richmond mugshot web pages
  console.log("Scraping Henrico jailbird web page...");
  const henricoPageJailbirds = await buildHenricoJailbirds();
  
  console.log("Scraping Richmond jailbird web page...");
  const richmondPageJailbirds = await buildRichmondJailbirds();
  
  // consolidate the two page jailbirds lists into a single list of jailbirds
  return henricoPageJailbirds.concat(richmondPageJailbirds)
};

const pruneDB = async () => {
  // delete jailbirds older than 30 days
  var d = new Date();
  d.setDate(d.getDate() - 30);
  console.log(d.toString());
  await deleteOldJailbirds(d);
};

const run = async () => {
  pruneDB();

  // get the current state of the jailbirds database
  console.log("Fetching jailbirds from database...");
  const dbJailbirds = await findAllJailbirds();

  // get the current state of the jailbird webpages
  const webpageJailbirds = await scrapeWebpages();

  // ask the database if there are any new jailbirds
  console.log("Checking for new jailbirds...");
  const newJailbirds = webpageJailbirds?.filter(
    ({ inmateID: pageID }) =>
      !dbJailbirds?.some(({ inmateID: dbID }) => {
        return dbID === pageID;
      })
  );

  if (newJailbirds) {    
    // randomize the order of the jailbirds
    const shuffledJailbirds = shuffle(newJailbirds);

    shuffledJailbirds?.forEach(async (newJailbird: Jailbird, ndx: number) => {
      try {
        await createJailbird(
          newJailbird.inmateID,
          newJailbird.name,
          newJailbird.charges,
          newJailbird.picture,
          newJailbird.facility,
          new Date().toISOString(),
          newJailbird.hashtags,
          newJailbird.age
        );
      } catch (e: any) {
        console.error("Error encountered while creating jailbird.", e);
      }
    });
    
    return await postToInsta();
  }
};

run().then(() => {
  console.log('Program complete, stopping execution.');
}).catch((e) => {
  console.log(`Program encountered error: ${e}`)
}).finally(() => {
  process.exit();
});

export { Jailbird };
