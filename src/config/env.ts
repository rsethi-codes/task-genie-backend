import { config } from "dotenv";
import { z } from "zod";

// Load .env file into process.env
config();

// 🧩 Define schemas for logical sections
const appSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(5000),
});

const dbSchema = z.object({
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
});

const authSchema = z.object({
  CLERK_PUBLISHABLE_KEY: z.string().min(1, "CLERK_PUBLISHABLE_KEY is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
});

// 🧠 Combine all schemas
const envSchema = z.object({
  app: appSchema,
  db: dbSchema,
  auth: authSchema,
});

// 🔍 Parse and validate
const parseEnv = () => {
  try {
    // Flatten process.env into sections
    const rawEnv = {
      app: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
      },
      db: {
        MONGO_URI: process.env.MONGO_URI,
      },
      auth: {
        CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
      },
    };

    return envSchema.parse(rawEnv);
  } catch (error) {
    console.error("❌ Invalid environment configuration:");
    if (error instanceof z.ZodError) {
      error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
      });
    }
    process.exit(1);
  }
};

// ✅ Parsed, typed environment variables
export const env = parseEnv();

// 🧠 Infer TypeScript types
export type Env = z.infer<typeof envSchema>;
export type AppEnv = z.infer<typeof appSchema>;
export type DbEnv = z.infer<typeof dbSchema>;
export type AuthEnv = z.infer<typeof authSchema>;
