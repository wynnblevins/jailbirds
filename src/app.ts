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
  const newJailbirds = pageJailbirds.filter(
    ({ name: pageName }) =>
      !dbJailbirds.some(({ value: dbName }) => dbName === pageName)
  );

  console.log("new jailbirds detected:");
  console.log(`${JSON.stringify(newJailbirds)}`);

  // TODO: write the code that downloads the mugshots to the mugshots dir
  newJailbirds.forEach(async (newJailbird, ndx: number) => {
    console.log(`downloading mugshot: ${newJailbird.picture}`);
    await downloadFile(newJailbird.picture, ndx);
  });
};

run();

export {};
