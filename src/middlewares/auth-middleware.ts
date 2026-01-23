import { clerkClient, getAuth, requireAuth } from "@clerk/express";
import { NextFunction, Request, Response } from "express";
import { userRepository } from "../repositories/user.repository";
import { userCreationService } from "../services/user-creation.service";
import { User } from "@prisma/client";

export type AuthenticatedRequest = Request & {
  clerkId?: string;
  user?: User;
  correlationId?: string;
};

/**
 * Authentication middleware
 * 
 * Flow:
 * 1. Verify Clerk JWT token
 * 2. Get or create user in database (idempotent)
 * 3. Attach user to request
 * 
 * Note: This middleware may race with the webhook, but both use
 * the same idempotent service, so it's safe.
 */
export const authenticate = [
  requireAuth(),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      let clerkId: string | undefined;

      // Test mode support
      if (process.env.NODE_ENV === "test" && req.headers["x-test-user-id"]) {
        clerkId = req.headers["x-test-user-id"] as string;
      } else {
        const auth = getAuth(req);
        clerkId = auth.userId || undefined;
      }

      if (!clerkId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Use centralized service - handles both webhook and middleware flows
      // This is idempotent and safe for concurrent calls
      let user: User;

      if (process.env.NODE_ENV === "test") {
        // In test mode, create a test user directly
        user = await userRepository.findByClerkId(clerkId) || await userRepository.create({
          clerkId,
          email: (req.headers["x-test-user-email"] as string) || `${clerkId}@example.com`,
          displayName: "Test User",
          avatarUrl: "",
          profile: {
            create: {}
          }
        });
      } else {
        // Production: use centralized service
        user = await userCreationService.getOrCreateUser(clerkId);

        // Update last seen timestamp (fire and forget)
        userCreationService.updateLastSeen(user.id).catch(err =>
          console.error("Failed to update lastSeenAt:", err)
        );
      }

      req.clerkId = clerkId;
      req.user = user;

      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(500).json({ message: "Error identifying user" });
    }
  },
];
