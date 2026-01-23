import { prisma } from "../config/db";
import { User, Prisma } from "@prisma/client";
import { clerkClient } from "@clerk/express";

/**
 * Centralized user creation service
 * Handles idempotent user creation from Clerk webhook or auth middleware
 */
export class UserCreationService {
    /**
     * Create or get existing user by clerkId (idempotent)
     * This is the single source of truth for user creation
     */
    async getOrCreateUser(clerkId: string): Promise<User> {
        // Use upsert to handle race conditions atomically
        console.log(`🔐 Get/Create user for: ${clerkId}`);

        // Fetch user data from Clerk as fallback if we need to create
        // We do this outside the transaction to keep it fast
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const email = clerkUser.emailAddresses.find(
            (e) => e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress;

        if (!email) {
            throw new Error(`No email found for Clerk user: ${clerkId}`);
        }

        const displayName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || email.split("@")[0];

        // Atomic upsert
        const user = await prisma.user.upsert({
            where: { clerkId },
            update: {
                // If it exists, just update last seen or non-critical info
                lastSeenAt: new Date(),
            },
            create: {
                clerkId,
                email,
                displayName,
                avatarUrl: clerkUser.imageUrl || null,
                timeZone: "UTC",
                locale: "en-US",
                profile: {
                    create: {},
                },
            },
            include: { profile: true },
        });

        console.log(`✅ User materialized: ${user.id} (${email})`);
        return user;
    }

    /**
     * Create user from webhook event data
     * Extracts all necessary data from Clerk webhook payload
     */
    async createUserFromWebhook(userData: {
        clerkId: string;
        email: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
    }): Promise<User> {
        const { clerkId, email, firstName, lastName, avatar } = userData;

        if (!clerkId || !email) {
            throw new Error(`Missing critical user data: clerkId=${clerkId}, email=${email}`);
        }

        const displayName = `${firstName || ""} ${lastName || ""}`.trim() || email.split("@")[0];

        // Upsert ensures idempotency - safe for retries and races with auth middleware
        const user = await prisma.user.upsert({
            where: { clerkId },
            update: {
                email,
                displayName,
                avatarUrl: avatar || null,
                lastSeenAt: new Date(),
                isActive: true, // Reactivate if they were soft-deleted
            },
            create: {
                clerkId,
                email,
                displayName,
                avatarUrl: avatar || null,
                timeZone: "UTC",
                locale: "en-US",
                profile: {
                    create: {},
                },
            },
            include: { profile: true },
        });

        console.log(`👤 [UserCreationService] User synchronized | clerkId: ${clerkId} | userId: ${user.id} | email: ${email}`);
        return user;
    }

    /**
     * Delete user (for user.deleted webhook)
     */
    async deleteUser(clerkId: string): Promise<User | null> {
        const user = await prisma.user.findUnique({
            where: { clerkId },
        });

        if (!user) {
            console.log(`⚠️ [UserCreationService] User not found for deletion | clerkId: ${clerkId}`);
            return null;
        }

        // Soft delete - mark as inactive
        const updatedUser = await prisma.user.update({
            where: { clerkId },
            data: {
                isActive: false,
                lastSeenAt: new Date(),
            },
        });

        console.log(`🗑️ [UserCreationService] User soft-deleted | clerkId: ${clerkId} | userId: ${user.id}`);
        return updatedUser;
    }

    /**
     * Update user's last seen timestamp
     */
    async updateLastSeen(userId: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: { lastSeenAt: new Date() },
        });
    }
}

export const userCreationService = new UserCreationService();
