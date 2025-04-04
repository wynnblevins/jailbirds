import { Jailbird } from "../app";
import { JAILS } from "../utils/strings";
const puppeteer = require("puppeteer");
const { logMessage } = require('../services/loggerService');

const inmatesPageURL: string = "https://ppd.henrico.us/searcharrest.aspx";

const removeNumbersFromCharge = (charges: string) => {
  return charges.replace(/\d{1,4} - /i, "");
};

const capitalizeStrings = (jailbirds: Jailbird[]): Jailbird[] => {
  let capitalizedJailbirds: Jailbird[] = jailbirds.map((jailbird: Jailbird) => {
    jailbird.charges = jailbird.charges.toUpperCase();
    jailbird.name = jailbird.name.toUpperCase();
    return jailbird;
  });
  
  return capitalizedJailbirds;
};

/**
 * @param inmatePicUrl 
 * @returns the id of a henrico inmate
 */
const getIdFromImage = (inmatePicUrl: string): string => {
  const slashNdx = inmatePicUrl.lastIndexOf('/') + 1;
  const pictureFilename = inmatePicUrl.substring(slashNdx);
  const periodNdx = pictureFilename.indexOf('.');
  const id = pictureFilename.substring(0, periodNdx);
  return id;
};

/**
 * @param nonUniqueJailbirds a list of jailbirds with multiple instances of the same person 
 * @returns a list of inmates with the charges consolidated into one list
 */
const mergeJailbirdsIntoUnique = (nonUniqueJailbirds: Jailbird[]): Jailbird[] => {
  const uniqueJailbirds: Jailbird[] = []
  
  nonUniqueJailbirds.forEach(nonUniqueJailbird => {
    const existingJailbird = uniqueJailbirds.find((jailbird: Jailbird) => { 
      return jailbird.inmateID === nonUniqueJailbird.inmateID
    }); 

    if (existingJailbird) {
      existingJailbird.charges = existingJailbird.charges.concat(`, ${nonUniqueJailbird.charges}`);
    } else {
      uniqueJailbirds.push(nonUniqueJailbird);
    }
  });
  
  return uniqueJailbirds;
}

export const buildJailbirds = async (): Promise<Jailbird[]> => {
  let jailbirds: Jailbird[] = [];

  // open up a headless chrome
  logMessage('Launching headless browser for Henrico page.', JAILS.HENRICO_COUNTY_REGIONAL_JAIL);
  const browser = await puppeteer.launch({ 
    headless: true,
  });

  // go to the Henrico inmates page
  logMessage(
    `Going to ${inmatesPageURL}`, 
    JAILS.HENRICO_COUNTY_REGIONAL_JAIL
  );
  const page = await browser.newPage();
  
  try {
    await page.goto(inmatesPageURL, {
      waitUntil: 'load',
      timeout: 10000,
    });
  } catch (e: any) {
    logMessage(
      `Error encountered while going to ${inmatesPageURL}`, 
      JAILS.HENRICO_COUNTY_REGIONAL_JAIL
    );
  }

  // click the search button
  logMessage(
    'Clicking search button.', 
    JAILS.HENRICO_COUNTY_REGIONAL_JAIL
  );
  const form = await page.$('#ctl00_SearchContent_btnSubmit');
  await form.evaluate( form => form.click() );

  // wait for the search modal to disappear from the screen
  await page.waitForSelector('div.modalBody', {hidden: true});

  // tell page to load up 100 results
  const rowsSelect = await page.waitForSelector("select[name='ctl00_SearchContent_gvData_length']");
  await rowsSelect.select("100");

  // Get all the inmate name span elements using page.$$
  logMessage(
    'Getting all jailbird names from page',
    JAILS.HENRICO_COUNTY_REGIONAL_JAIL
  );
  const jailbirdSpans = await page.$$eval('table tr td span', spans => spans.map((span) => {
    return span.innerText;
  }));

  // Get all the inmate photo img elements using page.$$
  logMessage(
    'Getting all jailbird pictures from page',
    JAILS.HENRICO_COUNTY_REGIONAL_JAIL
  );
  const jailbirdPics = await page.$$eval('td > img', imgs => imgs.map((img) => {
    return img.src;
  }));

  // Create jailbirds in memory using scraped elements
  logMessage(
    'Creating jailbirds in memory.',
    JAILS.HENRICO_COUNTY_REGIONAL_JAIL
  );
  for (let i = 0, j = 0; i < jailbirdSpans?.length; i += 8, j++) {
    const inmateID = getIdFromImage(jailbirdPics[j]);
    
    const jailbird: Jailbird = {
      charges: removeNumbersFromCharge(jailbirdSpans[i + 3]),
      inmateID: inmateID,
      name: jailbirdSpans[i],
      picture: jailbirdPics[j],
      facility: JAILS.HENRICO_COUNTY_REGIONAL_JAIL,
      age: jailbirdSpans[i + 1],
      timestamp: new Date(),
      isPosted: false,
      hashtags: [
        '#jail',
        '#jailbirds',
        '#henricojail',
        '#rva',
        '#mugshots',
      ]
    };

    jailbirds.push(jailbird);
  }

  logMessage(
    'Merging jailbirds into a unique list.',
    JAILS.HENRICO_COUNTY_REGIONAL_JAIL
  );
  jailbirds = mergeJailbirdsIntoUnique(jailbirds);
  jailbirds = capitalizeStrings(jailbirds);

  logMessage('Closing browser session', JAILS.HENRICO_COUNTY_REGIONAL_JAIL);
  await browser.close();

  logMessage(
    `Returning ${jailbirds.length} jailbirds from henrico scraper service.`, 
    JAILS.HENRICO_COUNTY_REGIONAL_JAIL
  );
  return jailbirds;
};