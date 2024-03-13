require("dotenv").config();
const mongoose = require("mongoose");
const {
  createJailbird,
  deleteOldJailbirds,
  findUnpostedJailbirds,
  findJailbirdByInmateId
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

/**
 * filters the jailbirds that are are posted to instagram
 * 
 * @param pageJailbirds jailbirds that exist on the jail webpage
 * @returns a list of unposted jailbirds from the jail webpages
 */
const getJailbirdsToPost = (pageJailbirds: Jailbird[], 
  dbJailbirds: Jailbird[]): Jailbird[] => {
  
  if (!dbJailbirds.length) {
    return pageJailbirds;
  }

  let unpostedJailbirds = pageJailbirds.filter(e => {
    return dbJailbirds.some(item => item.inmateID === e.inmateID);
  });
  
  return unpostedJailbirds
};

const run = async () => {
  // TODO: delete any jailbirds older than 30 days
  // pruneDB();

  // get the current unposted jailbirds from the database
  console.log("Fetching jailbirds from database...");
  const dbJailbirds = await findUnpostedJailbirds();

  // get the current unposted jailbirds from the webpages
  const allWebpageJailbirds = await scrapeWebpages();
  
  const newJailbirds = getJailbirdsToPost(
    allWebpageJailbirds, 
    dbJailbirds
  );

  if (newJailbirds) {  
    console.log(`${newJailbirds.length} unposted jailbirds detected...`)
    
    // randomize the order of the jailbirds
    const shuffledJailbirds = shuffle(newJailbirds);

    

    // save any new jailbirds to the database
    shuffledJailbirds?.forEach(async (jailbird: Jailbird) => {
      
      const dbJailbird = await findJailbirdByInmateId(jailbird.inmateID);
      
      try {
        // if the jailbird hasn't been saved to the DB
        if (!dbJailbird) { 
          console.log(`Saving ${jailbird.name} to the database`)

          await createJailbird(
            jailbird.inmateID,
            jailbird.name,
            jailbird.charges,
            jailbird.picture,
            jailbird.facility,
            new Date().toISOString(),
            jailbird.hashtags,
            jailbird.age
          );
        }
      } catch (e: any) {
        console.error("Error encountered while creating jailbird.", e);
      }
    });

    return await postToInsta(shuffledJailbirds);
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
