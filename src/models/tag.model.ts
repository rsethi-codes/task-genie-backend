import mongoose, { Schema } from "mongoose";

export interface ITag extends Document {
  name: string;
  color?: string;
  ownerId?: mongoose.Types.ObjectId; // if user-specific tag
  createdAt: Date;
}
const TagSchema = new Schema({
  name: { type: String, required: true, index: true },
  color: String,
  ownerId: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});
TagSchema.index(
  { name: 1, ownerId: 1 },
  { unique: true, partialFilterExpression: { ownerId: { $type: "objectId" } } }
);
