
import { Router } from "express";
import { authenticate } from "../middlewares/auth-middleware";
import { checkInController } from "../controllers/check-in.controller";


const router = Router();

router.post("/start", authenticate, checkInController.start.bind(checkInController));
router.post("/process", authenticate, checkInController.process.bind(checkInController));
router.post("/reply", authenticate, checkInController.reply.bind(checkInController));

export default router;
