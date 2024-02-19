import { Jailbird } from "../app";

const { IgApiClient } = require('instagram-private-api');
const { get } = require('request-promise');

const postToInsta = async (jailbirds: Jailbird[]) => {
  const ig = new IgApiClient();
  ig.state.generateDevice(process.env.IG_USERNAME);
  await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);

  for (let i = 0; i < jailbirds.length; i++) {
    const imageBuffer = await get({
      url: jailbirds[i].picture,
      encoding: null, 
    });
  
    await ig.publish.photo({
      file: imageBuffer,
      caption: `${jailbirds[i].name}: ${jailbirds[i].charges}`
    });
  }
}

module.exports = { postToInsta };