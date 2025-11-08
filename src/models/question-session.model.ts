import mongoose, { Schema } from "mongoose";

export interface IQuestionSession extends Document {
  userId: mongoose.Types.ObjectId; // who initiated
  taskId?: mongoose.Types.ObjectId; // task being created/updated
  modelConfigId?: mongoose.Types.ObjectId;
  messages: Array<{
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    meta?: any;
    timestamp: Date;
  }>;
  decision: {
    type: "created_tasks" | "updated_task" | "suggestions" | "clarification";
    resultIds?: mongoose.Types.ObjectId[]; // created task/subtask ids
    summary?: string;
  };
  status: "open" | "completed" | "abandoned";
  createdAt: Date;
  updatedAt: Date;
  ephemeral?: boolean; // if true TTL
}

const QuestionSessionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  taskId: { type: Schema.Types.ObjectId, ref: "Task" },
  modelConfigId: { type: Schema.Types.ObjectId, ref: "AIModelConfig" },
  messages: [
    {
      role: String,
      content: String,
      meta: Schema.Types.Mixed,
      timestamp: Date,
    },
  ],
  decision: Schema.Types.Mixed,
  status: { type: String, default: "open" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
  ephemeral: { type: Boolean, default: false },
});
// Add TTL for ephemeral sessions
QuestionSessionSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 7,
    partialFilterExpression: { ephemeral: true },
  }
);
