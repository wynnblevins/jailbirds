import { Page } from "puppeteer";
import { IJailbird } from "../../app";
import { JAIL_URLS, JAILS } from "../../utils/strings";
import { launchBrowser } from "../browserLaunchService";
import { logMessage } from "../loggerService";
import { clickButton } from "../pageInteractions";
import { buildChargesStr } from "./chargesStringBuilderService";
import { createMultipleJailbirdsIfTheyDontExist } from "../jailbirdService";

const JAIL_EAST_WEST = `${JAILS.JAIL_EAST}/${JAILS.JAIL_WEST}`

const getRandomLetter = (): string => {
  return String.fromCharCode(65 + Math.floor(Math.random() * 26));
}

const scrapeCharges = async (page: Page): Promise<string[]> => {
  const charges: string[] = await page.$$eval(
    '#charges tr td:first-child',
    (cells) => cells.map(cell => cell.textContent?.trim())
  );

  return charges;
};

const scrapeJailbird = async (page: Page): Promise<IJailbird> => {
  const INMATE_ID_ELEMENT_ID = "#lbOffenderID";
  const INMATE_NAME_ELEMENT_ID = "#lbname";
  const INMATE_FACILITY_ELEMENT_ID = "#lbfacility";

  // build the charges string (const charges = "")
  const chargesList: string[] = await scrapeCharges(page);
  const charges: string = await buildChargesStr(chargesList);
  
  // scrape the inmate ID
  const inmateID = await page.$eval(
    INMATE_ID_ELEMENT_ID,
    el => el.textContent
  );

  const name = await page.$eval(
    INMATE_NAME_ELEMENT_ID,
    el => el.textContent
  );

  // scrape the picture
  const picture: string = await page.$eval(
    'img#imPhoto',
    img => img.getAttribute('src')
  ) || "";

  // scrape the facility name (ie Jail East or Jail West)
  const facility = await page.$eval(
    INMATE_FACILITY_ELEMENT_ID,
    el => el.textContent
  );
  const facilityHashTag = facility === JAILS.JAIL_EAST ? "#jailwest" : "#jaileast";
  
  // build the jailbird like so:
  const jailbird: IJailbird = {
    charges,
    inmateID,
    name,
    picture,
    facility,
    age: undefined, // no age info available on jail east/west website
    timestamp: new Date(),
    isPosted: false,
    hashtags: [
      '#jail',
      '#jailbirds',
      facilityHashTag,
      '#rva',
      '#mugshots',
    ]
  };

  return jailbird;
};

export const buildJailbirds = async (): Promise<IJailbird[]> => {
  let jailbirds: IJailbird[] = [];
  let page = null;

  // open up a headless chrome
  logMessage(
    "Launching headless browser for Henrico Jail East/West page.", 
    JAIL_EAST_WEST
  );

  const browser = await launchBrowser(false);  

  // go to the Henrico jail page
  try {
    logMessage(
      `Going to ${JAIL_URLS.JAIL_EAST_WEST}`, 
      JAIL_EAST_WEST
    );
    page = await browser.newPage();
    await page.goto(JAIL_URLS.JAIL_EAST_WEST, {
      waitUntil: 'load',
      timeout: 60000,
    });
  } catch (e: any) {
    browser.close();
    logMessage(`Error encountered while going to ${JAIL_URLS.JAIL_EAST_WEST}: ${e}`);
    throw new Error(e);
  }

  const letterButtons = await page.$$eval(
    'input[id^="button"]',
    buttons =>
      buttons.map(button => ({
        id: button.id,
        letter: (button as HTMLInputElement).value || button.id.replace('button', '')
      }))
    );

  const randomButton =
  letterButtons[Math.floor(Math.random() * letterButtons.length)];

  console.log(`Looking for: button with ID ${randomButton.id}`);


  const button = await page.$(randomButton.id);
  console.log("Found?", button !== null);

  await clickButton(page, `#${randomButton.id}`);
  await page.waitForNetworkIdle();

  // get a list of all of the select links
  const links = await page.$$('#inmatelist tr td:first-child a');

  for (let i = 0; i < links.length; i++) {
    const links = await page.$$('#inmatelist tr td:first-child a'); // re-query (important!)
    const link = links[i];

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      link.click(),
    ]);

    // scrape details here...
    const jailbird: IJailbird = await scrapeJailbird(page);
    logMessage(`scraped ${jailbird.name}`);
    jailbirds.push(jailbird);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.goBack(),
    ]);
  }

  return await createMultipleJailbirdsIfTheyDontExist(jailbirds);
};