import { s3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand, getSignedUrl, s3BucketName, ListObjectsV2Command, DeleteObjectsCommand, HeadObjectCommand, createPresignedPost } from "@repo/s3";
import crypto from "crypto";
import { logger } from "@repo/logger";

export class S3Service {
  static async generateUploadUrl(userId: string, filename: string, contentType: string, contentLength?: number) {
    const MIME_TO_EXT: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "video/mp4": "mp4",
      "video/quicktime": "mov",
    };
    const ext = MIME_TO_EXT[contentType] || contentType.split("/").pop()?.replace(/[^a-z0-9]/g, "").substring(0, 10) || "bin";
    
    const uniqueId = crypto.randomUUID();
    const key = `uploads/${userId}/${uniqueId}.${ext}`;

    const conditions: Parameters<typeof createPresignedPost>[1]["Conditions"] = [
      ["eq", "$Content-Type", contentType],
      ["starts-with", "$key", `uploads/${userId}/`],
    ];

    if (contentLength) {
      conditions.push(["content-length-range", 100, contentLength + 1048576]);
    }

    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: s3BucketName,
      Key: key,
      Conditions: conditions,
      Fields: {
        "Content-Type": contentType,
      },
      Expires: 3600,
    });

    return { url, key, fields };
  }

  static async generateDownloadUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: s3BucketName,
      Key: key,
    });
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
  }

  static async deleteFile(key: string) {
    await s3Client.send(new DeleteObjectCommand({ Bucket: s3BucketName, Key: key }));
  }

  static async deleteUserFiles(userId: string) {
    try {
      const prefixes = [`uploads/${userId}/`, `processed/${userId}/`];
      
      for (const prefix of prefixes) {
        let isTruncated = true;
        let continuationToken: string | undefined;

        while (isTruncated) {
          const listCommand = new ListObjectsV2Command({
            Bucket: s3BucketName,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          });
          const listResponse = await s3Client.send(listCommand);

          if (listResponse.Contents && listResponse.Contents.length > 0) {
            const deleteCommand = new DeleteObjectsCommand({
              Bucket: s3BucketName,
              Delete: {
                Objects: listResponse.Contents.filter(c => c.Key).map(c => ({ Key: c.Key! })),
              },
            });
            await s3Client.send(deleteCommand);
          }

          isTruncated = listResponse.IsTruncated ?? false;
          continuationToken = listResponse.NextContinuationToken;
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error("DELETE_USER_FILES_FAILED", { userId, error: errorMsg });
    }
  }
  static async fileExists(key: string): Promise<boolean> {
    try {
      await s3Client.send(new HeadObjectCommand({ Bucket: s3BucketName, Key: key }));
      return true;
    } catch (err) {
      if (err && typeof err === "object" && ("name" in err || "$metadata" in err)) {
        const awsErr = err as { name?: string; $metadata?: { httpStatusCode?: number } };
        if (awsErr.name === "NotFound" || awsErr.$metadata?.httpStatusCode === 404) {
          return false;
        }
      }
      throw err;
    }
  }
}
