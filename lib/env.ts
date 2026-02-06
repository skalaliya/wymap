import { z } from "zod";

const optionalString = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim().length === 0 ? undefined : value,
  z.string().min(1).optional(),
);

const optionalEmail = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim().length === 0 ? undefined : value,
  z.string().email().optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: optionalString,
  AUTH_ADMIN_EMAIL: optionalEmail,
  AUTH_ADMIN_PASSWORD: optionalString,
  KIOSK_DEVICE_ID: optionalString,
  KIOSK_SITE_ID: optionalString,
  RATE_LIMIT_WINDOW_MS: optionalString,
  RATE_LIMIT_MAX: optionalString,
  REDIS_URL: optionalString,
  APP_VERSION: optionalString,
  GIT_COMMIT: optionalString,
});

// Skip validation during build phase (Next.js sets this during static generation)
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

let envData: z.infer<typeof envSchema>;

if (isBuildPhase) {
  // During build, use defaults/empty values to allow static generation
  envData = {
    NODE_ENV: (process.env.NODE_ENV as "development" | "test" | "production") ?? "development",
    DATABASE_URL: process.env.DATABASE_URL ?? "file:./dev.db",
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_ADMIN_EMAIL: process.env.AUTH_ADMIN_EMAIL,
    AUTH_ADMIN_PASSWORD: process.env.AUTH_ADMIN_PASSWORD,
    KIOSK_DEVICE_ID: process.env.KIOSK_DEVICE_ID,
    KIOSK_SITE_ID: process.env.KIOSK_SITE_ID,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
    REDIS_URL: process.env.REDIS_URL,
    APP_VERSION: process.env.APP_VERSION,
    GIT_COMMIT: process.env.GIT_COMMIT,
  };
} else {
  // At runtime, validate all required env vars
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid environment configuration: ${errors}`);
  }

  envData = parsed.data;
}

export const env = {
  ...envData,
  RATE_LIMIT_WINDOW_MS: envData.RATE_LIMIT_WINDOW_MS
    ? Number(envData.RATE_LIMIT_WINDOW_MS)
    : 60_000,
  RATE_LIMIT_MAX: envData.RATE_LIMIT_MAX
    ? Number(envData.RATE_LIMIT_MAX)
    : 60,
};
