import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("Must be a valid Postgres URL"),
  REDIS_URL: z.string().url("Must be a valid Redis URL"),
  BETTER_AUTH_SECRET: z.string().min(32, "Secret must be at least 32 characters long"),
  AWS_ACCESS_KEY_ID: z.string().min(1, "AWS Access Key is required"),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, "AWS Secret is required"),
  AWS_S3_BUCKET_NAME: z.string().optional(),
  AWS_REGION: z.string().optional(),
  BETTER_AUTH_TRUSTED_ORIGINS: process.env.NODE_ENV === "production" 
    ? z.string().min(1, "TRUSTED_ORIGINS is required in production for CORS/CSRF safety")
    : z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Web API environment validation failed:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
