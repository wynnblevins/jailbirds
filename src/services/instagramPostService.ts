import { Jailbird } from "../app";

const { IgApiClient } = require('instagram-private-api');
const { get } = require('request-promise');

function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

const postToInsta = async (jailbirds: Jailbird[]) => {
  return new Promise<void>(async (done) => {
    const ig = new IgApiClient();
    ig.state.generateDevice(process.env.IG_USERNAME);
    await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);

    for (let i = 0; i < jailbirds.length; i++) {
      const imageBuffer = await get({
        url: jailbirds[i].picture,
        encoding: null, 
      });
    
      // temporarily setting wait time as 30 seconds to a minute
      const randomWaitTime = randomIntFromInterval(30000, 60000);
      await new Promise<void>(done => setTimeout(() => done(), randomWaitTime));  
      
      console.log(`Posting ${jailbirds[i].name} to instagram.`);
      await ig.publish.photo({
        file: imageBuffer,
        caption: `\n\n${jailbirds[i].name}, ${jailbirds[i].age}: \n\n${jailbirds[i].facility} \n\n${jailbirds[i].charges}`
      });  
    }

    done();
  });
}

module.exports = { postToInsta };