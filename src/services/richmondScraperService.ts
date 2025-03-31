import { Jailbird } from "../app";
const { getRandNumInRange } = require('./randomNumberService');
const puppeteer = require("puppeteer");
const { solveRichmondCaptcha: solveCaptcha } = require('./capchaService');
const inmatesPageURL: string = "https://omsweb.secure-gps.com/jtclientweb/jailtracker/index/Richmond_Co_VA";
const names = require('../data/names');
const { base64ToImage } = require('./base64ToImgService');
const fs = require('fs');

const proveHumanity = async (page) => {
  try {
    const CAPTCHA_TEXT_FIELD_ID = '#captchaCode';
    const CAPTCHA_IMG_ID = '#img-captcha';

    // solve the captcha answer
    await page.waitForSelector(CAPTCHA_IMG_ID);
    const captchaSrc = await page.$eval(CAPTCHA_IMG_ID, (el) => el.getAttribute('src'));
    const { data: { request: captchaAnswer } } = await solveCaptcha(captchaSrc);
  
    // enter the captch answer on the web page
    await page.waitForSelector(CAPTCHA_TEXT_FIELD_ID);
    await page.focus(CAPTCHA_TEXT_FIELD_ID); //you need to focus on the textField
    await page.type(CAPTCHA_TEXT_FIELD_ID, captchaAnswer);

    // get the validate button and click it
    let buttons = await page.$$('button.btn');
    await buttons[1].click();  
  } catch (e: any) {
    console.error(`Error encountered while proving humanity`, e);
  }
};

