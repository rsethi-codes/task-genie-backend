import { Router } from "express";
import { searchController } from "../controllers/search.controller";
import { authenticate } from "../middlewares/auth-middleware";

const router = Router();

router.get("/", authenticate as any, searchController.search);
router.post("/embeddings", authenticate as any, searchController.createEmbedding);

export const searchRoutes = router;
