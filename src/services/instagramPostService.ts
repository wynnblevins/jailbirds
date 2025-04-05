import { Jailbird } from "../app";
const { IgApiClient } = require('instagram-private-api');
const fs = require('fs');
const { get } = require('request-promise');
const config = require('../utils/environment');
const { 
  updateJailbird, 
  findUnpostedJailbirds, 
  deleteJailbird,
  findJailbirdByInmateId
} = require('./jailbirdService');
const { shuffle } = require('./shuffleService');
const { logMessage } = require('./loggerService');
import { readFile } from 'fs';
import { promisify } from 'util';
const readFileAsync = promisify(readFile);

const randomIntFromInterval = (min: number, max: number) => {  
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const isValidHttpUrl = (string: string) => {
  let url;
  
  try {
    url = new URL(string);
  } catch (_) {
    return false;  
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

const logErrorAndDeleteJB = (jailbird: Jailbird) => {
  console.error(`Encountered error while posting to instagram. Deleting problematic jailbird.`);
  return deleteJailbird(jailbird._id.toString())
};

const performLocalPost = async (ig, jailbird: Jailbird) => {
  try {
    await ig.publish.photo({
      file: await readFileAsync(jailbird.picture),
      caption: `\n\n${jailbird.name}, ${jailbird.age}: \n\n${jailbird.facility} \n\n${jailbird.charges} \n\n${jailbird.hashtags.join(', ')}`,
    });
    return await updateJailbird(jailbird.inmateID, { isPosted: true });
  } catch (e: any) {
    logErrorAndDeleteJB(jailbird);
  }
}

const performUrlPost = async (ig, imageBuffer, jailbird: Jailbird) => {
  try {
    logMessage(`Posting ${jailbird.name} to instagram.`);
    
    await ig.publish.photo({
      file: imageBuffer,
      caption: `\n\n${jailbird.name}, ${jailbird.age}: \n\n${jailbird.facility} \n\n${jailbird.charges} \n\n${jailbird.hashtags.join(', ')}`
    });

    return await updateJailbird(jailbird.inmateID, { isPosted: true });
  } catch (e: any) {
    logErrorAndDeleteJB(jailbird);
  }
};

const getImageBuffer = async (jailbird: Jailbird): Promise<object | undefined> => {
  try {
    return await get({
      url: jailbird.picture,
      encoding: null, 
    });
  } catch (e: any) {
    logMessage(e.message);
    logMessage(`Encountered error while getting image buffer.  Deleting problematic jailbird.`);
    deleteJailbird(jailbird);
  }
};

const postJailbirdById = async (inmateId: string) => {
  const jailbirdToPost = await findJailbirdByInmateId(inmateId);
  const ig = new IgApiClient();
  ig.state.generateDevice(config.ig.username);
  await ig.account.login(config.ig.username, config.ig.password);
  
  if (isValidHttpUrl(jailbirdToPost.picture)) {
    const imageBuffer = await getImageBuffer(jailbirdToPost);
    await performUrlPost(ig, imageBuffer, jailbirdToPost);
  } else {
    await performLocalPost(ig, jailbirdToPost);
  }  
}

const postBatchToInsta = async () => {
  const BATCH_SIZE = randomIntFromInterval(+config.minJailbirdsCount, +config.maxJailbirdsCount);
  logMessage(`Beginning to post ${BATCH_SIZE} jailbirds to instagram.`);

  const unpostedJailbirds: Jailbird[] = await findUnpostedJailbirds();
  const unpostedAndShuffledJBs: Jailbird[] = shuffle(unpostedJailbirds);
  const jailbirdsToPost = unpostedAndShuffledJBs.slice(0, BATCH_SIZE)

  return new Promise<void>(async (finishPosting) => {
    const ig = new IgApiClient();
    ig.state.generateDevice(config.ig.username);
    await ig.account.login(config.ig.username, config.ig.password);

    for (let i = 0; i < jailbirdsToPost.length; i++) {
      const imageBuffer = await getImageBuffer(jailbirdsToPost[i]);
    
      if (imageBuffer) {
        // wait 30 minutes to an hour between posts
        const randomWaitTime = randomIntFromInterval(
          +config.lowerWaitTimeBoundary, 
          +config.upperWaitTimeBoundary
        );
        logMessage(`Waiting ${randomWaitTime} ms before posting.`);
        
        await new Promise<void>(done => setTimeout(() => {
          if (isValidHttpUrl(jailbirdsToPost[i].picture)) {
            performUrlPost(ig, imageBuffer, jailbirdsToPost[i]).then(() => {
              done();
            });
          } else {
            performLocalPost(ig, jailbirdsToPost[i]).then(() => {
              done();
            });
          }
        }, randomWaitTime));
      }        
    }

    finishPosting();
  });
}

module.exports = { 
  postBatchToInsta,
  postJailbirdById
};