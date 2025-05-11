import { Page } from "puppeteer";
import { Jailbird } from "../../app";
import { JAILS, JAIL_URLS } from "../../utils/strings";
import launchBrowser from "../browserLauncherService";
import executeWithRetries from "../executeWithRetriesService";
import { clearTextInput, clickButton, focusOn, typeInField } from "../pageInteractions";
import scrapeTable from "./richmondTableScraperService";
const { getRandNumInRange } = require('../randomNumberService');
const { getFirstNames, getLastNames } = require('../../utils/names');
const config = require('../../utils/environment');
const proveHumanity = require('./richmondCaptchaService')
const { logMessage } = require('../loggerService');

const loadPage = async (page) => {
  try {
    await page.goto(JAIL_URLS.RICHMOND_CITY_JAIL, {
      waitUntil: 'load',
      timeout: 10000,
    });
  } catch (e: any) {
    logMessage(
      `Error encountered while loading initial captcha page at ${JAILS.RICHMOND_CITY_JAIL}: ${e}`
    );
  }
};

export const buildJailbirds = async (): Promise<Jailbird[]> => {
  try {
    // We'll do first and last name searches in parallel
    logMessage('Launching headless browser for Richmond page.', JAILS.RICHMOND_CITY_JAIL)
    const browser = await launchBrowser(false);

    // go to the Richmond inmates page
    logMessage(
      `Going to ${JAIL_URLS.RICHMOND_CITY_JAIL}`, JAILS.RICHMOND_CITY_JAIL
    );
    const firstNamePagePromise = browser.newPage();
    const lastNamePagePromise = browser.newPage();
    const pageLaunchPromises = [firstNamePagePromise, lastNamePagePromise];
    const pages = await Promise.all(pageLaunchPromises);
    const firstNamePage = pages[0];
    const lastNamePage = pages[1];

    logMessage(
      `Loading page at ${JAIL_URLS.RICHMOND_CITY_JAIL} for first name searches`, 
      JAILS.RICHMOND_CITY_JAIL
    );
    const firstNamePageLoadPromise = loadPage(firstNamePage);
    logMessage(
      `Loading page at ${JAIL_URLS.RICHMOND_CITY_JAIL} for last name searches`,
      JAILS.RICHMOND_CITY_JAIL
    );
    const lastNamePageLoadPromise = loadPage(lastNamePage);
    const pageLoadPromises = [
      firstNamePageLoadPromise, 
      lastNamePageLoadPromise
    ];
    await Promise.all(pageLoadPromises);

    logMessage(`Proving humanity`, JAILS.RICHMOND_CITY_JAIL);
    const firstNamePageHumanityPromise = proveHumanity(firstNamePage);
    const lastNamePageHumanityPromise = proveHumanity(lastNamePage);
    const humanityPromises = [firstNamePageHumanityPromise, lastNamePageHumanityPromise];
    await Promise.all(humanityPromises);

    logMessage(`Doing first name searches`, JAILS.RICHMOND_CITY_JAIL);
    const FIRST_NAME_SEARCH_BOX_ID = "#searchFirstName";
    const firstNameJBPromise: Promise<Jailbird[]> = doJBSearches(firstNamePage, FIRST_NAME_SEARCH_BOX_ID);  

    logMessage(`Doing last name searches`, JAILS.RICHMOND_CITY_JAIL);
    const LAST_NAME_SEARCH_BOX_ID = "#searchLastName";
    const lastNameJBPromise: Promise<Jailbird[]> = doJBSearches(lastNamePage, LAST_NAME_SEARCH_BOX_ID);  
    
    const scraperPromises: Promise<any>[] = [];
    scraperPromises.push(firstNameJBPromise);
    scraperPromises.push(lastNameJBPromise);
    const resolvedData = await Promise.all(scraperPromises);

    logMessage(`Closing headless browser`, JAILS.RICHMOND_CITY_JAIL);
    browser.close();

    const flattenedData = resolvedData.flat(1);
    logMessage(
      `Returning ${flattenedData.length} jailbirds from scraper service`,
      JAILS.RICHMOND_CITY_JAIL
    );
    return flattenedData;
  } catch (e: any) {
    logMessage(
      `Error encounted while building Jailbirds list, ${e}`, 
      JAILS.RICHMOND_CITY_JAIL
    );
    throw new Error(`Error encounted while building Richmond jailbirds list, ${e}`)
  } 
};

const getRandomSubset = (arr, size) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

