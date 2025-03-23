import { Jailbird } from "../app";
const puppeteer = require("puppeteer");

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
  console.log('Launching headless browser for Henrico page.');
  const browser = await puppeteer.launch({ 
    headless: true,
  });

  // go to the Henrico inmates page
  console.log(`Going to ${inmatesPageURL}`);
  const page = await browser.newPage();
  
  try {
    await page.goto(inmatesPageURL, {
      waitUntil: 'load',
      timeout: 10000,
    });
  } catch (e: any) {
    console.log(`Error encountered while going to ${inmatesPageURL}`);
  }

  // click the search button
  console.log('Clicking search button.');
  const form = await page.$('#ctl00_SearchContent_btnSubmit');
  await form.evaluate( form => form.click() );

  // wait for the search modal to disappear from the screen
  await page.waitForSelector('div.modalBody', {hidden: true});

  // tell page to load up 100 results
  const rowsSelect = await page.waitForSelector("select[name='ctl00_SearchContent_gvData_length']");
  await rowsSelect.select("100");

  // Get all the inmate name span elements using page.$$
  console.log('Getting all jailbird names from page');
  const jailbirdSpans = await page.$$eval('table tr td span', spans => spans.map((span) => {
    return span.innerText;
  }));

  // Get all the inmate photo img elements using page.$$
  console.log('Getting all jailbird pictures from page');
  const jailbirdPics = await page.$$eval('td > img', imgs => imgs.map((img) => {
    return img.src;
  }));

  // Create jailbirds in memory using scraped elements
  console.log('Creating jailbirds in memory.');
  for (let i = 0, j = 0; i < jailbirdSpans?.length; i += 8, j++) {
    const inmateID = getIdFromImage(jailbirdPics[j]);
    
    const jailbird: Jailbird = {
      charges: removeNumbersFromCharge(jailbirdSpans[i + 3]),
      inmateID: inmateID,
      name: jailbirdSpans[i],
      picture: jailbirdPics[j],
      facility: 'HENRICO COUNTY REGIONAL JAIL',
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

  console.log('Merging jailbirds into a unique list.');
  jailbirds = mergeJailbirdsIntoUnique(jailbirds);
  jailbirds = capitalizeStrings(jailbirds);

  console.log('Closing browser session');
  await browser.close();

  console.log(`Returning ${jailbirds.length} jailbirds from scraper service.`);
  return jailbirds;
};