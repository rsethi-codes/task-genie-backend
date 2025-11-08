import mongoose, { Schema } from "mongoose";

export interface IAIModelConfig extends Document {
  name: string; // e.g. "gpt-5-thoughtful-v1"
  provider: string; // "openai", "local", "anthropic"
  modelId: string;
  temperature: number;
  maxTokens?: number;
  promptTemplateId?: mongoose.Types.ObjectId;
  ownerId?: mongoose.Types.ObjectId; // per-user model config
  createdAt: Date;
}

const AIModelConfigSchema = new Schema({
  name: String,
  provider: String,
  modelId: String,
  temperature: { type: Number, default: 0.2 },
  maxTokens: Number,
  promptTemplateId: { type: Schema.Types.ObjectId, ref: "PromptTemplate" },
  ownerId: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});
