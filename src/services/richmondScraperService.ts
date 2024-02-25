import { Jailbird } from "../app";

const cheerio = require("cheerio");
const axios = require("axios");

const inmatesPageURL = "https://webapp01.richmondnc.com/dcn/inmates";

const getNameFromProfilePage = (profile) => {
  const name = profile("#HeaderText");
  return name.first().text();
};

const getInmateProfileURL = (listPage, inmateElement) => {
  const children = listPage(inmateElement).children();
  const result = children.find("a").attr("href");
  let inmateProfileURL = `https://webapp01.richmondnc.com${result}`;
  const url = inmateProfileURL.replace("%3d&amp", "&");
  return url;
};

const createChargesStr = (charges: string) => {
  let groomedCharges = charges.replace(/\t/g, "");
  groomedCharges = groomedCharges.replace(/\n\n/g, ", ");
  return groomedCharges.trim();
};

const getProfilePicFromProfilePage = (profile) => {
  const mugshotImg = profile("#mugShotImg");
  return `https://webapp01.richmondnc.com/DCN/${mugshotImg[0].attribs.src}`;
};

const getInmateIDFromProfilePage = (profile) => {
  const mugshotImg = profile("#mugShotImg");
  const ids = mugshotImg[0].attribs.src.split("id=")[1];
  return ids.split("&")[0];
};

export const buildJailbirds = async () => {
  try {
    const jailbirds: Jailbird[] = [];
    const response = await axios.get(inmatesPageURL);
    const inmateListPage = await cheerio.load(response.data);

    const inmateProfileURLs = [];
    inmateListPage(".dxgvDataRow_MaterialCompact").each(
      (ndx: number, inmateElement) => {
        const inmateProfileURL = getInmateProfileURL(
          inmateListPage,
          inmateElement
        );

        inmateProfileURLs.push(inmateProfileURL);
      }
    );

    for (let i = 0; i < inmateProfileURLs.length; i++) {
      let profileResponse = await axios.get(inmateProfileURLs[i]);
      const profile = await cheerio.load(profileResponse.data);
      const name = getNameFromProfilePage(profile);

      const charges = profile("#ChargeGrid_DXMainTable tr td:nth-of-type(1) a");

      // assemble the jailbird's charges
      let chargesText: string = charges.text();
      const groomedCharges = createChargesStr(chargesText);

      // attach the mugshot image
      const profilePic = getProfilePicFromProfilePage(profile);

      const inmateID = getInmateIDFromProfilePage(profile);

      // build the inmate object
      const inmateObj = {
        inmateID,
        name,
        charges: groomedCharges,
        picture: profilePic,
      };

      jailbirds.push(inmateObj);
    }

    return jailbirds;
  } catch (e: any) {
    console.error("Error occurred while building inmate objects.", e);
  }
};
