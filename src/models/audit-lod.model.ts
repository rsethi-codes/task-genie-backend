import mongoose, { Schema } from "mongoose";

export interface IAuditLog extends Document {
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  action: string; // "create","update","delete","ai:generated","reminder:sent"
  performedBy?: mongoose.Types.ObjectId;
  before?: any;
  after?: any;
  meta?: any;
  createdAt: Date;
}

const AuditLogSchema = new Schema({
  entityType: String,
  entityId: Schema.Types.ObjectId,
  action: String,
  performedBy: { type: Schema.Types.ObjectId, ref: "User" },
  before: Schema.Types.Mixed,
  after: Schema.Types.Mixed,
  meta: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now, index: true },
});
