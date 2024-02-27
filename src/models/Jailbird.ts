const mongoose = require("mongoose");

const jailbirdSchema = new mongoose.Schema(
  {
    inmateID: String,
    name: String,
    charges: String,
    picture: String,
    facility: String,
    age: Number,
  },
  { typeKey: "$type" }
);

module.exports = mongoose.model("Jailbird", jailbirdSchema);
