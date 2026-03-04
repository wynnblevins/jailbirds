import axios from 'axios';
import { Jailbird } from "../../app";
import { delayMs } from '../delayService';

const config = require('../../utils/environment');

const {
  updateJailbird,
  findUnpostedJailbirds,
  deleteJailbird,
  findJailbirdByInmateId
} = require('../jailbirdService');

const { shuffle } = require('../shuffleService');
const { logMessage } = require('../loggerService');

const GRAPH_API_VERSION = 'v21.0'; // Check the latest version on [Meta for Developers](https://developers.facebook.com)

const randomIntFromInterval = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1) + min);

const buildPostCaption = (jailbird: Jailbird): string => 
  `${jailbird.name}, ${jailbird.age}:\n\n${jailbird.facility}\n\n${jailbird.charges}`;

const createMediaContainer = async (jailbird: Jailbird): Promise<string> => {

  const url = `https://graph.instagram.com/${GRAPH_API_VERSION}/${config.ig.userId}/media`;

  try {

    const response = await axios.post(url, {
      image_url: jailbird.picture,
      caption: buildPostCaption(jailbird),
      access_token: config.ig.accessToken
    });

    const containerId = response.data.id;

    logMessage(`Media Container ID: ${containerId}`);

    return containerId;

  } catch (error: any) {

    const metaError = error?.response?.data || error.message;

    logMessage(`Create container failed: ${JSON.stringify(metaError)}`);

    throw error;
  }
};

// 2. Publish the container
const publishMedia = async (containerId: string) => {

  const url = `https://graph.instagram.com/${GRAPH_API_VERSION}/${config.ig.userId}/media_publish`;

  try {

    const response = await axios.post(url, {
      creation_id: containerId,
      access_token: config.ig.accessToken
    });

    const mediaId = response.data.id;

    logMessage(`Media published: ${mediaId}`);

    return mediaId;

  } catch (error: any) {

    const metaError = error?.response?.data || error.message;

    logMessage(`Publish failed: ${JSON.stringify(metaError)}`);

    throw error;
  }
};

const performPost = async (jailbird: Jailbird) => {

  try {

    const containerId = await createMediaContainer(jailbird);

    await delayMs(2000);

    await publishMedia(containerId);

    await updateJailbird(jailbird?.inmateID, { isPosted: true });

    logMessage('Image upload and publishing complete!');

  } catch (error: any) {

    logMessage(`Upload failed: ${error.message}`);

    deleteJailbird(jailbird._id);
  }
};

const postJailbirdById = async (inmateID: string) => {
  try {
    const jailbird: Jailbird = await findJailbirdByInmateId(inmateID);
    await performPost(jailbird);
  } catch (error: any) {
    logMessage(`An error occurred while posting jailbird with ID ${inmateID}: ${error.message}`);
  }
};

const postBatchToInsta = async () => {
  const BATCH_SIZE = randomIntFromInterval(
    +config.minJailbirdsCount,
    +config.maxJailbirdsCount
  );

  logMessage(`Beginning to post ${BATCH_SIZE} jailbirds to instagram.`);

  try {
    const unpostedJailbirds: Jailbird[] = await findUnpostedJailbirds();
    const unpostedAndShuffledJBs: Jailbird[] = shuffle(unpostedJailbirds);
    const jailbirdsToPost = unpostedAndShuffledJBs.slice(0, BATCH_SIZE);

    for (let i = 0; i < jailbirdsToPost.length; i++) {
      const randomWaitTime = randomIntFromInterval(
        +config.lowerWaitTimeBoundary, 
        +config.upperWaitTimeBoundary
      );
      logMessage(`Waiting ${randomWaitTime} ms before posting.`);

      await delayMs(randomWaitTime);
      
      await performPost(jailbirdsToPost[i]);
      
    }
  } catch (e: any) {
    logMessage(`Encountered error while posting batch to instagram: ${e}`);
  }
}

export {
  postBatchToInsta,
  postJailbirdById
}