require("dotenv").config();
const mongoose = require("mongoose");
const {
  findAllJailbirds,
  createJailbird,
} = require("./services/jailbirdService");
const { buildJailbirds } = require("./services/scraperService");
const { downloadFile } = require("./services/fileDownloadService");

const mongoURL = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.boa43ki.mongodb.net/?retryWrites=true&w=majority`;

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

  newJailbirds.forEach(async (newJailbird, ndx: number) => {
    console.log(`downloading mugshot: ${newJailbird.picture}`);
    await downloadFile(newJailbird.picture, ndx);

    createJailbird(
      newJailbird.inmateID,
      newJailbird.name,
      newJailbird.charges,
      newJailbird.picture
    );
  });

  process.exit();
};

run();

export {};
