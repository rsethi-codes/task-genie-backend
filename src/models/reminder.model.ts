import mongoose, { Schema } from "mongoose";

export interface IReminder extends Document {
  userId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  triggerAt: Date;
  channel: "push" | "email" | "sms" | "webhook";
  payload?: any;
  delivered: boolean;
  deliveredAt?: Date;
  createdAt: Date;
}

const ReminderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  taskId: { type: Schema.Types.ObjectId, ref: "Task", index: true },
  triggerAt: { type: Date, required: true, index: true },
  channel: {
    type: String,
    enum: ["push", "email", "sms", "webhook"],
    default: "push",
  },
  payload: Schema.Types.Mixed,
  delivered: { type: Boolean, default: false },
  deliveredAt: Date,
  createdAt: { type: Date, default: Date.now },
});
ReminderSchema.index({ userId: 1, triggerAt: 1 });
