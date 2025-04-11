import mongoose from "mongoose";

const jailbirdSchema = new mongoose.Schema(
  {
    inmateID: String,
    name: String,
    charges: String,
    picture: String,
    facility: String,
    age: Number,
    tags: String,
    timestamp: Date,
    isPosted: Boolean,
    hashtags: [String]
  },
  { typeKey: "$type" }
);

const Jailbird = mongoose.model("Jailbird", jailbirdSchema)

export { Jailbird };
