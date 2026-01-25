import { Router } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middlewares/auth-middleware";
import { intelligenceService } from "../services/intelligence.service";

const router = Router();

const savePersonaSchema = z.object({
    userId: z.string().uuid(),
    traits: z.record(z.string(), z.any()),
    confidence: z.number().min(0).max(1),
    version: z.number().positive(),
    source: z.string(),
});

router.post("/save-persona", async (req: AuthenticatedRequest, res) => {
    try {
        const validatedData = savePersonaSchema.parse(req.body);
        
        // Ensure the authenticated user matches the requested userId
        if (req.user!.id !== validatedData.userId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const personaSnapshot = await intelligenceService.updatePersona(
            validatedData.userId,
            validatedData.traits,
            validatedData.source
        );

        res.json({
            id: personaSnapshot.id,
            version: personaSnapshot.version,
            confidence: personaSnapshot.confidence,
            createdAt: personaSnapshot.createdAt
        });
    } catch (error: any) {
        if (error?.name === "ZodError") {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

export default router;
