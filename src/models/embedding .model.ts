import mongoose, { Schema } from "mongoose";

export interface IEmbedding extends Document {
  ownerId?: mongoose.Types.ObjectId; // user-scoped
  docType: string; // "task" | "note" | "comment"
  docId: mongoose.Types.ObjectId;
  vector: number[]; // e.g. 1536 floats
  createdAt: Date;
}

const EmbeddingSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: "User" },
  docType: { type: String, index: true },
  docId: { type: Schema.Types.ObjectId, required: true, index: true },
  vector: { type: [Number], required: true },
  createdAt: { type: Date, default: Date.now },
});
