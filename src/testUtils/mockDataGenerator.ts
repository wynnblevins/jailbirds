import mockingoose from 'mockingoose';
import { Jailbird } from "../app";
import { faker } from '@faker-js/faker';
import { JAILS, MIDLOTHIAN_CHARGES, RICHMOND_CHARGES } from "../utils/strings";
import mongoose from 'mongoose';
import puppeteer, { Browser, BrowserContext, ElementHandle, Page } from 'puppeteer';
import { disconnect, listenerCount, removeAllListeners } from 'process';
import { queryObjects } from 'v8';

const DUMMY_INMATE_ID_0 = "000000";
const DUMMY_INMATE_ID_1 = "000001";
const DUMMY_INMATE_ID_2 = "000002";
const DUMMY_INMATE_ID_3 = "000003";
const DUMMY_INMATE_ID_4 = "000004";

const POSSIBLE_MIDLOTHIAN_CHARGES = [
  MIDLOTHIAN_CHARGES.LARCENY_PETIT_SHOPLIFTING,
  MIDLOTHIAN_CHARGES.LARCENY_GRAND_SHOPLIFTING,
  MIDLOTHIAN_CHARGES.OTHER_OFFENSES_VIOLATE_PO_DOMESTIC,
  MIDLOTHIAN_CHARGES.SEX_OFFENSES_EXPOSING_PERSON,
  MIDLOTHIAN_CHARGES.OTHER_STATE_VIOLATIONS_CRIMINAL,
  MIDLOTHIAN_CHARGES.OTHER_OFFENSES_PROBATION_VIOLATION,
  MIDLOTHIAN_CHARGES.OTHER_OFFENSES_CONTEMPT_OF_COURT,
  MIDLOTHIAN_CHARGES.DRUG_VIOL_NON_NARC_POSSESS,
  MIDLOTHIAN_CHARGES.ASSAULT_NON_AGGRAVATED,
  MIDLOTHIAN_CHARGES.OTHER_ASSAULTS_OBSTRUCT_JUSTICE,
  MIDLOTHIAN_CHARGES.POSSESSION_OF_COCAINE,
  MIDLOTHIAN_CHARGES.VIOLATON_OF_PROTECTIVE_ORDER_NON_DOMESTIC
];

const POSSIBLE_RICHMOND_CHARGES = [
  RICHMOND_CHARGES.OBSTRUCTION_OF_JUSTICE, 
  RICHMOND_CHARGES.WEAPONS_CARRY_CONCEALED_WEAPON_OTHER_THAN_FIREARM, 
  RICHMOND_CHARGES.WEAPONS_BRANDISH_MACHETE_OR_BLADED_WEAPON, 
  RICHMOND_CHARGES.ASSAULT_SIMPLE_ASSAULT_ON_LAW_ENFORCEMENT, 
  RICHMOND_CHARGES.ASSAULT_SIMPLE_ASSAULT_AGAINST_FAMILY_MEMBER
]

const POSSIBLE_JAILS = [
  JAILS.HENRICO_COUNTY_REGIONAL_JAIL,
  JAILS.RICHMOND_CITY_JAIL
];

/**
 * 
 * @param jailbird - the partial jailbird from which to populate the object
 * @returns a dummy jailbird for testing purposes
 */
const createDummyJailbird = (jailbird?: Partial<Jailbird>): Jailbird => {
  // depending on which jail we're in, build the appropriate charges string 
  let charges: string = '';
  const jail = faker.helpers.arrayElement(POSSIBLE_JAILS);
  if (jail === JAILS.HENRICO_COUNTY_REGIONAL_JAIL) {
    charges = faker.helpers.arrayElements(POSSIBLE_MIDLOTHIAN_CHARGES).join(', ')
  } else if (jail === JAILS.RICHMOND_CITY_JAIL) {
    charges = faker.helpers.arrayElements(POSSIBLE_RICHMOND_CHARGES).join(', ')
  }
  
  // construct the dummy jailbird
  return {
    inmateID: jailbird?.inmateID || faker.string.uuid(),
    name: jailbird?.name || `${faker.person.fullName().toUpperCase()}`,
    charges: jailbird?.charges || `${charges}`,
    picture: jailbird?.picture || faker.internet.url(),
    facility: jailbird?.facility || `${faker.helpers.arrayElement(POSSIBLE_JAILS)}`,
    age: jailbird?.age || faker.number.int({ min: 18, max: 99 }),
    hashtags: jailbird?.hashtags || [
      '#jail',
      '#jailbirds',
      '#mugshots',
    ],
    timestamp: jailbird?.timestamp || faker.date.anytime(),
    isPosted: jailbird?.isPosted || faker.datatype.boolean(),
  }
};

const createDummyJailbirdWithId = (jailbird?: Partial<Jailbird>, _id?: mongoose.Types.ObjectId) => {
  const createdJailbird = createDummyJailbird(jailbird);
  const jbWithId = { 
    ...createdJailbird, 
    _id: _id || new mongoose.Types.ObjectId() 
  };
  return jbWithId;
};

