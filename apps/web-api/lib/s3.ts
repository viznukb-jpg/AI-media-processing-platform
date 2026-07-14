import { S3Client } from "@aws-sdk/client-s3";

const s3Region = process.env.AWS_REGION || "eu-north-1";
const s3AccessKeyId = process.env.AWS_ACCESS_KEY_ID!;
const s3SecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;
const s3Endpoint = process.env.AWS_S3_ENDPOINT;

const clientConfig: any = {
  region: s3Region,
  credentials: {
    accessKeyId: s3AccessKeyId,
    secretAccessKey: s3SecretAccessKey,
  },
};

// Only use endpoint and forcePathStyle if explicitly provided (e.g., for MinIO in local dev)
if (s3Endpoint) {
  clientConfig.endpoint = s3Endpoint;
  clientConfig.forcePathStyle = true;
}

export const s3Client = new S3Client(clientConfig);
