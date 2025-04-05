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

/**
 * Given a list of jailbirds from the webpage, this will 
 * filter the jailbirds that are already in the database
 * 
 * @param dbJailbirds the jailbirds from the database
 * @param webpageJailbird the jailbirds from the webpage 
 * @returns a filtered list of jailbirds
 */
const filterSavedJailbirds = (
  dbJailbirds: Jailbird[], 
  webpageJailbirds: Jailbird[]
) => {
  const result = webpageJailbirds.filter((webpageJailbird: Jailbird) => {
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

module.exports = { filterPostedJailbirds, filterSavedJailbirds }