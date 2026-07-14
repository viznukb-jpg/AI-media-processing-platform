import { prisma, mediaQueue, JobDetailsResponse, cleanupQueue } from "@repo/db";
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

    const exists = await S3Service.fileExists(originalUrl);
    if (!exists) {
      throw new ValidationError("Uploaded file not found in storage");
    }

    const job = await prisma.job.create({
      data: {
        userId,
        originalUrl,
        status: "queued",
      },
    });

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

    return job;
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

    // Check if the file still exists in S3 (in case of manual deletion)
    const exists = await S3Service.fileExists(job.originalUrl);
    if (!exists) {
      // Auto-cleanup DB if S3 file is missing
      await prisma.job.delete({ where: { id: jobId } });
      throw new NotFoundError("Job file no longer exists in storage");
    }

    let signedProcessedUrl = null;
    if (job.status === "completed" && job.processedUrl) {
      const processedExists = await S3Service.fileExists(job.processedUrl);
      if (processedExists) {
        signedProcessedUrl = await S3Service.generateDownloadUrl(job.processedUrl);
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
      } catch (err: any) {
        logger.warn("S3_DELETE_FAILED_ADDING_TO_QUEUE", { key, error: err.message });
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
