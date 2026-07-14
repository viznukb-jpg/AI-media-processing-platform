import { s3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand, getSignedUrl, s3BucketName } from "@repo/s3";
import crypto from "crypto";

export class S3Service {
  static async generateUploadUrl(userId: string, filename: string, contentType: string) {
    const ext = filename.split(".").pop();
    const uniqueId = crypto.randomUUID();
    const key = `uploads/${userId}/${uniqueId}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: s3BucketName,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return { url, key };
  }

  static async generateDownloadUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: s3BucketName,
      Key: key,
    });
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
  }

  static async deleteFile(key: string) {
    try {
      await s3Client.send(new DeleteObjectCommand({ Bucket: s3BucketName, Key: key }));
    } catch (err) {
      console.error(`Failed to delete S3 object: ${key}`, err);
    }
  }

  static async deleteUserFiles(userId: string) {
    try {
      const { ListObjectsV2Command, DeleteObjectsCommand } = require("@repo/s3");
      
      const prefixes = [`uploads/${userId}/`, `processed/${userId}/`];
      
      for (const prefix of prefixes) {
        const listCommand = new ListObjectsV2Command({ Bucket: s3BucketName, Prefix: prefix });
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
      }
    } catch (err) {
      console.error(`Failed to delete user files for ${userId}`, err);
    }
  }
}
