import { Job as BullJob } from "bullmq";
import { s3Client, PutObjectCommand } from "@repo/s3";
import fs from "fs";
import path from "path";
import os from "os";

import { logger } from "../lib/logger";
import { JobStatusService } from "../services/job-status.service";
import { MediaDownloader } from "../services/media-downloader";
import { validateFileType } from "../services/file-validator";
import { ThumbnailService } from "../services/thumbnail";

const bucketName = process.env.AWS_S3_BUCKET_NAME || "ai-media-platform-dev";

export async function processMedia(job: BullJob) {
  const { jobId, originalUrl, userId } = job.data;

  // Defense in depth: ensure jobId is present in payload
  if (!jobId) {
    throw new Error(`Job payload missing jobId (bullJobId=${job.id})`);
  }
  
  logger.info("JOB_STARTED", {
    jobId,
    userId,
    originalUrl,
  });

  const tmpDir = os.tmpdir();
  const tempInputPath = path.join(tmpDir, `${jobId}-input`);
  const tempOutputPath = path.join(tmpDir, `${jobId}-thumb.jpg`);

  try {
    // 1. Downloading
    await JobStatusService.updateStatus(jobId, "downloading", 10, "Downloading from S3");
    await MediaDownloader.download(originalUrl, tempInputPath);

    // 2. Validate file type via magic bytes
    await JobStatusService.updateStatus(jobId, "analyzing", 40, "Validating and extracting metadata");
    
    const fileType = await validateFileType(tempInputPath);

    // 3. Generate thumbnail
    await JobStatusService.updateStatus(jobId, "generating_thumbnail", 70, "Generating thumbnail");

    const thumbnailBuffer = await ThumbnailService.generate(
      fileType.isVideo,
      tempInputPath,
      tempOutputPath,
      tmpDir,
      jobId
    );

    // 4. Upload thumbnail
    const processedUrl = `processed/${userId}/${jobId}-thumb.jpg`;
    const putObjectCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: processedUrl,
      Body: thumbnailBuffer,
      ContentType: "image/jpeg",
    });
    await s3Client.send(putObjectCommand);

    // 5. Completed
    await JobStatusService.updateStatus(jobId, "completed", 100, "Job finished successfully", processedUrl);
    
    logger.info("JOB_COMPLETED", {
      jobId,
      processedUrl,
    });

    return { processedUrl };
  } catch (error: any) {
    logger.error("JOB_FAILED_ATTEMPT", {
      jobId,
      error: error.message,
    });
    // Note: We DO NOT update status to "failed" here. 
    // BullMQ will retry based on config. Final "failed" status is handled in worker.on("failed").
    throw error;
  } finally {
    // Cleanup temp files
    try {
      if (fs.existsSync(tempInputPath)) await fs.promises.unlink(tempInputPath);
      if (fs.existsSync(tempOutputPath)) await fs.promises.unlink(tempOutputPath);
    } catch (cleanupError) {
      logger.warn("FAILED_TO_CLEANUP", { error: cleanupError });
    }
  }
}
