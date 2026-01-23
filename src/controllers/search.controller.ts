import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth-middleware";
import { searchService } from "../services/search.service";

export class SearchController {
    async search(req: AuthenticatedRequest, res: Response) {
        try {
            const query = req.query.query as string;
            if (!query) return res.status(400).json({ error: "Query is required" });
            const results = await searchService.search(req.user!.id, query);
            res.json(results);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async createEmbedding(req: AuthenticatedRequest, res: Response) {
        try {
            const embedding = await searchService.createEmbedding(req.user!.id, req.body);
            res.status(201).json(embedding);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const searchController = new SearchController();
