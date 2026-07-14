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
    try {
      await prisma.$transaction([
        prisma.job.update({
          where: { id: jobId },
          data: { status, progress, processedUrl },
        }),
        prisma.jobEvent.create({
          data: { jobId, status, message },
        }),
      ]);
      
      logger.info("STATUS_UPDATE", {
        jobId,
        status,
        progress,
        message,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        logger.warn("JOB_UPDATE_RACE_CONDITION_JOB_DELETED", { jobId, status, error: error.message });
      } else {
        throw error;
      }
    }
  }

  static async markFailed(jobId: string, message: string) {
    try {
      await prisma.$transaction([
        prisma.job.update({
          where: { id: jobId },
          data: { status: "failed", progress: 0, error: message },
        }),
        prisma.jobEvent.create({
          data: { jobId, status: "failed", message },
        }),
      ]);
      
      logger.error("JOB_FAILED_UPDATE", {
        jobId,
        message,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        logger.warn("JOB_UPDATE_RACE_CONDITION_JOB_DELETED", { jobId, status: "failed", error: error.message });
      } else {
        throw error;
      }
    }
  }
}
