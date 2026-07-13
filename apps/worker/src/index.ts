import dotenv from "dotenv";
dotenv.config();

import { Worker, Job as BullJob } from "bullmq";
import { connection, prisma, JobStatus } from "@repo/db";
import { s3Client } from "./lib/s3";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { Readable } from "stream";

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
  console.log(`Job ${jobId} -> ${status} (${progress}%)`);
}

// Convert S3 stream to buffer
const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
};

const bucketName = process.env.S3_BUCKET_NAME || "ai-media-platform-dev";

const worker = new Worker(
  "media-processing",
  async (job: BullJob) => {
    const { jobId, originalUrl, userId } = job.data;
    console.log(`Starting job ${jobId} for user ${userId}`);

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

      const fileBuffer = await streamToBuffer(s3Response.Body as Readable);

      // 2. Analyzing (Simulate AI processing)
      await updateStatus(jobId, "analyzing", 40, "Running AI analysis");
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate delay

      // 3. Generating Thumbnail
      await updateStatus(
        jobId,
        "generating_thumbnail",
        70,
        "Generating thumbnail",
      );

      let thumbnailBuffer: Buffer;
      try {
        thumbnailBuffer = await sharp(fileBuffer)
          .resize(300, 300, { fit: "inside" })
          .jpeg({ quality: 80 })
          .toBuffer();
      } catch (err) {
        console.warn(`Sharp failed, maybe not an image? ${err}`);
        throw new Error("Failed to process media (is it a valid image?)");
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
      console.log(`Job ${jobId} completed. Thumbnail: ${processedUrl}`);

      return { processedUrl };
    } catch (error: any) {
      console.error(`Error processing job ${jobId}:`, error);
      await updateStatus(jobId, "failed", 0, error.message || "Unknown error");
      throw error;
    }
  },
  { connection: connection as any, concurrency: 5 },
);

worker.on("completed", (job) =>
  console.log(`[Worker] Job ${job.id} completed`),
);
worker.on("failed", (job, err) => {
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
