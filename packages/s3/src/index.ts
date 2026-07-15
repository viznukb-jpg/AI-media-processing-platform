import { S3Client } from "@aws-sdk/client-s3";

export const s3BucketName = process.env.AWS_S3_BUCKET_NAME || "";
if (!s3BucketName) {
  console.warn("⚠️ AWS_S3_BUCKET_NAME is not set. S3 operations will fail.");
}
export const s3Region = process.env.AWS_REGION;

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error(
    "❌ Missing required AWS credentials in environment (AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY)",
  );
}

export const s3Client = new S3Client({
  region: s3Region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  ...(process.env.AWS_S3_ENDPOINT && { endpoint: process.env.AWS_S3_ENDPOINT }),
  forcePathStyle: !!process.env.AWS_S3_ENDPOINT,
});

export * from "@aws-sdk/client-s3";
export * from "@aws-sdk/s3-request-presigner";
export * from "@aws-sdk/s3-presigned-post";
