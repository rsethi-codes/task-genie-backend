import mongoose, { Schema, Document } from "mongoose";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  OWNER = "owner",
}

export interface IUser extends Document {
  email: string;
  displayName: string;
  avatarUrl?: string;
  timeZone: string; // e.g. "Asia/Kolkata"
  locale: string; // e.g. "en-IN"
  preferences: {
    defaultReminderMinutesBefore?: number;
    smartSuggestionsEnabled: boolean;
    dailySummaryTime?: string;
    aiStyle?: "concise" | "detailed";
    productivityStyle?: "time-blocking" | "task-priority";
    workingHours?: { start: string; end: string };
    workingDays?: string[];
    focusTime?: {
      enabled: boolean;
      blocks: Array<{ day: string; startTime: string; endTime: string }>;
    };
    behaviorData?: {};
    remindersEnabled: boolean;
    currentPersonaVersion: number;
  };
  roles: UserRole[];
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt?: Date;
  meta?: Record<string, any>;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  displayName: { type: String, required: true, index: true },
  avatarUrl: String,
  timeZone: { type: String, default: "UTC" },
  locale: { type: String, default: "en-US" },
  preferences: {
    defaultReminderMinutesBefore: { type: Number, default: 30 },
    smartSuggestionsEnabled: { type: Boolean, default: true },
    dailySummaryTime: String,
    aiStyle: {
      type: String,
      enum: ["concise", "detailed"],
      default: "detailed",
    },
    productivityStyle: {
      type: String,
      enum: ["time-blocking", "task-priority"],
      default: "task-priority",
    },
    workingHours: {
      start: String, // e.g., "09:00"
      end: String, // e.g., "17:00"
    },
    workingDays: [String], // e.g., ["Monday", "Tuesday", "Wednesday"]
    focusTime: {
      enabled: Boolean,
      blocks: [
        {
          day: String,
          startTime: String,
          endTime: String,
        },
      ],
    },
    behaviorData: {
      // AI learns from this
      completionPatterns: {
        bestProductivityHours: [String], // e.g., ["09:00-11:00", "14:00-16:00"]
        averageTaskDuration: {}, // Map of task types to average durations
        procrastinationTendencies: {}, // Tasks types user tends to delay
      },
      locationPreferences: {}, // Common locations for task types
      energyLevels: [
        {
          timeOfDay: String,
          energyLevel: Number, // 1-10 scale
          recordedAt: Date,
        },
      ],
    },
    remindersEnabled: { type: Boolean, default: true },
    currentPersonaVersion: { type: Number, default: 1 },
  },
  roles: { type: [String], default: [UserRole.USER] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastSeenAt: Date,
  meta: Schema.Types.Mixed,
});

UserSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const UserModel = mongoose.model<IUser>("User", UserSchema);
