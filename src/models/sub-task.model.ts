import { model, Schema, Types } from "mongoose";

const subtaskSchema = new Schema({
  parentTaskId: { type: Types.ObjectId, ref: "Task", required: true },
  userId: { type: Types.ObjectId, ref: "User", required: true },

  title: { type: String, required: true },
  description: String,
  status: {
    type: String,
    enum: ["pending", "in_progress", "completed", "cancelled", "on_hold"],
    default: "pending",
  },
  order: Number,

  // Time
  dueDate: Date,
  estimatedDuration: Number,
  actualDuration: Number,
  scheduledStart: Date,
  scheduledEnd: Date,
  completedAt: Date,

  // Dependencies and sequence
  dependencies: [{ type: Types.ObjectId, ref: "Subtask" }],
  blockedBy: [{ type: Types.ObjectId, ref: "Subtask" }],

  // AI suggestions
  aiSuggestions: {
    optimalOrder: Number,
    bestTimeOfDay: String,
    estimatedEffort: String,
    tips: [String],
    reasoning: String,
  },

  context: {
    locationRequired: Boolean,
    toolsNeeded: [String],
    estimatedEnergy: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },

  // Notes & tracking
  notes: [
    {
      content: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],

  attempts: [
    {
      startedAt: Date,
      endedAt: Date,
      completed: Boolean,
      duration: Number,
      notes: String,
    },
  ],

  aiGenerated: { type: Boolean, default: false },
  userModified: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default model("Subtask", subtaskSchema);
