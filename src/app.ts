require("dotenv").config();
const mongoose = require("mongoose");
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

  await postToInsta(jailbirdsToPost);
};

run().then(() => {
  process.exit(); 
});



export { Jailbird };
