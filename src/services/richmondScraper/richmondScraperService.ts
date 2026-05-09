import { Page } from "puppeteer";
import { IJailbird } from "../../app";
import { logMessage } from "../loggerService";
import { JAILS, JAIL_URLS } from "../../utils/strings";
import { launchBrowser } from "../browserLaunchService/browserLauncherService";
import { clickButton, focusOn, typeInField } from "../pageInteractions";
import { proveHumanity } from "../captchaService/capchaService";
import buildJailbird from "./richmondJailbirdFactory";
import { findJailbirdByInmateId, saveJailbird } from "../jailbirdService";
const { getRandNumInRange } = require('../randomNumberService');
const { getFirstNames, getLastNames } = require('../../utils/names');
const config = require('../../utils/environment');

export const buildJailbirds = async (): Promise<IJailbird[]> => {
  let firstNameBrowser: any = null, lastNameBrowser: any = null;
  
  const jailbirdsPromise = new Promise<IJailbird[]>(async (resolve, reject) => {
    try {
      // We'll do first and last name searches in parallel
      logMessage('Launching headless browsers for Richmond page.', JAILS.RICHMOND_CITY_JAIL)
      firstNameBrowser = await launchBrowser(false);
      lastNameBrowser = await launchBrowser(false);

      // go to the Richmond inmates page
      logMessage(
        `Going to ${JAIL_URLS.RICHMOND_CITY_JAIL}`, JAILS.RICHMOND_CITY_JAIL
      );
      const firstNamePage = await firstNameBrowser.newPage();
      const lastNamePage = await lastNameBrowser.newPage();

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
      const firstNames = getFirstNames();
      await firstNamePage.bringToFront();
      const firstNameJBPromise: Promise<IJailbird[]> = doJBSearches(
        firstNamePage, 
        firstNames, 
        FIRST_NAME_SEARCH_BOX_ID
      );  

      logMessage(`Doing last name searches`, JAILS.RICHMOND_CITY_JAIL);
      const LAST_NAME_SEARCH_BOX_ID = "#searchLastName";
      const lastNames = getLastNames();
      await lastNamePage.bringToFront();
      const lastNameJBPromise: Promise<IJailbird[]> = doJBSearches(
        lastNamePage, 
        lastNames, 
        LAST_NAME_SEARCH_BOX_ID
      );  
    
      const scraperPromises: Promise<any>[] = [];
      scraperPromises.push(firstNameJBPromise);
      scraperPromises.push(lastNameJBPromise);
      const resolvedData = await Promise.all(scraperPromises);

      logMessage(`Closing headless browsers`, JAILS.RICHMOND_CITY_JAIL);
      firstNameBrowser.close();
      lastNameBrowser.close();

      const flattenedData = resolvedData.flat(1);
      logMessage(
        `Returning ${flattenedData.length} jailbirds from scraper service`,
        JAILS.RICHMOND_CITY_JAIL
      );
      resolve(flattenedData);
    } catch (e: any) {
      logMessage(
        `Error encounted while building Jailbirds list, ${e}`, 
        JAILS.RICHMOND_CITY_JAIL
      );
      firstNameBrowser.close();
      lastNameBrowser.close();
      reject();
    }
  });
  
  return jailbirdsPromise;
};

const loadPage = async (page: Page) => {
  try {
    await page.goto(JAIL_URLS.RICHMOND_CITY_JAIL, {
      waitUntil: 'load',
      timeout: 480000,
    });
  } catch (e: any) {
    logMessage(
      `Error encountered while loading initial captcha page at ${JAILS.RICHMOND_CITY_JAIL}: ${e}`
    );
  }
};

const getRandomSubset = (arr: any[], size: number) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

const waitUntilElWithTextIsHidden = async (
  page: Page, selector: string, text: string, timeout = 5000
) => {  
  await page.waitForFunction(
    (selector, text) => {
      const elements = Array.from(document.querySelectorAll(selector));
      return !elements.some(el => el.textContent?.trim() === text);
    },
    { timeout },
    selector,
    text
  );
};

