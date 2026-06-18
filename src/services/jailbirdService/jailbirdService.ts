import { Jailbird as IJailbird } from "../../app";
import { Jailbird } from "../../models";  

const findAllJailbirds = async (): Promise<IJailbird[]> => {
  const result = await Jailbird.find();
  const jbs = result.map((jb) => jb.toObject() as IJailbird)
  return jbs;
};

const findJailbirdById = async (id: string) => {
  return await Jailbird.find({ _id: id });
};

const findJailbirdByInmateId = async (inmateID: string): Promise<IJailbird> => {
  return await Jailbird.findOne({ inmateID: inmateID });
}

const findUnpostedJailbirds = async (): Promise<IJailbird[]> => {
  return await Jailbird.find({ isPosted: false });
}

const createMultipleJailbirdsIfTheyDontExist = async (jailbirds: IJailbird[]): Promise<any> => {
  // Map your data array into a series of bulk write operations
  const operations = jailbirds.map(jb => ({
    updateOne: {
      // 1. The unique criteria to check if the document already exists
      filter: { inmateID: jb.inmateID }, 
      
      // 2. Fields to insert ONLY if no matching document is found
      update: { 
        $setOnInsert: { 
          age: jb.age,
          charges: jb.charges, 
          inmateID: jb.inmateID,
          name: jb.name,
          picture: jb.picture,
          facility: jb.facility,
          hashtags: jb.hashtags
        } 
      }, 
      
      // 3. Enable upsert to create a document if the filter returns no results
      upsert: true 
    }
  }));

  try {
    const result = await Jailbird.bulkWrite(operations);
    console.log(`Upserted (Created): ${result.upsertedCount}`);
    console.log(`Matched (Skipped): ${result.matchedCount}`);
    return result;
  } catch (error) {
    console.error('Bulk write failed:', error);
  }
};

/**
 * 
 * Does the same thing as createJailbird, but accepts an instance of
 * the Jailbird interface as an argument.
 * 
 * @param jailbird 
 */
const saveJailbird = async (jailbird: IJailbird) => {
  const newJailbird = new Jailbird(jailbird);
  return await newJailbird.save();
}

const createJailbird = async (
  inmateID: string,
  name: string,
  charges: string,
  picture: string,
  facility: string,
  timestamp: Date,
  hashtags: string[],
  age: string
) => {
  const jailbird = new Jailbird({
    inmateID: inmateID,
    name: name,
    charges: charges,
    picture: picture,
    facility: facility,
    timestamp: timestamp,
    isPosted: false,
    hashtags: hashtags,
    age: age
  });
  return await jailbird.save();
};

const deleteOldJailbirdsFromFacility = async (facility: string, date: Date) => {
  return await Jailbird.deleteMany({ 
    timestamp: { 
      $lte: date 
    }, 
    facility: facility
  });
};

const deleteOldJailbirds = async (date: Date) => {
  return await Jailbird.deleteMany({ 
    timestamp: { 
      $lte: date 
    }, 
  });
};

const deleteJailbird = async (id: string) => {
  return await Jailbird.deleteOne({ _id: id });
};

const updateJailbird = async (inmateID: string, update: object) => {
  return await Jailbird.findOneAndUpdate({ inmateID: inmateID }, update);
};

export {
  findJailbirdByInmateId,
  findAllJailbirds,
  findJailbirdById,
  findUnpostedJailbirds,
  createJailbird,
  createMultipleJailbirdsIfTheyDontExist,
  deleteJailbird,
  deleteOldJailbirds,
  deleteOldJailbirdsFromFacility,
  updateJailbird,
  saveJailbird,
};
