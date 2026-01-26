import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth-middleware.js";
import { taskService } from "../services/task.service.js";
import { createTaskSchema, updateTaskSchema, taskFilterSchema } from "../schemas/task.schema.js";
import { intelligenceService } from "../services/intelligence.service.js";
import { logger } from "../middlewares/observability.js";

export class TaskController {
  async createTask(req: AuthenticatedRequest, res: Response) {
    const correlationId = (req as any).correlationId;
    try {
      const validated = createTaskSchema.parse(req.body);
      const task = await taskService.createTask(req.user!.id, validated, correlationId);
      res.status(201).json(task);
    } catch (error: any) {
      logger.error("Failed to create task", { correlationId, error: error.message, userId: req.user?.id });
      if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
      res.status(500).json({ error: error.message });
    }
  }

  async getTasks(req: AuthenticatedRequest, res: Response) {
    try {
      const filters = taskFilterSchema.partial().parse(req.query);
      const tasks = await taskService.getTasks(req.user!.id, filters);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTask(req: AuthenticatedRequest, res: Response) {
    try {
      const task = await taskService.getTaskById(req.params.id, req.user!.id);
      if (!task) return res.status(404).json({ error: "Task not found" });
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateTask(req: AuthenticatedRequest, res: Response) {
    const correlationId = (req as any).correlationId;
    try {
      const validated = updateTaskSchema.parse(req.body);
      const task = await taskService.updateTask(req.params.id, req.user!.id, validated, correlationId);
      res.json(task);
    } catch (error: any) {
      logger.error("Failed to update task", { correlationId, error: error.message, taskId: req.params.id });
      if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
      res.status(500).json({ error: error.message });
    }
  }

  async deleteTask(req: AuthenticatedRequest, res: Response) {
    const correlationId = (req as any).correlationId;
    try {
      await taskService.deleteTask(req.params.id, req.user!.id, correlationId);
      res.status(204).send();
    } catch (error: any) {
      logger.error("Failed to delete task", { correlationId, error: error.message, taskId: req.params.id });
      res.status(500).json({ error: error.message });
    }
  }

  async restoreTask(req: AuthenticatedRequest, res: Response) {
    const correlationId = (req as any).correlationId;
    try {
      const task = await taskService.restoreTask(req.params.id, req.user!.id, correlationId);
      res.json(task);
    } catch (error: any) {
      logger.error("Failed to restore task", { correlationId, error: error.message, taskId: req.params.id });
      res.status(500).json({ error: error.message });
    }
  }

  async generateSubtasks(req: AuthenticatedRequest, res: Response) {
    const correlationId = (req as any).correlationId;
    try {
      const subtasks = await intelligenceService.generateSubtasks(req.user!.id, req.params.id);
      res.status(201).json(subtasks);
    } catch (error: any) {
      logger.error("Failed to generate subtasks", { correlationId, error: error.message, taskId: req.params.id });
      res.status(500).json({ error: error.message });
    }
  }

  async enrichTask(req: AuthenticatedRequest, res: Response) {
    const correlationId = (req as any).correlationId;
    try {
      const { title } = req.body;
      if (!title) return res.status(400).json({ error: "Title is required" });

      const enrichment = await intelligenceService.enrichTaskIntent(req.user!.id, title);
      res.json(enrichment);
    } catch (error: any) {
      logger.error("Failed to enrich task", { correlationId, error: error.message, userId: req.user?.id });
      res.status(500).json({ error: error.message });
    }
  }

  async refineTask(req: AuthenticatedRequest, res: Response) {
    const correlationId = (req as any).correlationId;
    try {
      const { subtasks } = req.body;
      if (!subtasks || !Array.isArray(subtasks)) {
        return res.status(400).json({ error: "Subtasks array is required" });
      }

      await intelligenceService.captureRefinementSignal(req.user!.id, req.params.id, subtasks);
      res.status(204).send();
    } catch (error: any) {
      logger.error("Failed to refine task", { correlationId, error: error.message, taskId: req.params.id });
      res.status(500).json({ error: error.message });
    }
  }

  async generateNodes(req: AuthenticatedRequest, res: Response) {
    const correlationId = (req as any).correlationId;
    try {
      const force = req.body.force === true;
      const nodes = await intelligenceService.generateNodes(req.user!.id, req.params.id, force);
      res.status(201).json(nodes);
    } catch (error: any) {
      logger.error("Failed to generate nodes", { correlationId, error: error.message, taskId: req.params.id });
      res.status(500).json({ error: error.message });
    }
  }

  async expandNode(req: AuthenticatedRequest, res: Response) {
    const correlationId = (req as any).correlationId;
    try {
      const { expansionType } = req.body;
      if (!expansionType || !['PHASE_TO_DAILY', 'DAILY_TO_ACTION', 'ROOT_TO_PHASE'].includes(expansionType)) {
        return res.status(400).json({ error: "Valid expansionType is required" });
      }

      const children = await intelligenceService.expandNode(req.user!.id, req.params.id, expansionType);
      res.status(201).json(children);
    } catch (error: any) {
      logger.error("Failed to expand node", { correlationId, error: error.message, nodeId: req.params.id });
      res.status(500).json({ error: error.message });
    }
  }

  async reorderTasks(req: AuthenticatedRequest, res: Response) {
    try {
      const { id, parentId, newOrder } = req.body;
      if (!id || newOrder === undefined) return res.status(400).json({ error: "id and newOrder are required" });
      const nodes = await taskService.reorderTasks(id, parentId || null, req.user!.id, newOrder);
      res.json(nodes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTodaysFocus(req: AuthenticatedRequest, res: Response) {
    try {
      const todaysFocus = await intelligenceService.getTodaysFocus(req.user!.id);
      res.json(todaysFocus);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async classifyTask(req: AuthenticatedRequest, res: Response) {
    const correlationId = (req as any).correlationId;
    try {
      const { title } = req.body;
      if (!title) return res.status(400).json({ error: "Title is required" });

      const classification = await intelligenceService.classifyTaskComplexity(req.user!.id, title);
      res.json(classification);
    } catch (error: any) {
      logger.error("Failed to classify task", { correlationId, error: error.message, userId: req.user?.id });
      res.status(500).json({ error: error.message });
    }
  }

  async getQuestionnaire(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await intelligenceService.getAdaptiveQuestionnaire(req.user!.id, req.params.id);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async submitAnswer(req: AuthenticatedRequest, res: Response) {
    try {
      const { questionId, answer, metrics } = req.body;
      const data = await intelligenceService.submitQuestionnaireAnswer(
        req.user!.id,
        req.params.sessionId,
        questionId,
        answer,
        metrics
      );
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const taskController = new TaskController();
