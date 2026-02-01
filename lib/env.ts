import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_ADMIN_EMAIL: z.string().email().optional(),
  AUTH_ADMIN_PASSWORD: z.string().min(8).optional(),
  KIOSK_DEVICE_ID: z.string().min(1).optional(),
  KIOSK_SITE_ID: z.string().min(1).optional(),
  RATE_LIMIT_WINDOW_MS: z.string().optional(),
  RATE_LIMIT_MAX: z.string().optional(),
  REDIS_URL: z.string().optional(),
  APP_VERSION: z.string().optional(),
  GIT_COMMIT: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.issues.map((issue) => issue.message).join("; ");
  throw new Error(`Invalid environment configuration: ${errors}`);
}

export const env = {
  ...parsed.data,
  RATE_LIMIT_WINDOW_MS: parsed.data.RATE_LIMIT_WINDOW_MS
    ? Number(parsed.data.RATE_LIMIT_WINDOW_MS)
    : 60_000,
  RATE_LIMIT_MAX: parsed.data.RATE_LIMIT_MAX
    ? Number(parsed.data.RATE_LIMIT_MAX)
    : 60,
};
