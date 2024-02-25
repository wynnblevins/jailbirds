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

require("dotenv").config();

interface Jailbird {
  inmateID: String,
  name: String,
  charges: String,
  picture: String
}

const mongoURL = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.boa43ki.mongodb.net/${process.env.DATABASE_NAME}?retryWrites=true&w=majority`;

mongoose.connect(mongoURL);

const run = async () => {
  console.log("scraping Henrico jailbird web page...");
  const henricoPageJailbirds = await buildHenricoJailbirds();
  
  console.log("scraping Richmond jailbird web page...");
  const richmondPageJailbirds = await buildRichmondJailbirds();

  console.log("fetching jailbirds from database...");
  const dbJailbirds = await findAllJailbirds();

  const allPageJailbirds = henricoPageJailbirds.concat(richmondPageJailbirds)
  
  // console.log("checking for new jailbirds...");
  const newJailbirds = allPageJailbirds?.filter(
    ({ inmateID: pageID }) =>
      !dbJailbirds?.some(({ inmateID: dbID }) => {
        return dbID === pageID;
      })
  );

  console.log(`New jailbirds detected: ${JSON.stringify(newJailbirds)}`);
 
  const jailbirdsToPost = [];

  newJailbirds?.forEach(async (newJailbird: Jailbird, ndx: number) => {
    createJailbird(
      newJailbird.inmateID,
      newJailbird.name,
      newJailbird.charges,
      newJailbird.picture
    );

    const jailbird: Jailbird = {
      inmateID: newJailbird.inmateID,
      name: newJailbird.name,
      charges: newJailbird.charges,
      picture: newJailbird.picture
    };

    jailbirdsToPost.push(jailbird)
  });

  // generate a random number for the time to pause
  const randomInterval = randomIntFromInterval(480000, 960000);

  await new Promise(async (resolve) => { 
    // pausing to try and fool instagram API
    setTimeout(resolve, randomInterval);
  });

  console.log(JSON.stringify(jailbirdsToPost));
  await postToInsta(jailbirdsToPost); 
};

function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

// Schedule tasks to be run on the server.
//cron.schedule('0 18 * * *', async () => {
  console.log('Running webscraper.')
  run().then(() => {
    console.log('Jailbirds have been updated.');
    process.exit();
  }).catch((err) => {
    console.error('Encountered error while updating jailbirds. Halting script execution.', err);
    process.exit();
  })
//});

export { Jailbird };
