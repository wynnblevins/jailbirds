const mongoose = require("mongoose");

const jailbirdSchema = new mongoose.Schema(
  {
    inmateID: String,
    name: String,
    charges: String,
    picture: String,
  },
  { typeKey: "$type" }
);

module.exports = mongoose.model("Jailbird", jailbirdSchema);