const doJBSearches = async (page: Page, names: string[], searchFieldID: string): Promise<IJailbird[]> => {
  let webpageJailbirds: IJailbird[] = [];
  
  const upper = +config.richmond.upperSearchCount;
  const lower = +config.richmond.lowerSearchCount;
  const numOfSearches = getRandNumInRange(lower, upper)
  
  // do name searches
  const namesSubset = getRandomSubset(names, numOfSearches);
  logMessage(
    `Performing ${namesSubset.length} first name searches`, 
    JAILS.RICHMOND_CITY_JAIL
  );
  for (let i = 0; i < namesSubset.length; i++) {
    try {
      const jailbirds: IJailbird[] = await doSearch(
        page, 
        namesSubset[i], 
        searchFieldID
      );
      if (jailbirds?.length) {
        webpageJailbirds = [...webpageJailbirds, ...jailbirds];
      }
    } catch (e: any) {
      const ERR_MSG = "Error encounted while doing jailbird searches";
      logMessage(ERR_MSG, JAILS.RICHMOND_CITY_JAIL);
      throw new Error(ERR_MSG);
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
const doSearch = async (page: Page, name: string, searchBoxID: string): Promise<IJailbird[]> => {
  let webpageJailbirds: IJailbird[] = [];

  // element selectors
  const OFFENDER_DETAILS_ID = '#detailsOfOffender';
  const SEARCH_BTN_SELECTOR = '.form-group.btn.btn-primary';

  try {
    logMessage(
      `Putting browser focus on first name search box to search for the name ${name}`,
      JAILS.RICHMOND_CITY_JAIL
    );
    await focusOn(page, searchBoxID);
  } catch (e: any) {
    throw new Error(e);
  }

  // type the given name into the first name search box
  try {
    logMessage(
      `Doing a search for the name ${name}`, 
      JAILS.RICHMOND_CITY_JAIL
    );
    await typeInField(page, searchBoxID, name, true);
  } catch (e: any) {
    throw new Error(e);
  }
  
  // find and click the search button
  try {
    logMessage(
      `Clicking the search button for the name ${name}`, 
      JAILS.RICHMOND_CITY_JAIL
    );
    await clickButton(page, SEARCH_BTN_SELECTOR);
    await page.waitForNetworkIdle();
  } catch (e: any) {
    throw new Error(e);
  }
  
  // wait for search results to come back before proceeding
  await page.waitForSelector('p label');
  let viewMoreBtns = await getViewButtons(page);

  // there's the possibility there wont be any results for any given name
  if (viewMoreBtns.length > 0) {
    // the search button matches the .btn.btn-primary class
    // so start looping at 2nd button and view each jailbird's individual page
    for (let i = 1; i < viewMoreBtns.length; i++) {
      // expand the jailbird details accordion by clicking "view more" button
      await viewMoreBtns[i].click();
      
      const viewLessBtns = await getButtonsByText(page, "View Less");
      if (viewLessBtns?.length > 1) {
        throw new Error("View Less button failed to close accordion.");
      }

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
          // saving richmond jailbirds individually because the scraper is prone to errors
          const foundJailbird = await findJailbirdByInmateId(jailbird?.inmateID)
          if (!foundJailbird) {
            logMessage(
              `Saving ${jailbird.name} to database`, 
              JAILS.RICHMOND_CITY_JAIL
            );
            webpageJailbirds.push(jailbird);

            await saveJailbird(jailbird);
          }
        }
      } catch (e:any) {
        logMessage(
          `Error encountered while building jailbird, ${e}`, 
          JAILS.RICHMOND_CITY_JAIL
        );
      } finally {
        const VIEW_LESS_STR = "View Less";
        const viewLessBtns = await getButtonsByText(page, VIEW_LESS_STR);
        if (viewLessBtns.length > 0) {
          await viewLessBtns[0].click();

          // Wait until "View Less" disappears (and "View More" replaces it)
          await waitUntilElWithTextIsHidden(page, "button", VIEW_LESS_STR);
        } else {
          logMessage(
            "No 'View Less' button found to collapse accordion",
            JAILS.RICHMOND_CITY_JAIL
          );
        }
      }

      await page.waitForNetworkIdle();
    }
  }
  
  logMessage(
    `returning ${webpageJailbirds.length} webpage jailbirds for the name ${name}`,
    JAILS.RICHMOND_CITY_JAIL
  );
  return webpageJailbirds;
};

/**
 * @param page the puppeteer page object
 * @param btnText the text of the button to search for
 * @returns an array of buttons that match the provided text
 */
const getButtonsByText = async (page: Page, btnText: string) => {
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
const getViewButtons = async (page: Page) => {
  const viewButtonsSelector = '.btn.btn-primary';
  const viewButtons = await page.$$(viewButtonsSelector);
  return viewButtons;
};