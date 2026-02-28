import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Jailbird } from "../../app";

const config = require('../../utils/environment');

const {
  updateJailbird,
  findUnpostedJailbirds,
  deleteJailbird,
  findJailbirdByInmateId
} = require('../jailbirdService');

const { shuffle } = require('../shuffleService');
const { logMessage } = require('../loggerService');
const { base64ToImage } = require("./base64ToImgService");

const GRAPH_BASE = "https://graph.facebook.com/v19.0";

const randomIntFromInterval = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1) + min);

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const isValidHttpUrl = (string: string) => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

const logErrorAndDeleteJB = (jailbird: Jailbird) => {
  logMessage(
    `Encountered error while posting to instagram. Deleting problematic jailbird with ID ${jailbird?.inmateID}.`
  );
  return deleteJailbird(jailbird._id.toString());
};

const buildCaption = (jailbird: Jailbird) => {
  return (
    `\n\n${jailbird.name}, ${jailbird.age}: \n\n` +
    `${jailbird.facility} \n\n` +
    `${jailbird.charges} \n\n` +
    `${jailbird.hashtags.join(' ')}`
  );
};

/**
 * Converts base64 image to a public URL
 * Replace hosting logic if needed (S3 recommended)
 */
const uploadBase64AndGetUrl = async (jailbird: Jailbird): Promise<string> => {

  const formattedName = jailbird.name.replace(/\s+/g, '_');
  const fileName = `${formattedName}_${Date.now()}.jpg`;

  const outputDir = path.resolve('./out/images');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, fileName);

  await base64ToImage(jailbird.picture, filePath);

  const publicUrl = `${config.publicImageBaseUrl}/${fileName}`;

  logMessage(`Image hosted at ${publicUrl}`);

  return publicUrl;
};

const createMediaContainer = async (imageUrl: string, caption: string) => {
  const url = `${GRAPH_BASE}/${config.ig.igUserId}/media`;

  const res = await axios.post(url, null, {
    params: {
      image_url: imageUrl,
      caption,
      access_token: config.ig.accessToken
    }
  });

  return res.data.id;
};

const waitForContainerReady = async (creationId: string) => {

  const url = `${GRAPH_BASE}/${creationId}`;

  for (let i = 0; i < 30; i++) {

    const res = await axios.get(url, {
      params: {
        fields: "status_code",
        access_token: config.ig.accessToken
      }
    });

    const status = res.data.status_code;

    logMessage(`IG container ${creationId} status: ${status}`);

    if (status === "FINISHED") return;

    if (status === "ERROR") {
      throw new Error("Instagram container processing failed");
    }

    await sleep(3000);
  }

  throw new Error("Instagram container timeout");
};

const publishMedia = async (creationId: string) => {

  await waitForContainerReady(creationId);

  const url = `${GRAPH_BASE}/${config.ig.igUserId}/media_publish`;

  const res = await axios.post(url, null, {
    params: {
      creation_id: creationId,
      access_token: config.ig.accessToken
    }
  });

  return res.data;
};

const performPost = async (jailbird: Jailbird) => {

  try {

    logMessage(`Posting ${jailbird.name} to Instagram.`);

    let imageUrl = jailbird.picture;

    if (!isValidHttpUrl(imageUrl)) {
      imageUrl = await uploadBase64AndGetUrl(jailbird);
    }

    const caption = buildCaption(jailbird);

    const containerId = await createMediaContainer(imageUrl, caption);

    logMessage(`Container created: ${containerId}`);

    await publishMedia(containerId);

    await updateJailbird(jailbird.inmateID, { isPosted: true });

    logMessage(`Successfully posted ${jailbird.name}`);

  } catch (e: any) {

    console.error("Instagram Error:", e?.response?.data || e.message);

    await logErrorAndDeleteJB(jailbird);
  }
};

const postJailbirdById = async (inmateId: string) => {

  const jailbirdToPost = await findJailbirdByInmateId(inmateId);

  if (!jailbirdToPost) return;

  await performPost(jailbirdToPost);
};

const postBatchToInsta = async () => {

  const BATCH_SIZE = randomIntFromInterval(
    +config.minJailbirdsCount,
    +config.maxJailbirdsCount
  );

  logMessage(`Beginning to post ${BATCH_SIZE} jailbirds to Instagram.`);

  const unpostedJailbirds: Jailbird[] = await findUnpostedJailbirds();

  const shuffled = shuffle(unpostedJailbirds);

  const jailbirdsToPost = shuffled.slice(0, BATCH_SIZE);

  for (let i = 0; i < jailbirdsToPost.length; i++) {

    const randomWaitTime = randomIntFromInterval(
      +config.lowerWaitTimeBoundary,
      +config.upperWaitTimeBoundary
    );

    logMessage(`Waiting ${randomWaitTime} ms before posting.`);

    await sleep(randomWaitTime);

    await performPost(jailbirdsToPost[i]);
  }
};

module.exports = {
  postBatchToInsta,
  postJailbirdById
};