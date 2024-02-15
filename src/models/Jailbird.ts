const mongoose = require("mongoose");

const jailbirdSchema = new mongoose.Schema(
  {
    name: String,
    charges: String,
    picture: String,
  },
  { typeKey: "$type" }
);

module.exports = mongoose.model("Jailbird", jailbirdSchema);
