import mongoose, { Types } from "mongoose";

export interface IJailbird {
  _id?: Types.ObjectId;
  inmateID: string;
  name: string;
  charges: string;
  picture: string;
  facility: string;
  age?: number;
  timestamp: Date;
  isPosted: boolean;
  hashtags: string[];
}

const jailbirdSchema = new mongoose.Schema<IJailbird>({
  inmateID: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  charges: {
    type: String,
    required: true
  },
  picture: {
    type: String,
    required: true
  },
  facility: {
    type: String,
    required: true
  },
  age: Number,
  timestamp: {
    type: Date,
    required: true
  },
  isPosted: {
    type: Boolean,
    required: true
  },
  hashtags: {
    type: [String],
    required: true
  }
});

const Jailbird = mongoose.model<IJailbird>(
  "Jailbird",
  jailbirdSchema
);

export { Jailbird };