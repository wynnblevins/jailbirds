import { buildJailbirds } from "./services/scraperService";

const axios = require("axios");
const cheerio = require("cheerio");
const mongoose = require("mongoose");
const {
  findAllJailbirds,
  createJailbird,
  deleteJailbird,
  updateJailbird,
} = require("./services/jailbirdService");
const { downloadFile } = require("./services/fileDownloadService");

const mongoURL =
  "mongodb+srv://wblevins:&AMsEsKzzo2K5&oi@jailbirds.55zx0ek.mongodb.net/jailbirds?retryWrites=true&w=majority";

mongoose.connect(mongoURL);

const run = async () => {
  console.log("scraping jailbird web page...");
  const pageJailbirds = await buildJailbirds();

  console.log("fetching jailbirds from database...");
  const dbJailbirds = await findAllJailbirds();

  console.log("checking for new jailbirds...");
  const newJailbirds = pageJailbirds?.filter(
    ({ inmateID: pageID }) =>
      !dbJailbirds?.some(({ inmateID: dbID }) => {
        return dbID === pageID;
      })
  );

  // TODO: write the code that downloads the mugshots to the mugshots dir
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
};

run();

export {};
