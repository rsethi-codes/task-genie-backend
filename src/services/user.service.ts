import { userRepository } from "../repositories/user.repository";
import { UpdateUserPreferences } from "../schemas/user.schema";
import { prisma } from "../config/db";
import { Prisma } from "@prisma/client";

export class UserService {
  async getMe(userId: string) {
    return userRepository.findById(userId);
  }

  async getByClerkId(clerkId: string) {
    return userRepository.findByClerkId(clerkId);
  }

  async updatePreferences(userId: string, preferences: UpdateUserPreferences) {
    return prisma.userProfile.update({
      where: { userId },
      data: preferences as any, // Cast to any to avoid complex Json type incompatibility
    });
  }

  async getAnalytics(userId: string) {
    const totalTasks = await (prisma as any).taskNode.count({ where: { userId, deletedAt: null } });
    const completedTasks = await (prisma as any).taskNode.count({
      where: { userId, status: "COMPLETED", deletedAt: null }
    });

    const taskStatusCounts = await (prisma as any).taskNode.groupBy({
      by: ['status'],
      where: { userId, deletedAt: null },
      _count: true
    });

    return {
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) : 0,
      statusBreakdown: taskStatusCounts
    };
  }
}

export const userService = new UserService();
