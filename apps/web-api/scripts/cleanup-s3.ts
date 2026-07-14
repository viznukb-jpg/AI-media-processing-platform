import { prisma } from "@repo/db";
import { s3Client, s3BucketName, ListObjectsV2Command, DeleteObjectsCommand } from "@repo/s3";
import { logger } from "@repo/logger";

async function cleanupS3() {
  logger.info("Starting S3 cleanup script...");

  try {
    const jobs = await prisma.job.findMany({
      select: {
        originalUrl: true,
        processedUrl: true,
      },
    });

    const validKeys = new Set<string>();
    jobs.forEach(job => {
      if (job.originalUrl) validKeys.add(job.originalUrl);
      if (job.processedUrl) validKeys.add(job.processedUrl);
    });

    const prefixes = ["uploads/", "processed/"];

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
          const now = new Date();
          const ONE_DAY_MS = 24 * 60 * 60 * 1000;

          const keysToDelete = listResponse.Contents
            .filter(c => {
              if (!c.Key || !c.LastModified) return false;
              if (validKeys.has(c.Key)) return false;
              
              // Only delete if older than 24 hours
              const ageMs = now.getTime() - c.LastModified.getTime();
              return ageMs > ONE_DAY_MS;
            })
            .map(c => c.Key!);

          if (keysToDelete.length > 0) {
            logger.info(`Found ${keysToDelete.length} orphaned files older than 24h in ${prefix}. Deleting...`);
            
            // Delete in batches of 1000
            for (let i = 0; i < keysToDelete.length; i += 1000) {
              const batch = keysToDelete.slice(i, i + 1000);
              const deleteCommand = new DeleteObjectsCommand({
                Bucket: s3BucketName,
                Delete: {
                  Objects: batch.map(Key => ({ Key })),
                },
              });
              await s3Client.send(deleteCommand);
            }
          }
        }

        isTruncated = listResponse.IsTruncated ?? false;
        continuationToken = listResponse.NextContinuationToken;
      }
    }

    logger.info("S3 cleanup completed successfully.");
  } catch (error: any) {
    logger.error("S3_CLEANUP_FAILED", { error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}

cleanupS3();
