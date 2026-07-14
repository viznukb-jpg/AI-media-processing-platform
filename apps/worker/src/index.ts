import "./env";

import { Worker, Job as BullJob } from "bullmq";
import { connection, prisma, JobStatus } from "@repo/db";
import { s3Client, GetObjectCommand, PutObjectCommand } from "@repo/s3";
import sharp from "sharp";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import os from "os";
import { pipeline } from "stream/promises";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

async function updateStatus(
  jobId: string,
  status: JobStatus,
  progress: number,
  message?: string,
) {
  await prisma.job.update({
    where: { id: jobId },
    data: { status, progress },
  });
  await prisma.jobEvent.create({
    data: { jobId, status, message },
  });
  
  // Structured logging
  console.log(JSON.stringify({
    level: "info",
    event: "STATUS_UPDATE",
    jobId,
    status,
    progress,
    message,
    timestamp: new Date().toISOString()
  }));
}

const bucketName = process.env.AWS_S3_BUCKET_NAME || "ai-media-platform-dev";

const worker = new Worker(
  "media-processing",
  async (job: BullJob) => {
    const { jobId, originalUrl, userId } = job.data;
    
    console.log(JSON.stringify({
      level: "info",
      event: "JOB_STARTED",
      jobId,
      userId,
      originalUrl,
      timestamp: new Date().toISOString()
    }));

    const tmpDir = os.tmpdir();
    const tempInputPath = path.join(tmpDir, `${jobId}-input`);
    const tempOutputPath = path.join(tmpDir, `${jobId}-thumb.jpg`);

    try {
      // 1. Downloading
      await updateStatus(jobId, "downloading", 10, "Downloading from S3");
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: originalUrl,
      });
      const s3Response = await s3Client.send(getObjectCommand);

      if (!s3Response.Body) {
        throw new Error("Empty body received from S3");
      }

      // Stream to temp file to prevent OOM
      await pipeline(s3Response.Body as Readable, fs.createWriteStream(tempInputPath));

      // 2. Analyzing & Generating Thumbnail
      await updateStatus(jobId, "analyzing", 40, "Extracting metadata");
      
      const isVideo = originalUrl.match(/\.(mp4|mov|avi|webm)$/i);

      await updateStatus(
        jobId,
        "generating_thumbnail",
        70,
        "Generating thumbnail",
      );

      let thumbnailBuffer: Buffer;

      if (isVideo) {
        // Video processing
        await new Promise((resolve, reject) => {
          ffmpeg(tempInputPath)
            .on("end", resolve)
            .on("error", reject)
            .screenshots({
              count: 1,
              timemarks: ['00:00:01.000'],
              size: '300x300',
              folder: tmpDir,
              filename: `${jobId}-thumb.jpg`
            });
        });
        thumbnailBuffer = await fs.promises.readFile(tempOutputPath);
      } else {
        // Image processing using Sharp directly from file
        const metadata = await sharp(tempInputPath).metadata();
        console.log(JSON.stringify({
          level: "info",
          event: "METADATA_EXTRACTED",
          jobId,
          metadata: { width: metadata.width, height: metadata.height, format: metadata.format }
        }));

        thumbnailBuffer = await sharp(tempInputPath)
          .resize(300, 300, { fit: "inside" })
          .jpeg({ quality: 80 })
          .toBuffer();
      }

      // Upload thumbnail
      const processedUrl = `processed/${userId}/${jobId}-thumb.jpg`;
      const putObjectCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: processedUrl,
        Body: thumbnailBuffer,
        ContentType: "image/jpeg",
      });
      await s3Client.send(putObjectCommand);

      // 4. Completed
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "completed",
          progress: 100,
          processedUrl,
        },
      });
      await prisma.jobEvent.create({
        data: {
          jobId,
          status: "completed",
          message: "Job finished successfully",
        },
      });

      console.log(JSON.stringify({
        level: "info",
        event: "JOB_COMPLETED",
        jobId,
        processedUrl,
        timestamp: new Date().toISOString()
      }));

      return { processedUrl };
    } catch (error: any) {
      console.error(JSON.stringify({
        level: "error",
        event: "JOB_FAILED_ATTEMPT",
        jobId,
        error: error.message,
        timestamp: new Date().toISOString()
      }));
      // Note: We DO NOT update status to "failed" here. 
      // BullMQ will retry based on config.
      // Final "failed" status is handled in the worker.on("failed") event listener.
      throw error;
    } finally {
      // Cleanup temp files
      try {
        if (fs.existsSync(tempInputPath)) await fs.promises.unlink(tempInputPath);
        if (fs.existsSync(tempOutputPath)) await fs.promises.unlink(tempOutputPath);
      } catch (cleanupError) {
        console.warn("Failed to cleanup temp files:", cleanupError);
      }
    }
  },
  { connection: connection as any, concurrency: 5 },
);

worker.on("completed", (job) => {
  // Already logged inside job
});

worker.on("failed", async (job, err) => {
  if (job) {
    const attemptsMade = job.attemptsMade;
    const maxAttempts = job.opts.attempts || 1;
    
    if (attemptsMade >= maxAttempts) {
      // Dead-letter logic: job has exhausted all retries
      console.error(JSON.stringify({
        level: "error",
        event: "DEAD_LETTER",
        jobId: job.id,
        userId: job.data.userId,
        error: err.message,
        timestamp: new Date().toISOString()
      }));

      // Update final status in DB
      try {
        await prisma.job.update({
          where: { id: job.id },
          data: { status: "failed", progress: 0, error: err.message },
        });
        await prisma.jobEvent.create({
          data: { jobId: job.id, status: "failed", message: err.message },
        });
      } catch (dbErr) {
        console.error("Failed to update final job status to failed:", dbErr);
      }
    } else {
      console.warn(JSON.stringify({
        level: "warn",
        event: "JOB_FAILED_RETRYING",
        jobId: job.id,
        attempt: attemptsMade,
        maxAttempts: maxAttempts,
        error: err.message,
        timestamp: new Date().toISOString()
      }));
    }
  } else {
    console.error(`[Worker] Unknown job failed:`, err);
  }
});

console.log("Media processing worker started, listening for jobs...");
