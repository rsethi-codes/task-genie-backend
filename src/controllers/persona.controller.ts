import { Request, Response } from 'express';
import { PersonaSnapshotModel } from '../models/persona-snapshot.model';
import { UserModel } from '../models/user.model';

export const PersonaController = {
    getCurrent: async (req: Request, res: Response) => {
        try {
            const user = await UserModel.findById(req.user.id);
            if (!user) return res.status(404).json({ message: 'User not found' });

            const persona = await PersonaSnapshotModel.findOne({
                userId: user._id,
                version: user.preferences.currentPersonaVersion
            });

            res.json(persona);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching persona' });
        }
    },

    getHistory: async (req: Request, res: Response) => {
        try {
            const history = await PersonaSnapshotModel.find({ userId: req.user.id })
                .sort({ version: -1 });
            res.json(history);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching history' });
        }
    },

    update: async (req: Request, res: Response) => {
        try {
            const { traits, confidence, reason, source } = req.body;
            const user = await UserModel.findById(req.user.id);
            if (!user) return res.status(404).json({ message: 'User not found' });

            const lastPersona = await PersonaSnapshotModel.findOne({ userId: user._id })
                .sort({ version: -1 });

            const newVersion = (lastPersona?.version || 0) + 1;

            const newPersona = new PersonaSnapshotModel({
                userId: user._id,
                version: newVersion,
                traits: { ...(lastPersona?.traits || {}), ...traits },
                confidence: { ...(lastPersona?.confidence || {}), ...confidence },
                meta: {
                    lastUpdated: new Date(),
                    updateSource: source,
                    changeReason: reason,
                }
            });

            await newPersona.save();

            user.preferences.currentPersonaVersion = newVersion;
            await user.save();

            res.status(201).json(newPersona);
        } catch (error) {
            res.status(500).json({ message: 'Error updating persona' });
        }
    },

    rollback: async (req: Request, res: Response) => {
        try {
            const { version } = req.params;
            const user = await UserModel.findById(req.user.id);
            if (!user) return res.status(404).json({ message: 'User not found' });

            const snapshot = await PersonaSnapshotModel.findOne({
                userId: user._id,
                version: parseInt(version)
            });

            if (!snapshot) return res.status(404).json({ message: 'Snapshot not found' });

            user.preferences.currentPersonaVersion = snapshot.version;
            await user.save();

            res.json(snapshot);
        } catch (error) {
            res.status(500).json({ message: 'Error rolling back persona' });
        }
    }
};
