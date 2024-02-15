const https = require("https"); // or 'https' for https:// URLs
const fs = require("fs");

const downloadFile = (url: string, ndx: number) => {
  try {
    const stream = fs.createWriteStream(`./mugshots/mugshot${ndx}`);

    return https.get(url, (response) => {
      response.pipe(stream);

      // after download completed close filestream
      stream.on("finish", () => {
        stream.close();
        console.log("Download Completed");
      });
    });
  } catch (e) {
    console.error("oops");
  }
};

module.exports = { downloadFile };
