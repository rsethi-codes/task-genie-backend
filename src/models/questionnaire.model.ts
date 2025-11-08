import { model, Schema, Types } from "mongoose";

const questionnaireSchema = new Schema({
  category: {
    type: String,
    enum: ["time", "location", "motivation", "resources", "schedule", "custom"],
  },
  question: String,
  type: {
    type: String,
    enum: ["text", "choice", "multi-choice", "rating", "datetime", "boolean"],
    default: "text",
  },
  options: [String],
  aiHint: String, // guidance for AI on how to interpret this
  followUps: [{ type: Types.ObjectId, ref: "Questionnaire" }],
  createdAt: { type: Date, default: Date.now },
});
export default model("Questionnaire", questionnaireSchema);
