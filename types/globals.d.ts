/// <reference types="@clerk/express/env" />

import { PrismaClient } from "@prisma/client";

declare global {
    /**
     * Prisma singleton (prevents multiple instances in dev / hot reload)
     */
    var prisma: PrismaClient | undefined;

    /**
     * Strongly typed environment variables
     * (optional but highly recommended)
     */
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: "development" | "test" | "production";
            DATABASE_URL: string;
            PORT?: string;

            // Clerk
            CLERK_SECRET_KEY?: string;
            CLERK_PUBLISHABLE_KEY?: string;
        }
    }
}

export { };