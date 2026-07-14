import { s3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand, getSignedUrl, s3BucketName, ListObjectsV2Command, DeleteObjectsCommand, HeadObjectCommand, createPresignedPost } from "@repo/s3";
import crypto from "crypto";
import { logger } from "@repo/logger";

export class S3Service {
  static async generateUploadUrl(userId: string, filename: string, contentType: string, contentLength?: number) {
    const ext = filename.split(".").pop();
    const uniqueId = crypto.randomUUID();
    const key = `uploads/${userId}/${uniqueId}.${ext}`;

    const conditions: any[] = [
      ["eq", "$Content-Type", contentType],
      ["starts-with", "$key", `uploads/${userId}/`],
    ];

    if (contentLength) {
      // Allow +/- 10% tolerance for length or strict matching
      conditions.push(["content-length-range", 0, contentLength + 1048576]); // max size + 1MB buffer
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
                Objects: listResponse.Contents.map((c: any) => ({ Key: c.Key })),
              },
            });
            await s3Client.send(deleteCommand);
          }

          isTruncated = listResponse.IsTruncated ?? false;
          continuationToken = listResponse.NextContinuationToken;
        }
      }
    } catch (err: any) {
      logger.error("DELETE_USER_FILES_FAILED", { userId, error: err.message });
    }
  }
  static async fileExists(key: string): Promise<boolean> {
    try {
      await s3Client.send(new HeadObjectCommand({ Bucket: s3BucketName, Key: key }));
      return true;
    } catch (err: any) {
      if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw err;
    }
  }
}
