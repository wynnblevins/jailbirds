import { Jailbird } from "../../app";
import { JAILS } from "../../utils/strings";
import scrapeTable from "./richmondTableScraperService";

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

const buildNameStr = (jailbirdData: string[]): string => {
  const parts = [
    jailbirdData[2], // first
    jailbirdData[3], // middle
    jailbirdData[1], // last
  ].filter(Boolean);

  return parts.join(' ');
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
    if (chargesMap[charge] > 1) {
      chargesStr += `${charge} (x${chargesMap[charge]}), `;
    } else {
      chargesStr += `${charge}, `;
    }
  }

  if (chargesStr.endsWith(', ')) {
    chargesStr = chargesStr.slice(0, -2); 
  }
  
  return chargesStr;
};

const getAge = (jailbirdData: string[]): number | null => {
  const ndx = jailbirdData.indexOf('Current Age:');
  if (ndx === -1) return null;

  const age = parseInt(jailbirdData[ndx + 1], 10);
  return Number.isNaN(age) ? null : age;
};

const buildJailbird = async (page): Promise<Jailbird | null> => {
  let jailbird: Jailbird | null = null;

  // scrape table data which contains jailbird details
  const tableData = await scrapeTable(page);

  if (tableData) {
    const TABLE_DATA_JB_LENGTH = 7; // each jb row has a length of 7 table cols
    const startNdx = getFirstColNdx(tableData);
    const tableRowData = tableData.slice(startNdx, startNdx + TABLE_DATA_JB_LENGTH)
    const name: string = buildNameStr(tableRowData);
    const inmateId = getInmateIdStr(tableRowData);

    // build out charge strings for jailbird
    const chargesArr: string[] = await page.$$('.col-12.table.table-striped.table-hover > h5', (h5s: any) =>
      h5s.map((h5: any) => {
          return h5.innerText;
      })
    );
    const charges: string = await buildChargesStr(chargesArr);
    
    // get jailbird age
    const age = getAge(tableData);

    // wait for the mugshot to appear
    await page.waitForSelector('img.img-thumbnail[src]', {
      visible: true,
      timeout: 5000,
    });

    // get jailbird mugshot
    const picture = await page.$eval(
      'img.img-thumbnail[src]',
      img => img.getAttribute('src')
    );

    // write the base64 string to a local image for later uploads
    if (picture && charges && name) {
      // construct jailbird from scraped information
      jailbird = {
        charges: charges,
        inmateID: inmateId,
        name: name,
        picture: picture,
        facility: JAILS.RICHMOND_CITY_JAIL,
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
};

export default buildJailbird;