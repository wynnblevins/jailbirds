require("dotenv").config();
const { IgApiClient } = require("instagram-private-api");
const { get } = require("request-promise");

const postToInsta = async () => {
  const ig = new IgApiClient();
  ig.state.generateDevice(process.env.IG_USERNAME);

  try {
    await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
    console.log('Instagram login successful');
  } catch (e: any) {
    console.log(e)
  }
};
