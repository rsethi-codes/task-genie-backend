import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth-middleware";
import { projectService } from "../services/project.service";
import { z } from "zod";
import { Visibility } from "@prisma/client";

const projectSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    visibility: z.nativeEnum(Visibility).optional(),
    color: z.string().optional(),
});

export class ProjectController {
    async createProject(req: AuthenticatedRequest, res: Response) {
        try {
            const validated = projectSchema.parse(req.body);
            const project = await projectService.createProject(req.user!.id, validated);
            res.status(201).json(project);
        } catch (error: any) {
            if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
            res.status(500).json({ error: error.message });
        }
    }

    async addMember(req: AuthenticatedRequest, res: Response) {
        try {
            const { userId, role } = req.body;
            const member = await projectService.addMember(req.user!.id, req.params.id, userId, role);
            res.status(201).json(member);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async addTask(req: AuthenticatedRequest, res: Response) {
        try {
            const { taskId } = req.body;
            const projectTask = await projectService.addTaskToProject(req.user!.id, req.params.id, taskId);
            res.status(201).json(projectTask);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getTasks(req: AuthenticatedRequest, res: Response) {
        try {
            const tasks = await projectService.getProjectTasks(req.user!.id, req.params.id);
            res.json(tasks);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const projectController = new ProjectController();
