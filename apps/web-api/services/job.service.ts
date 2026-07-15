import { prisma, mediaQueue, JobDetailsResponse, cleanupQueue, connection } from "@repo/db";
import { S3Service } from "./s3.service";
import {
  NotFoundError,
  ForbiddenError,
  UnauthorizedS3KeyError,
  ValidationError,
} from "@/lib/errors";
import { logger } from "@repo/logger";

export class JobService {
  private static async findJobOrThrow(
    userId: string,
    jobId: string,
    options?: { includeEvents?: boolean },
  ) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: options?.includeEvents
        ? { events: { orderBy: { timestamp: "asc" } } }
        : undefined,
    });

    if (!job) throw new NotFoundError("Job not found");
    if (job.userId !== userId) throw new ForbiddenError();
    return job;
  }

  static async createJob(userId: string, originalUrl: string) {
    // IDOR Protection: verify the key belongs to the user
    if (!originalUrl.startsWith(`uploads/${userId}/`)) {
      throw new UnauthorizedS3KeyError();
    }

    // Idempotency check with Redis Distributed Lock (Mutex) to prevent race conditions
    const lockKey = `lock:createJob:${originalUrl}`;
    // Attempt to acquire lock for 10 seconds
    const acquired = await connection.set(lockKey, "1", "EX", 10, "NX");

    if (!acquired) {
      // Another concurrent request is processing this originalUrl right now.
      // Wait a bit, then fetch the created job to ensure idempotency.
      await new Promise(resolve => setTimeout(resolve, 500));
      const existingJob = await prisma.job.findFirst({
        where: {
          userId,
          originalUrl,
          status: { notIn: ["completed", "failed"] }
        }
      });
      if (existingJob) return existingJob;
      throw new Error("Job creation in progress by another request");
    }

    try {
      const existingJob = await prisma.job.findFirst({
        where: {
          userId,
          originalUrl,
          status: { notIn: ["completed", "failed"] }
        }
      });
      if (existingJob) return existingJob;

      const exists = await S3Service.fileExists(originalUrl);
      if (!exists) {
        throw new ValidationError("Uploaded file not found in storage");
      }

      const job = await prisma.$transaction(async (tx: any) => {
        const newJob = await tx.job.create({
          data: {
            userId,
            originalUrl,
            status: "queued",
          },
        });
        await tx.jobEvent.create({
          data: {
            jobId: newJob.id,
            status: "queued",
            message: "Job added to processing queue",
          },
        });
        return newJob;
      });

      try {
        await mediaQueue.add(
          "process-media",
          {
            jobId: job.id,
            originalUrl,
            userId,
          },
          {
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 2000,
            },
          },
        );
      } catch (err) {
        await prisma.job.update({ 
          where: { id: job.id },
          data: { status: "failed", error: "Failed to add job to processing queue" } 
        });
        await prisma.jobEvent.create({
          data: {
            jobId: job.id,
            status: "failed",
            message: "Failed to add job to processing queue",
          }
        });
        throw new Error("Failed to add job to processing queue");
      }

      return job;
    } finally {
      // Always release the lock when done
      await connection.del(lockKey);
    }
  }

  static async getJobs(userId: string, skip: number = 0, take: number = 20) {
    return prisma.job.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  }

  static async getJobDetails(userId: string, jobId: string): Promise<JobDetailsResponse> {
    const job = await this.findJobOrThrow(userId, jobId, {
      includeEvents: true,
    });

    let signedProcessedUrl = null;
    if (job.status === "completed" && job.processedUrl) {
      const cacheKey = `signed_url:${job.processedUrl}`;
      signedProcessedUrl = await connection.get(cacheKey);
      if (!signedProcessedUrl) {
        // Just generate the URL locally without making an expensive HeadObject check to S3.
        // If the file is missing for some reason, S3 will return a 404 directly to the client.
        signedProcessedUrl = await S3Service.generateDownloadUrl(job.processedUrl);
        await connection.set(cacheKey, signedProcessedUrl, "EX", 3000);
      }
    }

    // Cast needed because findJobOrThrow doesn't strictly guarantee includeEvents in the generic return type of Prisma yet
    return { ...(job as JobDetailsResponse), signedProcessedUrl };
  }

  static async deleteJob(userId: string, jobId: string) {
    const job = await this.findJobOrThrow(userId, jobId);

    // Delete DB record first (Rely on Prisma Cascade for JobEvents)
    await prisma.job.delete({ where: { id: jobId } });

    // Try deleting S3 files, if it fails add to cleanup queue
    const keysToDelete = [job.originalUrl, job.processedUrl].filter(Boolean) as string[];

    for (const key of keysToDelete) {
      try {
        await S3Service.deleteFile(key);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.warn("S3_DELETE_FAILED_ADDING_TO_QUEUE", { key, error: errorMsg });
        await cleanupQueue.add(
          "delete-s3-file",
          { key },
          {
            attempts: 5,
            backoff: {
              type: "exponential",
              delay: 5000,
            },
          }
        );
      }
    }
  }
}
