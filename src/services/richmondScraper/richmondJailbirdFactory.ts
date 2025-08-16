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

const getAge = (jailbirdData: string[]): number => {
  const CURRENT_AGE_LABEL = 'Current Age:';
  const CURRENT_AGE_LABEL_NDX = jailbirdData.indexOf(CURRENT_AGE_LABEL);
  const CURRENT_AGE_NDX = CURRENT_AGE_LABEL_NDX + 1;
  const age = jailbirdData[CURRENT_AGE_NDX];
  return parseInt(age);
};

const buildJailbird = async (page): Promise<Jailbird> => {
  let jailbird: Jailbird = null;

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