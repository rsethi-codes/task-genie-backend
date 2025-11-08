import { clerkClient, getAuth, requireAuth } from "@clerk/express";
import { NextFunction, Request, Response } from "express";

type AuthenticatedRequest = Request & { user?: any };

export const authenticate = [
  requireAuth(),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = getAuth(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await clerkClient.users.getUser(userId);
      req.user = user; // Attach user to request object

      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(500).json({ message: "Error fetching user" });
    }
  },
];
