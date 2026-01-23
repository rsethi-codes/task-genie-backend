import { Router } from "express";
import { auditLogRepository } from "../repositories/audit-log.repository";
import { authenticate, AuthenticatedRequest } from "../middlewares/auth-middleware";
import { Response } from "express";

const router = Router();

router.get("/me", authenticate as any, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const logs = await auditLogRepository.findByUserId(req.user!.id);
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/task/:taskId", authenticate as any, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const logs = await auditLogRepository.findByTaskId(req.params.taskId);
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export const auditLogRoutes = router;
