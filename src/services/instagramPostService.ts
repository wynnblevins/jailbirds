import { Jailbird } from "../app";

const { IgApiClient } = require('instagram-private-api');
const { get } = require('request-promise');
const { updateJailbird, findUnpostedJailbirds } = require('./jailbirdService');

const randomIntFromInterval = (min: number, max: number) => {  
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const performPost = async (ig, imageBuffer, jailbird: Jailbird) => {
  try {
    console.log(`Posting ${jailbird.name} to instagram.`);
    
    await ig.publish.photo({
      file: imageBuffer,
      caption: `\n\n${jailbird.name}, ${jailbird.age}: \n\n${jailbird.facility} \n\n${jailbird.charges} \n\n${jailbird.hashtags.join(', ')}`
    });

    return await updateJailbird(jailbird.inmateID, { isPosted: true });
  } catch (e: any) {
    console.error(`Encountered error ${e} while posting to instagram.`)
  }
};

const postToInsta = async () => {
  // only post 5 jailbirds at one time
  const BATCH_SIZE = randomIntFromInterval(5, 10);
  
  console.log('Beginning to post jailbirds to instagram.')

  const unpostedJailbirds: Jailbird[] = await findUnpostedJailbirds();
  const jailbirdsToPost = unpostedJailbirds.slice(0, BATCH_SIZE)

  return new Promise<void>(async (finishPosting) => {
    const ig = new IgApiClient();
    ig.state.generateDevice(process.env.IG_USERNAME);
    await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);

    for (let i = 0; i < jailbirdsToPost.length; i++) {
      const imageBuffer = await get({
        url: jailbirdsToPost[i].picture,
        encoding: null, 
      });
    
      // wait 30 minutes to an hour between posts
      const randomWaitTime = randomIntFromInterval(1800000, 3600000);
      console.log(`Waiting ${randomWaitTime} ms before posting.`);
      
      await new Promise<void>(done => setTimeout(() => {
        performPost(ig, imageBuffer, jailbirdsToPost[i]).then(() => {
          done();
        });
      }, randomWaitTime));        
    }

    finishPosting();
  });
}

module.exports = { postToInsta };