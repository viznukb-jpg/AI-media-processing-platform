import { prisma, mediaQueue } from "@repo/db";
import { S3Service } from "./s3.service";

export class JobService {
  static async createJob(userId: string, originalUrl: string) {
    // IDOR Protection: verify the key belongs to the user
    if (!originalUrl.startsWith(`uploads/${userId}/`)) {
      throw new Error("Invalid or unauthorized S3 key");
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
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        events: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!job) throw new Error("Job not found");
    if (job.userId !== userId) throw new Error("Forbidden");

    let signedProcessedUrl = null;
    if (job.status === "completed" && job.processedUrl) {
      signedProcessedUrl = await S3Service.generateDownloadUrl(job.processedUrl);
    }

    return { ...job, signedProcessedUrl };
  }

  static async deleteJob(userId: string, jobId: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) throw new Error("Job not found");
    if (job.userId !== userId) throw new Error("Forbidden");

    // Rely on Prisma Cascade to delete JobEvents automatically
    await prisma.job.delete({ where: { id: jobId } });

    // Clean up S3
    if (job.originalUrl) await S3Service.deleteFile(job.originalUrl);
    if (job.processedUrl) await S3Service.deleteFile(job.processedUrl);
  }
}
