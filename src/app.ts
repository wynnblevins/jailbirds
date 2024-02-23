require("dotenv").config();
const mongoose = require("mongoose");
const cron = require('node-cron');
const {
  findAllJailbirds,
  createJailbird,
} = require("./services/jailbirdService");
const { buildJailbirds } = require("./services/scraperService");
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
  console.log("scraping jailbird web page...");
  const pageJailbirds = await buildJailbirds();

  console.log("fetching jailbirds from database...");
  const dbJailbirds = await findAllJailbirds();

  console.log(dbJailbirds);

  console.log("checking for new jailbirds...");
  const newJailbirds = pageJailbirds?.filter(
    ({ inmateID: pageID }) =>
      !dbJailbirds?.some(({ inmateID: dbID }) => {
        return dbID === pageID;
      })
  );

  console.log(`New Jailbirds: ${JSON.stringify(newJailbirds)}`);
 
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

  await new Promise(async (resolve) => { 
    // pausing to try and fool instagram
    setTimeout(resolve, 15000);
  });

  await postToInsta(jailbirdsToPost); 
};

// Schedule tasks to be run on the server.
cron.schedule('0 16 * * *', async () => {
  console.log('Running webscraper.')
  run().then(() => {
    console.log('Jailbirds have been updated.');
  }).catch((err) => {
    console.error('Encountered error while updating jailbirds. Halting script execution.', err);
    process.exit();
  })
});

export { Jailbird };
