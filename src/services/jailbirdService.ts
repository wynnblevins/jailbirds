import { Jailbird as IJailbird } from "../app";

const Jailbird = require("../models/Jailbird");

const findAllJailbirds = async () => {
  return await Jailbird.find();
};

const findJailbirdById = async (id: string) => {
  return await Jailbird.find({ _id: id });
};

const findJailbirdByInmateId = async (inmateID: string) => {
  return await Jailbird.find({ inmateID: inmateID });
}

const findUnpostedJailbirds = async () => {
  return await Jailbird.find({ isPosted: false });
}

const createMultipleJailbirds = async (jailbirds: IJailbird) => {
  return await Jailbird.insertMany(jailbirds)
};

const createJailbird = async (
  inmateID: string,
  name: string,
  charges: string,
  picture: string,
  facility: string,
  timestamp: string,
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

const deleteOldJailbirds = async (cutoffDate: Date) => {
  return await Jailbird.deleteMany({ timestamp: { $lte: cutoffDate } })
};

const deleteJailbird = async (id: string) => {
  return await Jailbird.deleteOne({ _id: id });
};

const updateJailbird = async (inmateID: string, update: object) => {
  return await Jailbird.findOneAndUpdate({ inmateID: inmateID }, update);
};

module.exports = {
  findJailbirdByInmateId,
  findAllJailbirds,
  findJailbirdById,
  findUnpostedJailbirds,
  createJailbird,
  createMultipleJailbirds,
  deleteJailbird,
  deleteOldJailbirds,
  updateJailbird,
};