export const buildJailbirds = async (): Promise<Jailbird[]> => {
  console.log('Launching headless browser for Richmond page.');
  const browser = await puppeteer.launch({ 
    headless: false,
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
    console.error(`Error encountered while loading initial captcha page at ${inmatesPageURL}`);
  }

  // get past the captcha screen
  try {
    await proveHumanity(page);
  } catch (e: any) {
    console.error(`Error encounted while proving humanity`, e);
  }
  
  // get a list of jailbirds from the Richmond Jail webpage
  const webpageJailbirds: Jailbird[] = await doJBSearches(page);
  return webpageJailbirds;
};

const getRandomSubset = (arr, size) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

const doJBSearches = async (page): Promise<Jailbird[]> => {
  let webpageJailbirds: Jailbird[] = [];
  
  // TODO: move these values to .env file
  const upper = 3;
  const lower = 3;
  const numOfSearches = getRandNumInRange(lower, upper)
  const namesSubset = getRandomSubset(names, numOfSearches);

  for (let i = 0; i < namesSubset.length; i++) {
    const jailbirds: Jailbird[] = await doSearch(page, namesSubset[i]);
    if (jailbirds?.length) {
      webpageJailbirds = [...webpageJailbirds, ...jailbirds];
    }
  }

  return webpageJailbirds;
};

const doSearch = async (page, name: string): Promise<Jailbird[]> => {
  let webpageJailbirds: Jailbird[] = [];
  const OFFENDER_DETAILS_ID = '#detailsOfOffender';

  // focus on the first name input
  const FIRST_NAME_SEARCH_BOX_ID = '#searchFirstName';
  await page.waitForSelector(FIRST_NAME_SEARCH_BOX_ID);
  await page.focus(FIRST_NAME_SEARCH_BOX_ID);

  // type the given name into the first name search box
  const firstNameSearch = await page.$(FIRST_NAME_SEARCH_BOX_ID);
  await firstNameSearch.click({ clickCount: 3 })
  await firstNameSearch.type(name);
  
  // find and click the search button
  const searchButtonSelector = '.form-group.btn.btn-primary';
  const searchButton = await page.$(searchButtonSelector);
  await searchButton.click();

  // wait for search results to come back before proceeding
  await page.waitForSelector('p label');

  let viewMoreBtns = await getViewButtons(page);

  // there's the possibility there wont be any results for any given name
  if (viewMoreBtns.length > 1) {
    // the search button matches the .btn.btn-primary class
    // so start looping at 2nd button and view each jailbird's individual page
    for (let i = 1; i < viewMoreBtns.length; i++) {
      // expand the jailbird details accordion (by clicking "view more" button)
      await viewMoreBtns[i].click();
      
      // wait for offender details to be displayed
      await page.waitForSelector(OFFENDER_DETAILS_ID);

      const jailbird = await buildJailbird(page);
      if (jailbird) {
        webpageJailbirds.push(jailbird);
      }

      const viewLessBtns = await getButtonsByText(page, "View Less");
      if (viewLessBtns[0]) {
        viewLessBtns[0].click();
        
        // we're done with this particular jailbird, close the details view
        await page.waitForSelector(OFFENDER_DETAILS_ID, { hidden: true });
      }
    }
  }
  
  return webpageJailbirds;
};

const buildJailbird = async (page): Promise<Jailbird> => {
  const RICHMOND_CITY_JAIL = 'RICHMOND CITY JAIL';

  // scrape table data which contains jailbird details
  await page.waitForSelector('#detailsOfOffender');
  const tableData = await page.$$eval('table tbody tr td', (tds) =>
    tds.map((td) => {
        return td.innerText;
    })
  );

  // get jailbird name
  const viewLessStr: string = 'View Less';
  const tableDataJBLength = 7; // each jb row has a length of 7 table cols
  const viewLessNdx = tableData.indexOf(viewLessStr);
  const tableRowData = tableData.slice(viewLessNdx, viewLessNdx + tableDataJBLength)
  const name: string = buildNameStr(tableRowData);
  const inmateId = getInmateIdStr(tableRowData);

  // build out charge strings for jailbird
  const chargesArr: string[] = await page.$$('.col-12.table.table-striped.table-hover > h5', (h5s) =>
    h5s.map((h5) => {
        return h5.innerText;
    })
  );
  const charges: string = await buildChargesStr(chargesArr);
  
  // get jailbird age
  const age = getAge(tableData);

  // get jailbird mugshot
  const imgs = await page.$$eval('img.img-thumbnail[src]', imgs => imgs.map(img => img.getAttribute('src')));
  const picture = imgs[0];
  const formattedName = `${name.replaceAll(' ', '_')}.gif`;
  const base64Data = picture?.replace(/^data:image\/gif;base64,/, "");
  const imgPath = `out/images/${formattedName}`
  
  try {
    // write the base64 string to a local image for later uploads
    if (base64Data) {
      base64ToImage(base64Data, imgPath);

      // construct jailbird from scraped information
      const jailbird: Jailbird = {
        charges: charges,
        inmateID: inmateId,
        name: name,
        picture: imgPath,
        facility: RICHMOND_CITY_JAIL,
        age: age,
        timestamp: new Date(),
        isPosted: false,
        hashtags: [
          '#jail',
          '#jailbirds',
          '#rva',
          '#mugshots',
        ]
      };

      return jailbird;
    } else {
      throw new Error(`base64Data for image path ${imgPath} is falsy`);
    }
  } catch (e: any) {
    console.error('Error encountered while building jailbird', e);
    return Promise.resolve(null);
  }
}


/**
 * @param page the puppeteer page object
 * @param btnText the text of the button to search for
 * @returns an array of buttons that match the provided text
 */
const getButtonsByText = async (page, btnText: string) => {
  const resultBtns = [];
  const viewButtons = await getViewButtons(page);
  for (let i = 0; i < viewButtons.length; i++) {
    const buttonText = await (await viewButtons[i].getProperty('textContent')).jsonValue();
    
    // for some idiotic reason there's whitespace at the start/end of the button text so trim it
    const trimmedBtnText = buttonText.trim();
    
    if (trimmedBtnText === btnText) {
      resultBtns.push(viewButtons[i]);
    }
  }
  return resultBtns;
};

/**
 * @param page 
 * @returns an array of puppeteer buttons for the given page
 */
const getViewButtons = async (page) => {
  const viewButtonsSelector = '.btn.btn-primary';
  const viewButtons = await page.$$(viewButtonsSelector);
  return viewButtons;
};

const buildNameStr = (jailbirdData: string[]): string => {
  const LAST_NAME_NDX = 1;
  const FIRST_NAME_NDX = 2;
  const MIDDLE_NAME_NDX = 3;

  const lastName = jailbirdData[LAST_NAME_NDX];
  const firstName = jailbirdData[FIRST_NAME_NDX];
  const middleName = jailbirdData[MIDDLE_NAME_NDX];

  return `${firstName} ${middleName} ${lastName}`;
};

const getInmateIdStr = (jailbirdData: string[]): string => {
  const INMATE_ID_NDX = 6;
  return jailbirdData[INMATE_ID_NDX];
};

const buildChargesStr = async (charges): Promise<string> => {
  let chargesStr = '';
  const chargesMap = {};

  // build a map of the current inmate's charges and their counts
  for (let i = 0; i < charges.length; i++) {
    const charge = charges[i];
    let chargeHandle = await charge.getProperty('innerText');
    let chargeText = await chargeHandle.jsonValue();
    if (chargesMap.hasOwnProperty(chargeText)) {
      chargesMap[chargeText]++; 
    } else {
      chargesMap[chargeText] = 1;
    }
  }

  // append the charges into one long string
  for (let charge in chargesMap) {
    if (charges[charge] > 1) {
      chargesStr += `${charge} (x${charges[charge]}), `;
    } else {
      chargesStr += `${charge}, `;
    }
  }

  if (chargesStr.endsWith(', ')) {
    chargesStr = chargesStr.slice(0, -2); 
  }
  
  return chargesStr;
};

const getAge = (jailbirdData: string[]): number => {
  const CURRENT_AGE_LABEL = 'Current Age:';
  const CURRENT_AGE_LABEL_NDX = jailbirdData.indexOf(CURRENT_AGE_LABEL);
  const CURRENT_AGE_NDX = CURRENT_AGE_LABEL_NDX + 1;
  const age = jailbirdData[CURRENT_AGE_NDX];
  return parseInt(age);
};
