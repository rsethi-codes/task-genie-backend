import { prisma } from "../config/db";
import { User, Prisma } from "@prisma/client";

export class UserRepository {
    async findByClerkId(clerkId: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { clerkId },
            include: {
                profile: true,
            },
        });
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        return prisma.user.create({
            data,
            include: {
                profile: true,
            },
        });
    }

    async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        return prisma.user.update({
            where: { id },
            data,
            include: {
                profile: true,
            },
        });
    }

    async findById(id: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { id },
            include: {
                profile: true,
            },
        });
    }

    async findWithPersona(id: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { id },
            include: {
                profile: true,
                behaviorPatterns: true,
                personaSnapshots: {
                    orderBy: { version: 'desc' },
                    take: 1
                }
            },
        });
    }
}

export const userRepository = new UserRepository();