const createDummyElementHandle = async (htmlContent: string, selector: string): Promise<ElementHandle<Element>> => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(htmlContent);

  // Wait for the element and get its handle
  const elementHandle = await page.$(selector);

  if (!elementHandle) {
      throw new Error('Element not found');
  }

  // we need to copy the element handle BEFORE we can close the browser 
  const elementHandleCopy = JSON.parse(JSON.stringify(elementHandle))
  browser.close();
  
  return elementHandleCopy;
}

const createDummyPuppeteerPage = (): Page => {
  const dummyPage = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    once: jest.fn(),
    listenerCount: jest.fn(),
    removeAllListeners: jest.fn(),
    locator: jest.fn(),
    $: jest.fn(),
    $$: jest.fn(),
    evaluateHandle: jest.fn(),
    queryObjects: jest.fn(),
    $eval: jest.fn(),
    $$eval: jest.fn(),
    addScriptTag: jest.fn(),
    addStyleTag: jest.fn(),
    exposeFunction: jest.fn(),
    removeExposedFunction: jest.fn(),
    url: jest.fn(),
    content: jest.fn(),
    setContent: jest.fn(),
    goto: jest.fn(),
    waitForNavigation: jest.fn(),
    waitForRequest: jest.fn(),
    waitForResponse: jest.fn(),
    waitForNetworkIdle: jest.fn(),
    waitForFrame: jest.fn(),
    emulate: jest.fn(),
    evaluate: jest.fn(),
    screencast: jest.fn(),
    screenshot: jest.fn(),
    title: jest.fn(),
    click: jest.fn(),
    focus: jest.fn(),
    hover: jest.fn(),
    select: jest.fn(),
    tap: jest.fn(),
    type: jest.fn(),
    waitForSelector: jest.fn(),
    waitForFunction: jest.fn(),
    waitForDevicePrompt: jest.fn(),
    isClosed: jest.fn(),
    close: jest.fn(),
    pdf: jest.fn(),
    createPDFStream: jest.fn(),
    setCacheEnabled: jest.fn(),
    removeScriptToEvaluateOnNewDocument: jest.fn(),
    evaluateOnNewDocument: jest.fn(),
    viewport: jest.fn(),
    setViewPort: jest.fn(),
    emulateVisionDeficiency: jest.fn(),
    emulateIdleState: jest.fn(),
    emulateTimezone: jest.fn(),
    emulageMediaFeatures: jest.fn(),
    emulateCPUThrottling: jest.fn(),
    emulateMediaType: jest.fn(),
    setBypassCSP: jest.fn(),
    setJavaScriptEnabled: jest.fn(),
    bringToFront: jest.fn(),
    goForward: jest.fn(),
    goBack: jest.fn(),
    reload: jest.fn(),
    metrics: jest.fn(),
    setUserAgent: jest.fn(),
    setExtraHTTPHeaders: jest.fn(),
    authenticate: jest.fn(),
    setCookie: jest.fn(),
    deleteCookie: jest.fn(),
    cookies: jest.fn(),
    getDefaultTimeout: jest.fn(),
    setDefaultTimeout: jest.fn(),
    setDefaultNavigationTimeout: jest.fn(),
    emulateNetworkConditions: jest.fn(),
    setOfflineMode: jest.fn(),
    setDragInterception: jest.fn(),
    setBypassServiceWorker: jest.fn(),
    setRequestInterception: jest.fn(),
    workers: jest.fn(),
    frames: jest.fn(),
    isServiceWorkerBypassed: jest.fn(),
    isDragInterceptionEnabled: jest.fn(),
    isJavaScriptEnabled: jest.fn(),
    waitForFileChooser: jest.fn(),
    serGeolocation: jest.fn(),
    target: jest.fn(),
    browser: jest.fn(),
    browserContext: jest.fn(),
    mainFrame: jest.fn(),
    createCDPSession: jest.fn(),
    keyboard: jest.fn(),
    touchscreen: jest.fn(),
    coverage: jest.fn(),
    tracing: jest.fn(),
    accessibility: jest.fn(),
    emulateMediaFeatures: jest.fn(),
    setGeolocation: jest.fn(),
    setViewport: jest.fn(),
    mouse: jest.fn(),
  }
  // @ts-ignore
  return dummyPage;
};

const createDummyPuppeteerBrowser = (): Browser => {
  const browser = {
    process: jest.fn(),
    createBrowserContext: jest.fn(),
    browserContexts: jest.fn(),
    defaultBrowserContext: jest.fn(),
    wsEndpoint: jest.fn(),
    newPage: jest.fn(),
    targets: jest.fn(),
    target: jest.fn(),
    waitForTarget: jest.fn(),
    pages: jest.fn(),
    version: jest.fn(),
    userAgent: jest.fn(),
    close: jest.fn(),
    disconnect: jest.fn(),
    isConnected: jest.fn(),
    connected: jest.fn(),
    debugInfo: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),    
    once: jest.fn(),
    listenerCount: jest.fn(),
    removeAllListeners: jest.fn(),
  };

  // @ts-ignore
  return browser;
}

export {
  DUMMY_INMATE_ID_0,
  DUMMY_INMATE_ID_1,
  DUMMY_INMATE_ID_2,
  DUMMY_INMATE_ID_3,
  DUMMY_INMATE_ID_4,
  createDummyJailbird,
  createDummyJailbirdWithId,
  createDummyElementHandle,
  createDummyPuppeteerBrowser,
  createDummyPuppeteerPage
}