import mongoose, { Schema } from "mongoose";

// Project (could be a team project or personal list)
export interface IProject extends Document {
  name: string;
  description?: string;
  ownerId: mongoose.Types.ObjectId;
  memberIds: mongoose.Types.ObjectId[];
  visibility: "private" | "team" | "public";
  color?: string;
  createdAt: Date;
  updatedAt: Date;
  meta?: any;
}

const ProjectSchema = new Schema<IProject>({
  name: { type: String, required: true, index: true },
  description: String,
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  memberIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
  visibility: {
    type: String,
    enum: ["private", "team", "public"],
    default: "private",
  },
  color: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  meta: Schema.Types.Mixed,
});
