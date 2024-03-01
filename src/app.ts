require("dotenv").config();
const mongoose = require("mongoose");
const cron = require('node-cron');
const {
  findAllJailbirds,
  createJailbird,
} = require("./services/jailbirdService");
const { buildJailbirds: buildRichmondJailbirds } = require("./services/richmondScraperService");
const { buildJailbirds: buildHenricoJailbirds } = require("./services/henricoScraperService");
const { postToInsta } = require('./services/instagramPostService');
const { shuffle } = require('./services/shuffleService');

require("dotenv").config();

interface Jailbird {
  inmateID: string,
  name: string,
  charges: string,
  picture: string,
  facility: string,
  age: number,
  timestamp: string,
  isPosted: boolean
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

const run = async () => {
  const jailbirdsToPost: Jailbird[] = [];
  
  // get the current state of the jailbird webpages
  const webpageJailbirds = await scrapeWebpages();

  // get the current state of the jailbirds database
  console.log("Fetching jailbirds from database...");
  const dbJailbirds = await findAllJailbirds();

  // ask the database if there are any new jailbirds
  console.log("Checking for new jailbirds...");
  const newJailbirds = webpageJailbirds?.filter(
    ({ inmateID: pageID }) =>
      !dbJailbirds?.some(({ inmateID: dbID }) => {
        return dbID === pageID;
      })
  );

  if (newJailbirds) {
    // if it turns out that we have new jailbirds, create a db record of the newbies
    console.log(`Posting ${newJailbirds.length} jailbirds to instagram`);    

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
        );
        
        const jailbird: Jailbird = {
          inmateID: newJailbird.inmateID,
          name: newJailbird.name,
          charges: newJailbird.charges,
          picture: newJailbird.picture,
          facility: newJailbird.facility,
          age: newJailbird.age,
          timestamp: new Date().toISOString(),
          isPosted: false
        };
    
        jailbirdsToPost.push(jailbird)
      } catch (e: any) {
        console.error("Error encountered while creating jailbird.", e);
      }
    });
    
    return await postToInsta(jailbirdsToPost);
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
