import mongoose, { Schema } from "mongoose";

export interface ITag extends Document {
  name: string;
  color?: string;
  ownerId?: mongoose.Types.ObjectId; // if user-specific tag
  isGlobal: boolean;
  createdAt: Date;
}

const TagSchema = new Schema({
  name: { type: String, required: true },
  color: String,
  ownerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  isGlobal: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

TagSchema.index({ name: 1, ownerId: 1 }, { unique: true });
TagSchema.index({ isGlobal: 1, name: 1 });
