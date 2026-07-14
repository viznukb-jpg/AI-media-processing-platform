import { s3Client, GetObjectCommand } from "@repo/s3";
import { Readable } from "stream";
import fs from "fs";
import { pipeline } from "stream/promises";

const bucketName = process.env.AWS_S3_BUCKET_NAME || "ai-media-platform-dev";

export class MediaDownloader {
  static async download(originalUrl: string, tempInputPath: string) {
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
  }
}
