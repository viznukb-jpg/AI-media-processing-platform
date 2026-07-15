import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url("Must be a valid URL"),
  REDIS_URL: z.string().url("Must be a valid URL"),
  AWS_ACCESS_KEY_ID: z.string().min(1, "Required"),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, "Required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Worker environment validation failed:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
