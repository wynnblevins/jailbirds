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

export const buildJailbirds = async () => {
  let jailbirds: Jailbird[] = [];

  const browser = await puppeteer.launch({ headless: true });

  const page = await browser.newPage();
  await page.goto(inmatesPageURL, {
    waitUntil: "networkidle2"
  });

  const form = await page.$('#ctl00_SearchContent_btnSubmit');
  await form.evaluate( form => form.click() );

  await page.waitForSelector('div.modalBody', {hidden: true});

  const rowsSelect = await page.$("select[name='ctl00_SearchContent_gvData_length']");
  await rowsSelect.select("100");

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
      charges: removeNumbersFromCharge(jailbirdSpans[i + 3]),
      inmateID: inmateID,
      name: jailbirdSpans[i],
      picture: jailbirdPics[j],
      facility: 'HENRICO COUNTY REGIONAL JAIL',
      age: jailbirdSpans[i + 1],
      timestamp: new Date().toISOString()
    };

    jailbirds.push(jailbird);
  }

  jailbirds = mergeJailbirdsIntoUnique(jailbirds);
  jailbirds = capitalizeStrings(jailbirds);

  await browser.close();

  return jailbirds;
};