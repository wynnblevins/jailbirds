import { Jailbird } from "../app";
const {
  findJailbirdByInmateId
} = require("./jailbirdService");

const asyncFilter = async (arr, predicate) => {
  const results = await Promise.all(arr.map(predicate));
  return arr.filter((_v, index) => results[index]);
}

function containsJailbird(obj: Jailbird, list: Jailbird[]) {
  var i;
  for (i = 0; i < list.length; i++) {
      if (list[i].inmateID === obj.inmateID) {
          return true;
      }
  }

  return false;
}

const filterSavedJailbirds = (
  allDbJailbirds: Jailbird[], 
  webpageJailbirds: Jailbird[]
) => {
  return webpageJailbirds.filter((webpageJailbird: Jailbird) => {
    return !containsJailbird(webpageJailbird, allDbJailbirds)
  })
};

/**
 * Given a list of jailbirds, filters the posted jailbirds
 * 
 * @param jailbirds 
 * @returns a filtered list of jailbirds
 */
const filterPostedJailbirds = async (jailbirds: Jailbird[]) => {
  const asyncResult = await asyncFilter(jailbirds, 
    async (jailbird: Jailbird) => {
      const result: Jailbird = await findJailbirdByInmateId(jailbird.inmateID);
      return !result[0]?.isPosted;
    }
  );  
  
  return new Promise<void>(async (done) => {  
    done(asyncResult);
  });
};

const chargesAreAll = (chargeToOmit: string, jailbird: Jailbird) => {
  const charges = jailbird.charges.split(',');

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
const filterBoringJailbirds = (jailbirds: Jailbird[], boringCharge: string) => {
  const filtered = jailbirds.filter((jb) => { 
    return !chargesAreAll(boringCharge, jb) 
  });
  return filtered;
};

module.exports = { 
  filterPostedJailbirds, 
  filterSavedJailbirds,
  filterBoringJailbirds,
}