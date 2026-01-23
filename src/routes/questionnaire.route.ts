import { Router } from "express";
import { questionnaireController } from "../controllers/questionnaire.controller";
import { authenticate } from "../middlewares/auth-middleware";

const router = Router();

router.get("/", questionnaireController.getQuestionnaires);
router.post("/", authenticate as any, questionnaireController.createQuestionnaire);
router.patch("/:id", authenticate as any, questionnaireController.updateQuestionnaire);

export const questionnaireRoutes = router;
