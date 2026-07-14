import { prisma, mediaQueue } from "@repo/db";
import { S3Service } from "./s3.service";
import { NotFoundError, ForbiddenError, UnauthorizedS3KeyError } from "@/lib/errors";

export class JobService {
  private static async findJobOrThrow(userId: string, jobId: string, options?: { includeEvents?: boolean }) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: options?.includeEvents ? { events: { orderBy: { timestamp: "asc" } } } : undefined,
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

    const job = await prisma.job.create({
      data: {
        userId,
        originalUrl,
        status: "queued",
      },
    });

    await mediaQueue.add("process-media", {
      jobId: job.id,
      originalUrl,
      userId,
    }, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    });

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

  static async getJobDetails(userId: string, jobId: string) {
    const job = await this.findJobOrThrow(userId, jobId, { includeEvents: true });

    let signedProcessedUrl = null;
    if (job.status === "completed" && job.processedUrl) {
      signedProcessedUrl = await S3Service.generateDownloadUrl(job.processedUrl);
    }

    return { ...job, signedProcessedUrl };
  }

  static async deleteJob(userId: string, jobId: string) {
    const job = await this.findJobOrThrow(userId, jobId);

    // Delete S3 files first, log any failures, then delete DB record
    const s3Results = await Promise.allSettled([
      job.originalUrl ? S3Service.deleteFile(job.originalUrl) : Promise.resolve(),
      job.processedUrl ? S3Service.deleteFile(job.processedUrl) : Promise.resolve(),
    ]);

    for (const result of s3Results) {
      if (result.status === "rejected") {
        console.error(JSON.stringify({
          level: "error",
          event: "ORPHANED_S3_FILE",
          jobId,
          error: result.reason?.message || "Unknown S3 deletion error",
          timestamp: new Date().toISOString(),
        }));
      }
    }

    // Rely on Prisma Cascade to delete JobEvents automatically
    await prisma.job.delete({ where: { id: jobId } });
  }
}
