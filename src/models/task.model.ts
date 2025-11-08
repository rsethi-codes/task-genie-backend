import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const taskSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", required: true },

  // Basic details
  title: { type: String, required: true },
  description: String,
  status: {
    type: String,
    enum: ["pending", "in_progress", "completed", "cancelled", "on_hold"],
    default: "pending",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  category: String,
  tags: [String],

  // Time management
  startDate: Date,
  dueDate: Date,
  estimatedDuration: Number, // in minutes
  actualDuration: Number,
  completedAt: Date,

  // Location context
  location: {
    type: {
      type: String, // "specific", "anywhere", "home", "office", "outdoor"
      default: "anywhere",
    },
    address: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
    placeId: String,
  },

  // Execution context
  context: {
    energyRequired: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    focusRequired: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    mood: [String],
    prerequisites: [{ type: Types.ObjectId, ref: "Task" }],
    tools: [String],
    people: [String],
  },

  // AI metadata for personalization
  aiMetadata: {
    complexity: Number, // 1–10
    breakdownRecommended: Boolean,
    suggestedSubtaskCount: Number,
    reasoningTrace: String, // summary of AI logic
    optimalTimeSlots: [
      {
        start: Date,
        end: Date,
        score: Number,
        reason: String,
      },
    ],
    similarTasks: [{ type: Types.ObjectId, ref: "Task" }],
    learningPoints: [String],
    generatedByModel: String, // model version or name
    confidenceScore: Number, // 0–1
  },

  // Questionnaire responses for personalization
  questionnaireResponses: [
    {
      questionId: { type: Types.ObjectId, ref: "Questionnaire" },
      question: String,
      answer: Schema.Types.Mixed, // string, object, or array
      answeredAt: Date,
    },
  ],

  // Progress and milestones
  progress: {
    percentage: { type: Number, default: 0 },
    lastUpdated: Date,
    milestones: [
      {
        title: String,
        completed: Boolean,
        completedAt: Date,
      },
    ],
  },

  // Recurrence and habits
  recurrence: {
    enabled: { type: Boolean, default: false },
    pattern: { type: String, enum: ["daily", "weekly", "monthly", "custom"] },
    interval: Number,
    daysOfWeek: [Number],
    endDate: Date,
    exceptions: [Date],
  },

  // Collaboration and sharing
  sharedWith: [
    {
      userId: { type: Types.ObjectId, ref: "User" },
      permission: {
        type: String,
        enum: ["view", "edit", "admin"],
        default: "view",
      },
      sharedAt: Date,
    },
  ],

  // Subtasks info
  hasSubtasks: { type: Boolean, default: false },
  subtaskCount: { type: Number, default: 0 },

  // Attachments
  attachments: [
    {
      type: { type: String, enum: ["file", "link", "image", "note"] },
      url: String,
      name: String,
      size: Number,
      uploadedAt: Date,
    },
  ],

  // Reminders and notifications
  reminders: [
    {
      time: Date,
      type: { type: String, enum: ["notification", "email", "sms"] },
      sent: { type: Boolean, default: false },
      sentAt: Date,
    },
  ],

  // Behavioral analytics
  analytics: {
    completionRate: Number,
    avgFocusTime: Number, // in minutes
    procrastinationScore: Number, // 0–1
    productivityTag: String, // e.g. "early riser", "night owl"
    insights: [String],
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: Date,
});

export default model("Task", taskSchema);
