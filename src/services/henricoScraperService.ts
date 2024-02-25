import { children } from "cheerio/lib/api/traversing";
import { Jailbird } from "../app";
const puppeteer = require("puppeteer");

const inmatesPageURL = "https://ppd.henrico.us/searcharrest.aspx";

/**
 * 
 * @param inmatePicUrl 
 * @returns a string of number
 */
const getIdFromImage = (inmatePicUrl: string): string => {
  const slashNdx = inmatePicUrl.lastIndexOf('/') + 1;
  const pictureFilename = inmatePicUrl.substring(slashNdx);
  const periodNdx = pictureFilename.indexOf('.');
  const id = pictureFilename.substring(0, periodNdx);
  return id;
};

export const buildJailbirds = async () => {
  return new Promise(resolve => setTimeout(async () => {
    const jailbirds: Jailbird[] = [];
  
    const browser = await puppeteer.launch({ headless: true });

    const page = await browser.newPage();
    await page.goto(inmatesPageURL, {
      waitUntil: "networkidle2"
    });

    const form = await page.$('#ctl00_SearchContent_btnSubmit');
    await form.evaluate( form => form.click() );

    await page.waitForSelector('div.modalBody', {hidden: true});

    // Get all p elements using page.$$
    const jailbirdSpans = await page.$$eval('table tr td span', spans => spans.map((span) => {
      return span.innerText;
    }));

    const jailbirdPics = await page.$$eval('td > img', imgs => imgs.map((img) => {
      return img.src;
    }));

    for (let i = 0, j = 0; i < jailbirdSpans?.length; i += 8, j++) {
      const inmateID = getIdFromImage(jailbirdPics[j]);
      
      const jailbird: Jailbird = {
        charges: jailbirdSpans[i + 3],
        inmateID: inmateID,
        name: jailbirdSpans[i],
        picture: jailbirdPics[j]
      };
    
      jailbirds.push(jailbird);
    }

    await browser.close();
    resolve(jailbirds);
  }, 10000));
};