import { IJailbird } from "../../app";
const {
  findJailbirdByInmateId
} = require("../jailbirdService");

const asyncFilter = async (arr: any[], predicate: any) => {
  const results = await Promise.all(arr.map(predicate));
  return arr.filter((_v, index) => results[index]);
}

function containsJailbird(obj: IJailbird, list: IJailbird[]) {
  var i;
  for (i = 0; i < list.length; i++) {
      if (list[i]?.inmateID === obj?.inmateID) {
          return true;
      }
  }

  return false;
}

/**
 * Given a list of jailbirds from the webpage, this will 
 * filter the jailbirds that are already in the database
 * 
 * @param dbJailbirds the jailbirds from the database
 * @param webpageJailbird the jailbirds from the webpage 
 * @returns a filtered list of jailbirds
 */
const filterSavedJailbirds = (
  dbJailbirds: IJailbird[], 
  webpageJailbirds: IJailbird[]
) => {
  const result = webpageJailbirds.filter((webpageJailbird: IJailbird) => {
    const filter = !containsJailbird(webpageJailbird, dbJailbirds)
    return filter;
  })

  return result;
};

/**
 * Given a list of jailbirds, filters the posted jailbirds
 * 
 * @param jailbirds 
 * @returns a filtered list of jailbirds
 */
const filterPostedJailbirds = async (
  jailbirds: IJailbird[]
): Promise<IJailbird[]> =>
  asyncFilter(
    jailbirds,
    async (jailbird: IJailbird) => {
      const result = await findJailbirdByInmateId(
        jailbird.inmateID
      );

      return !result[0]?.isPosted;
    }
  );

const chargesAreAll = (chargeToOmit: string, jailbird: IJailbird) => {
  const charges = jailbird?.charges.split(',');

  for (let i = 0; i < charges.length; i++) {
    if (charges[i].trim() !== chargeToOmit) {
      return false;
    }
  }
  return true;
}

/**
 * Given a list of jailbirds, filters the jailbirds with a
 * single (and likely boring) charge which the caller wants ommitted
 * 
 * @param jailbirds 
 * @param boringCharge
 * @returns a filtered list of jailbirds
 */
const filterBoringJailbirds = (jailbirds: IJailbird[], boringCharge: string) => {
  const filtered = jailbirds.filter((jb) => { 
    return !chargesAreAll(boringCharge, jb) 
  });
  return filtered;
};


export { 
  filterBoringJailbirds, 
  filterPostedJailbirds, 
  filterSavedJailbirds 
}