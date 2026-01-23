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

const AuditLogSchema = new Schema(
  {
    entityType: String,
    entityId: Schema.Types.ObjectId,
    action: String,
    performedBy: { type: Schema.Types.ObjectId, ref: "User" },
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    meta: Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    capped: { size: 1073741824, max: 1000000 }, // Optional: 1GB cap
  }
);

// Or use TTL for automatic cleanup
AuditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 } // 90 days retention
);
