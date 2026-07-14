import "./env";

import { Worker } from "bullmq";
import { connection, prisma, dlqQueue } from "@repo/db";
import { processMedia } from "./processors/media-processing.processor";
import { logger } from "./lib/logger";

const worker = new Worker(
  "media-processing",
  processMedia,
  { connection: connection as any, concurrency: 5 },
);

worker.on("completed", (job) => {
  // Status already updated inside processor via job.data.jobId — do not duplicate DB writes here.
});

worker.on("failed", async (job, err) => {
  if (job) {
    const attemptsMade = job.attemptsMade;
    const maxAttempts = job.opts.attempts || 1;
    const dbJobId = job.data.jobId;
    
    if (attemptsMade >= maxAttempts) {
      // Dead-letter logic: job has exhausted all retries
      logger.error("DEAD_LETTER", {
        bullJobId: job.id,
        dbJobId,
        userId: job.data.userId,
        error: err.message,
      });

      // Push to DLQ
      await dlqQueue.add("dead-letter", { ...job.data, failReason: err.message });


      // Update final status in DB using the Prisma UUID, NOT BullMQ's internal id
      if (dbJobId) {
        try {
          await prisma.job.update({
            where: { id: dbJobId },
            data: { status: "failed", progress: 0, error: err.message },
          });
          await prisma.jobEvent.create({
            data: { jobId: dbJobId, status: "failed", message: err.message },
          });
        } catch (dbErr) {
          logger.error("DB_UPDATE_FAILED", { error: (dbErr as Error).message });
        }
      } else {
        logger.error("DB_UPDATE_FAILED", { error: "job.data.jobId is missing" });
      }
    } else {
      logger.warn("JOB_FAILED_RETRYING", {
        bullJobId: job.id,
        dbJobId,
        attempt: attemptsMade,
        maxAttempts: maxAttempts,
        error: err.message,
      });
    }
  } else {
    console.error(`[Worker] Unknown job failed:`, err);
  }
});

console.log("Media processing worker started, listening for jobs...");
