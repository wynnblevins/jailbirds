const https = require("https"); // or 'https' for https:// URLs
const fs = require("fs");
const { logMessage } = require('../services/loggerService');
const downloadFile = (url: string, ndx: number) => {
  try {
    const stream = fs.createWriteStream(`./mugshots/mugshot${ndx}`);

    return https.get(url, (response) => {
      response.pipe(stream);

      // after download completed close filestream
      stream.on("finish", () => {
        stream.close();
        logMessage("Download complete.")
      });
    });
  } catch (e) {
    console.error("error encountered downloading file", e);
  }
};

module.exports = { downloadFile };
