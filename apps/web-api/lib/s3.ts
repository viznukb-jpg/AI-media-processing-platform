import { S3Client } from "@aws-sdk/client-s3";

const s3Endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
const s3Region = process.env.S3_REGION || "us-east-1";
const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID || "admin";
const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "password123";

// Create an S3 client configured for MinIO or AWS S3
export const s3Client = new S3Client({
  region: s3Region,
  endpoint: s3Endpoint,
  forcePathStyle: true, // Required for MinIO
  credentials: {
    accessKeyId: s3AccessKeyId,
    secretAccessKey: s3SecretAccessKey,
  },
});
