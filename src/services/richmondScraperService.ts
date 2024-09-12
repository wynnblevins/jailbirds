import { Jailbird } from "../app";

const cheerio = require("cheerio");
const axios = require("axios");

const inmatesPageURL: string = "https://webapp01.richmondnc.com/dcn/inmates";

const getJailbirdAge = (listPage, inmateElement) => {
  const children = listPage(inmateElement).find('.dx-ar')
  const data = children[0].children[0].children[0].data;
  return +data;
}

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
  const ids = mugshotImg[0].attribs.src?.split("id=")[1];
  return ids?.split("&")[0];
};

export const buildJailbirds = async (): Promise<Jailbird[]> => {
  try {
    const jailbirds: Jailbird[] = [];
    const response = await axios.get(inmatesPageURL);
    const inmateListPage = await cheerio.load(response.data);

    const inmateProfileURLs = [];
    const inmateAges = [];

    inmateListPage(".dxgvDataRow_MaterialCompact").each(
      (ndx: number, inmateElement) => {
        const inmateProfileURL = getInmateProfileURL(
          inmateListPage,
          inmateElement
        );

        const result = getJailbirdAge(inmateListPage, inmateElement);
      
        // keeping these arrays parallel 
        inmateAges.push(result)
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
      const inmateObj: Jailbird = {
        inmateID,
        name,
        charges: groomedCharges,
        picture: profilePic,
        facility: 'RICHMOND CITY JAIL',
        age: inmateAges[i],
        timestamp: new Date(),
        isPosted: false,
        hashtags: [
          '#richmondcityjail',
          '#richmondjail', 
          '#jailbirds',
          '#lockedup', 
          '#jail', 
          '#rva', 
          '#richmondva', 
          '#richmond'
        ]
      };

      jailbirds.push(inmateObj);
    }

    return jailbirds;
  } catch (e: any) {
    console.error("Error occurred while building inmate objects.", e);
  }
};
