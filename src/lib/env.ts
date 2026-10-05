import { z } from "zod";

/**
 * Server-only environment variables.
 * Jangan import file ini dari Client Component.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
});

const parsed = serverEnvSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
});

if (!parsed.success) {
  throw new Error(
    `Invalid server environment variables: ${parsed.error.message}\n`
    + "Copy .env.example to .env and fill the values.",
  );
}

export const serverEnv = parsed.data;
