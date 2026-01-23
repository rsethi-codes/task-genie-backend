import mongoose, { Schema } from "mongoose";

export interface IEmbedding extends Document {
  ownerId?: mongoose.Types.ObjectId; // user-scoped
  docType: string; // "task" | "note" | "comment"
  docId: mongoose.Types.ObjectId;
  vector: number[]; // e.g. 1536 floats
  modelVersion: string;
  dimensions: number;
  createdAt: Date;
}

const EmbeddingSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  docType: { type: String, index: true },
  docId: { type: Schema.Types.ObjectId, required: true, index: true },
  vector: { type: [Number], required: true },
  modelVersion: String, // track which model generated this
  dimensions: Number, // useful for validation
  createdAt: { type: Date, default: Date.now },
});

// Embedding schema - vector search needs special handling
EmbeddingSchema.index({ ownerId: 1, docType: 1 });
