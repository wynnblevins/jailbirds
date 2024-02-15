const Jailbird = require("../models/Jailbird");

const findAllJailbirds = async () => {
  return await Jailbird.find();
};

const findJailbirdById = async (id: string) => {
  return await Jailbird.find({ _id: id });
};

const createJailbird = async (
  name: string,
  charges: string,
  picture: string
) => {
  const jailbird = new Jailbird({
    name: name,
    charges: charges,
    picture: picture,
  });
  return await jailbird.save();
};

const deleteJailbird = async (id: string) => {
  return await Jailbird.deleteOne({ _id: id });
};

const updateJailbird = async (id: string, update: object) => {
  return await Jailbird.findOneAndUpdate({ _id: id }, update);
};

module.exports = {
  findAllJailbirds,
  createJailbird,
  deleteJailbird,
  updateJailbird,
};
