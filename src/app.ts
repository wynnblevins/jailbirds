import { children } from "cheerio/lib/api/traversing";

const axios = require("axios");
const cheerio = require("cheerio");

const inmatesPageURL = "https://webapp01.richmondnc.com/dcn/inmates";

const getInmateProfileURL = (listPage, inmateElement) => {
  const children = listPage(inmateElement).children();
  const result = children.find("a").attr("href");
  let inmateProfileURL = `https://webapp01.richmondnc.com${result}`;
  const url = inmateProfileURL.replace("%3d&amp", "&");
  return url;
};

const getNameFromProfilePage = (profile) => {
  const name = profile("#HeaderText");
  return name.first().text();
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

const buildJailbirds = async () => {
  try {
    const response = await axios.get(inmatesPageURL);
    // console.log(response.data);

    // scrape web page and get list of all inmates
    const inmateListPage = await cheerio.load(response.data);

    inmateListPage(".dxgvDataRow_MaterialCompact").each(
      async (ndx: number, inmateElement) => {
        const inmateProfileURL = getInmateProfileURL(
          inmateListPage,
          inmateElement
        );

        let profileResponse = await axios.get(inmateProfileURL);
        const profile = await cheerio.load(profileResponse.data);

        const name = getNameFromProfilePage(profile);

        const charges = profile(
          "#ChargeGrid_DXMainTable tr td:nth-of-type(1) a"
        );

        // assemble the jailbird's charges
        let chargesText: string = charges.text();
        const groomedCharges = createChargesStr(chargesText);

        // attach the mugshot image
        const profilePic = getProfilePicFromProfilePage(profile);

        // build the inmate object
        const inmateObj = {
          name,
          charges: groomedCharges,
          picture: profilePic,
        };

        console.log(inmateObj);
      }
    );
  } catch (e: any) {
    console.error("oopsie whoopsie!");
  }
};

buildJailbirds();
