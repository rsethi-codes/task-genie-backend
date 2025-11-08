import mongoose from "mongoose";
import { Schema } from "mongoose";

export interface IComment extends Document {
  taskId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  mentions?: mongoose.Types.ObjectId[];
  createdAt: Date;
  editedAt?: Date;
}

const CommentSchema = new Schema({
  taskId: {
    type: Schema.Types.ObjectId,
    ref: "Task",
    required: true,
    index: true,
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  content: { type: String, required: true },
  mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  editedAt: Date,
});
