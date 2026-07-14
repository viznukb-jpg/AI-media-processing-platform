import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { Queue } from "bullmq";
import IORedis from "ioredis";

// Prisma client initialization
const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
  prismaInstance = globalForPrisma.prisma;
} else {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is required to initialize Prisma Client",
    );
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  prismaInstance = new PrismaClient({
    adapter,
    log: ["query", "error", "warn"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance;

export * from "@prisma/client";
export * from "./types";

// Redis and Queue initialization
export const connection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  },
);

export const mediaQueue = new Queue("media-processing", {
  connection: connection as import("bullmq").QueueOptions["connection"],
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: {
      count: 100,
      age: 24 * 3600 * 7,
    },
  },
});

export const dlqQueue = new Queue("dlq", {
  connection: connection as import("bullmq").QueueOptions["connection"],
});

export const cleanupQueue = new Queue("cleanup", {
  connection: connection as import("bullmq").QueueOptions["connection"],
});
