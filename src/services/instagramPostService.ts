import { Jailbird } from "../app";
const { IgApiClient } = require('instagram-private-api');
const { get } = require('request-promise');
const config = require('../utils/environment');
const { 
  updateJailbird, 
  findUnpostedJailbirds, 
  deleteJailbird,
  findJailbirdByInmateId
} = require('./jailbirdService');
const { shuffle } = require('./shuffleService')
const { readFile } = require('fs');
const { promisify } = require('util');
const fs = require('fs');
const path = require('node:path');

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
    console.error(`Encountered error while posting to instagram. Deleting problematic jailbird.`);
    deleteJailbird(jailbird._id.toString())
  }
};

const getHenricoImageBuffer = async (jailbird: Jailbird): Promise<object | undefined> => {
  try {
    return await get({
      url: jailbird.picture,
      encoding: null, 
    });
  } catch (e: any) {
    console.error(e.message);
    console.error(`Encountered error while getting image buffer.  Deleting problematic jailbird.`);
    deleteJailbird(jailbird);
  }
};

const postJailbirdById = async (inmateId: string) => {
  const jailbirdToPost = await findJailbirdByInmateId(inmateId);
  // const jailbirdToPost = await findUnpostedJailbirds();
  const ig = new IgApiClient();
  ig.state.generateDevice(config.ig.username);
  await ig.account.login(config.ig.username, config.ig.password);
  
  const imageBuffer = await getImageBuffer(jailbirdToPost);

  if (imageBuffer) {
    try {
      await performPost(ig, imageBuffer, jailbirdToPost)
    } catch (e: any) {
      console.error(e);
    }
  } else {
    console.error(`No jailbird for ID ${inmateId} found.`)
  }        
}

const postBatchToInsta = async () => {
  const BATCH_SIZE = randomIntFromInterval(+config.minJailbirdsCount, +config.maxJailbirdsCount);
  console.log(`Beginning to post ${BATCH_SIZE} jailbirds to instagram.`)

  const unpostedJailbirds: Jailbird[] = await findUnpostedJailbirds();
  const unpostedAndShuffledJBs: Jailbird[] = shuffle(unpostedJailbirds);
  const jailbirdsToPost = unpostedAndShuffledJBs.slice(0, BATCH_SIZE)

  return new Promise<void>(async (finishPosting) => {
    const ig = new IgApiClient();
    ig.state.generateDevice(config.ig.username);
    await ig.account.login(config.ig.username, config.ig.password);

    for (let i = 0; i < jailbirdsToPost.length; i++) {
      if (jailbirdsToPost[i].facility === 'HENRICO COUNTY REGIONAL JAIL') {
        await postHenricoJB(ig, jailbirdsToPost[i]);
      } else {
        await postRichmondJB(ig, jailbirdsToPost[i]);
      }
              
    }

    finishPosting();
  });
}

module.exports = { 
  postBatchToInsta,
  postJailbirdById
};