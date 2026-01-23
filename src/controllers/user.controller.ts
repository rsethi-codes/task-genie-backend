import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth-middleware";
import { userService } from "../services/user.service";
import { updateUserPreferencesSchema } from "../schemas/user.schema";

export class UserController {
  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await userService.getMe(req.user!.id);
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getByClerkId(req: AuthenticatedRequest, res: Response) {
    try {
      const { clerkId } = req.params;
      const user = await userService.getByClerkId(clerkId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updatePreferences(req: AuthenticatedRequest, res: Response) {
    try {
      const validated = updateUserPreferencesSchema.parse(req.body);
      const profile = await userService.updatePreferences(req.user!.id, validated);
      res.json(profile);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async getAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const analytics = await userService.getAnalytics(req.user!.id);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const userController = new UserController();
