import puppeteer from 'puppeteer';
import { Types } from 'mongoose';
import { JAILS, JAIL_URLS } from "../../utils/strings";
import { selectFromMenu } from '../pageInteractions';
import { Jailbird } from '../../models';
import { createMultipleJailbirdsIfTheyDontExist } from '../jailbirdService';

export interface Jailbird {
  _id?: Types.ObjectId;
  inmateID: string;
  name: string;
  charges: string;
  picture: string;
  facility: string;
  age: number;
  timestamp: Date;
  isPosted: boolean;
  hashtags: string[];
}

export async function buildJailbirds(): Promise<Jailbird[]> {
  const browser = await puppeteer.launch({
    headless: false
  });

  try {
    const page = await browser.newPage();

    await page.goto(JAIL_URLS.HENRICO_COUNTY_REGIONAL_JAIL, {
      waitUntil: 'networkidle2'
    });

    //
    // Change records/page from 25 to 100
    //
    const oneHundred = '100';
    const pageSizeSelectID = '#pageSizeSelect'
    await page.waitForSelector(pageSizeSelectID);
    await selectFromMenu(page, pageSizeSelectID, oneHundred)

    // Allow table to refresh
    await new Promise(resolve => setTimeout(resolve, 5000));

    const jailbirds: Jailbird[] = await page.$$eval(
      'tbody.table-group-divider tr',
      rows =>
        rows.map(row => {
          const cells = row.querySelectorAll('td');

          // Mugshot URL
          const picture =
            row
              .querySelector('source[type="image/jpeg"]')
              ?.getAttribute('srcset') ?? '';

          // Extract inmate ID from the image URL
          // "/mugshots/353739.jpg" -> "353739"
          const inmateID =
            picture.match(/\/(\d+)\.jpg$/)?.[1] ?? '';

          // Name and age cell
          const nameAndAgeLines = cells[2]?.innerText
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean) ?? [];

          const name = nameAndAgeLines[0] ?? '';

          const ageMatch = nameAndAgeLines[1]?.match(/\d+/);
          const age = ageMatch ? Number(ageMatch[0]) : 0;

          // Charge cell
          const chargeLines = cells[3]?.innerText
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean) ?? [];

          const charges = chargeLines.slice(0, -1).join('\n');

          return {
            inmateID,
            name: name.toUpperCase(),
            charges,
            picture: `https://ppd.henrico.gov${picture}`,
            facility: JAILS.HENRICO_COUNTY_REGIONAL_JAIL,
            age,
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
        })
    );

    const scrapedJailbirds = combineCharges(jailbirds);

     createMultipleJailbirdsIfTheyDontExist(scrapedJailbirds)

    return scrapedJailbirds;
  } finally {
    await browser.close();
  }
}

const combineCharges = (jailbirds: Jailbird[]): Jailbird[] => {
  const jailbirdMap = new Map<string, Jailbird>();

  for (const jailbird of jailbirds) {
    const existing = jailbirdMap.get(jailbird.inmateID);

    if (!existing) {
      jailbirdMap.set(jailbird.inmateID, structuredClone(jailbird));
    } else {
      existing.charges += `\n${jailbird.charges}`;
    }
  }

  return [...jailbirdMap.values()];
}

const getInmateIdFromMugshot = (mugshot: string): string => {
  const mugshotImg = mugshot.split('/').slice(2)[0];
  return mugshotImg.split('.')[0];
};

/**
 * takes in a string like "32 years old" and returns 32
 * 
 * @returns the inmate's age as a number
 */
const getAge = (ageString: string): number => {  
  return +ageString.split(' ')[0];
}

/**
 * 
 * @param jailbirdCells 
 * @param i 
 * @returns a single jailbird record for an individual charge
 */
const buildJailbird = (jailbirdCells: string[], mugshot: string): Jailbird => {
  const nameAgeAndLocationNdx = 2;
  const chargeNdx = 3;

  // get the name and location for the current charge
  const nameAgeAndLocation = jailbirdCells[nameAgeAndLocationNdx];
  const splitNameAgeAndLocation = nameAgeAndLocation.split('\n');
  const nameNdx = 0;
  const ageNdx = 1;
  const name = splitNameAgeAndLocation[nameNdx];
  const ageString = splitNameAgeAndLocation[ageNdx];
  
  // get the charge
  const charge = jailbirdCells[chargeNdx];

  const jb: Jailbird = {
    inmateID: getInmateIdFromMugshot(mugshot),
    name,
    age: getAge(ageString), 
    facility: JAILS.HENRICO_COUNTY_REGIONAL_JAIL,
    charges: charge,
    picture: `ppd.henrico.gov${mugshot}`,
    timestamp: new Date(),
    isPosted: false,
    hashtags: [
      '#jail',
      '#jailbirds',
      '#henricojail',
      '#rva',
      '#mugshots',
    ]
  }

  return jb;
};