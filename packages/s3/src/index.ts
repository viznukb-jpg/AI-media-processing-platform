import { S3Client } from "@aws-sdk/client-s3";

export const s3BucketName =
  process.env.AWS_S3_BUCKET_NAME || "ai-media-platform-dev";
export const s3Region = process.env.AWS_REGION || "eu-north-1";

export const s3Client = new S3Client({
  region: s3Region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  ...(process.env.AWS_S3_ENDPOINT && { endpoint: process.env.AWS_S3_ENDPOINT }),
  forcePathStyle: !!process.env.AWS_S3_ENDPOINT,
});

export * from "@aws-sdk/client-s3";
export * from "@aws-sdk/s3-request-presigner";
export * from "@aws-sdk/s3-presigned-post";
