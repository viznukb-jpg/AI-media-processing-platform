import "./env";

import { Worker } from "bullmq";
import { connection, prisma, dlqQueue } from "@repo/db";
import { processMedia } from "./processors/media-processing.processor";
import { logger } from "./lib/logger";
import { JobStatusService } from "./services/job-status.service";

const worker = new Worker("media-processing", processMedia, {
  connection: connection as import("bullmq").WorkerOptions["connection"],
  concurrency: 5,
});

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
      await dlqQueue.add("dead-letter", {
        ...job.data,
        failReason: err.message,
      });

      // Update final status in DB using the Prisma UUID, NOT BullMQ's internal id
      if (dbJobId) {
        await JobStatusService.markFailed(dbJobId, err.message);
      } else {
        logger.error("DB_UPDATE_FAILED", {
          error: "job.data.jobId is missing",
        });
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

import { s3Client, DeleteObjectCommand, s3BucketName } from "@repo/s3";

const cleanupWorker = new Worker(
  "cleanup",
  async (job) => {
    const { key } = job.data;
    logger.info("PROCESSING_S3_CLEANUP", { key });
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: s3BucketName, Key: key }),
    );
  },
  {
    connection: connection as import("bullmq").WorkerOptions["connection"],
    concurrency: 2,
  },
);

cleanupWorker.on("failed", (job, err) => {
  logger.error("CLEANUP_JOB_FAILED", {
    key: job?.data.key,
    error: err.message,
    attempts: job?.attemptsMade,
  });
});

console.log("Media processing worker started, listening for jobs...");
