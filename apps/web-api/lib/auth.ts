import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@repo/db";
import { env } from "./env";

if (!env.BETTER_AUTH_SECRET) {
  throw new Error("❌ BETTER_AUTH_SECRET environment variable is missing. Authentication cannot start.");
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS 
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",") 
    : [],
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },
});
