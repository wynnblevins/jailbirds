import { IJailbird } from "../../app";
import { Jailbird } from "../../models";  

const findAllJailbirds = async (): Promise<IJailbird[]> => {
  const result = await Jailbird.find();
  const jbs = result.map((jb) => jb.toObject() as IJailbird)
  return jbs;
};

const findJailbirdById = async (id: string) => {
  return await Jailbird.find({ _id: id });
};

const findJailbirdByInmateId = async (inmateID: string): Promise<IJailbird | null> => {
  return await Jailbird.findOne({ inmateID: inmateID });
}

const findUnpostedJailbirds = async (): Promise<IJailbird[]> => {
  return await Jailbird.find({ isPosted: false });
}

const createMultipleJailbirds = async (
  jailbirds: IJailbird[]
): Promise<any[]> => {
  return await Jailbird.insertMany(jailbirds);
};

const createMultipleJailbirdsIfTheyDontExist = async (
  jailbirds: IJailbird[]
): Promise<any[]> => {
  if (jailbirds.length === 0) {
    return [];
  }

  // Get all inmate IDs from the incoming jailbirds
  const inmateIDs = jailbirds.map(jb => jb.inmateID);

  // Find the inmate IDs that already exist
  const existingJailbirds = await Jailbird.find(
    { inmateID: { $in: inmateIDs } },
    { inmateID: 1 }
  );

  const existingIDs = new Set(
    existingJailbirds.map(jb => jb.inmateID)
  );

  // Keep only the jailbirds that don't already exist
  const newJailbirds = jailbirds.filter(
    jb => !existingIDs.has(jb.inmateID)
  );

  if (newJailbirds.length === 0) {
    return [];
  }

  return await Jailbird.insertMany(newJailbirds);
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
  createMultipleJailbirds,
  deleteJailbird,
  deleteOldJailbirds,
  deleteOldJailbirdsFromFacility,
  updateJailbird,
  saveJailbird,
  createMultipleJailbirdsIfTheyDontExist
};
