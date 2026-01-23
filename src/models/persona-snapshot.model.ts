import mongoose, { Schema, Document } from "mongoose";

export interface IPersonaSnapshot extends Document {
    userId: mongoose.Types.ObjectId;
    version: number;
    traits: {
        planningStyle: 'detailed' | 'minimalist' | 'visual' | 'structured';
        energyManagement: 'burst' | 'steady' | 'late-night' | 'early-bird';
        aiIntervention: 'autonomous' | 'advisory' | 'manual';
        tone: 'professional' | 'motivational' | 'casual' | 'analytical';
    };
    confidence: Record<string, 'high' | 'medium' | 'low'>;
    meta: {
        lastUpdated: Date;
        updateSource: 'onboarding' | 'interaction' | 'feedback' | 'observation';
        changeReason: string;
    };
}

const PersonaSnapshotSchema = new Schema<IPersonaSnapshot>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    version: { type: Number, required: true },
    traits: {
        planningStyle: { type: String, enum: ['detailed', 'minimalist', 'visual', 'structured'], required: true },
        energyManagement: { type: String, enum: ['burst', 'steady', 'late-night', 'early-bird'], required: true },
        aiIntervention: { type: String, enum: ['autonomous', 'advisory', 'manual'], required: true },
        tone: { type: String, enum: ['professional', 'motivational', 'casual', 'analytical'], required: true },
    },
    confidence: { type: Map, of: String },
    meta: {
        lastUpdated: { type: Date, default: Date.now },
        updateSource: { type: String, enum: ['onboarding', 'interaction', 'feedback', 'observation'], required: true },
        changeReason: { type: String, required: true },
    }
});

PersonaSnapshotSchema.index({ userId: 1, version: -1 });

export const PersonaSnapshotModel = mongoose.model<IPersonaSnapshot>("PersonaSnapshot", PersonaSnapshotSchema);
