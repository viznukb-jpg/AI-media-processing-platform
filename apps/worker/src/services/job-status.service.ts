import { prisma, JobStatus } from "@repo/db";
import { logger } from "../lib/logger";

export class JobStatusService {
  static async updateStatus(
    jobId: string,
    status: JobStatus,
    progress: number,
    message?: string,
    processedUrl?: string,
  ) {
    await prisma.job.update({
      where: { id: jobId },
      data: { status, progress, processedUrl },
    });
    await prisma.jobEvent.create({
      data: { jobId, status, message },
    });
    
    logger.info("STATUS_UPDATE", {
      jobId,
      status,
      progress,
      message,
    });
  }
}