const doJBSearches = async (page: Page, searchFieldID: string): Promise<Jailbird[]> => {
  let webpageJailbirds: Jailbird[] = [];
  
  const upper = +config.richmond.upperSearchCount;
  const lower = +config.richmond.upperSearchCount;
  const numOfSearches = getRandNumInRange(lower, upper)
  
  // do name searches
  const firstNames = getFirstNames();
  const firstNamesSubset = getRandomSubset(firstNames, numOfSearches);
  logMessage(
    `Performing ${firstNamesSubset.length} first name searches`, 
    JAILS.RICHMOND_CITY_JAIL
  );
  for (let i = 0; i < firstNamesSubset.length; i++) {
    const jailbirds: Jailbird[] = await doSearch(
      page, 
      firstNamesSubset[i], 
      searchFieldID
    );
    if (jailbirds?.length) {
      webpageJailbirds = [...webpageJailbirds, ...jailbirds];
    }
  }

  return webpageJailbirds;
};

/**
 * Performs a search in the provided search field for a given name 
 * 
 * @param page the puppeteer page object
 * @param name the name string to do the search for
 * @param searchBoxID the ID of the search field on the page
 * @returns a promise for a list of parsed jailbird objects for a given name 
 */
const doSearch = async (page: Page, name: string, searchBoxID: string): Promise<Jailbird[]> => {
  let webpageJailbirds: Jailbird[] = [];

  // element selectors
  const OFFENDER_DETAILS_ID = '#detailsOfOffender';
  const SEARCH_BTN_SELECTOR = '.form-group.btn.btn-primary';

  try {
    await executeWithRetries(async () => {
      logMessage(
        `Putting browser focus on first name search box to search for the name ${name}`,
        JAILS.RICHMOND_CITY_JAIL
      );
      await focusOn(page, searchBoxID);
    });
  } catch (e: any) {
    throw new Error(e);
  }

  // type the given name into the first name search box
  try {
    await executeWithRetries(async () => {
      logMessage(
        `Doing a search for the name ${name}`, 
        JAILS.RICHMOND_CITY_JAIL
      );
      await typeInField(page, searchBoxID, name, true)
    });
  } catch (e: any) {
    throw new Error(e);
  }
  
  // find and click the search button
  try {
    await executeWithRetries(async () => {
      logMessage(
        `Clicking the search button for the name ${name}`, 
        JAILS.RICHMOND_CITY_JAIL
      );
      await clickButton(page, SEARCH_BTN_SELECTOR);
    });
  } catch (e: any) {
    throw new Error(e);
  }
  
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
      
      try {
        // wait for offender details to be displayed
        await page.waitForSelector(OFFENDER_DETAILS_ID);
      } catch (e: any) {
        logMessage(`Timed out waiting for jailbird details to be displayed, ${e}`);
        continue;
      }

      try {
        const jailbird = await buildJailbird(page);  
        if (jailbird) {
          webpageJailbirds.push(jailbird);
        }
      } catch (e:any) {
        logMessage(`Error encountered while building jailbird, ${e}`);
      } finally {
        const viewLessBtns = await getButtonsByText(page, "View Less");
        if (viewLessBtns[0]) {
          await viewLessBtns[0].click();
        }
      }
    }
  }
  
  logMessage(
    `returning ${webpageJailbirds.length} webpage jailbirds for the name ${name}`,
    JAILS.RICHMOND_CITY_JAIL
  );
  return webpageJailbirds;
};

const buildJailbird = async (page): Promise<Jailbird> => {
  let jailbird: Jailbird = null;
  const RICHMOND_CITY_JAIL = 'RICHMOND CITY JAIL';

  // scrape table data which contains jailbird details
  const tableData = await scrapeTable(page);

  if (tableData) {
    const TABLE_DATA_JB_LENGTH = 7; // each jb row has a length of 7 table cols
    const startNdx = getFirstColNdx(tableData);
    const tableRowData = tableData.slice(startNdx, startNdx + TABLE_DATA_JB_LENGTH)
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

    // write the base64 string to a local image for later uploads
    if (picture) {
      // construct jailbird from scraped information
      jailbird = {
        charges: charges,
        inmateID: inmateId,
        name: name,
        picture: picture,
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
    }
  }

  return jailbird;
}

/**
 * There seems to be a timing issue.  This function gets the first 
 * table column by searching for either "Loading" or "View Less" 
 * 
 * @param tableData an array of strings representing the table data 
 * @returns the first column of the open table row
 */
const getFirstColNdx = (tableData: string[]) => {
  const VIEW_LESS_STR = 'View Less';
  const LOADING_STR = 'Loading...';
  const viewLessNdx = tableData.indexOf(VIEW_LESS_STR);
  const loadingNdx = tableData.indexOf(LOADING_STR);

  if (viewLessNdx === -1 && loadingNdx !== -1) {
    return loadingNdx;
  } 

  if (viewLessNdx === -1 && loadingNdx === -1) {
    throw new Error('Unable to parse table data.');
  }

  return viewLessNdx;
};

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
