import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { withRateLimit } from "@/lib/rate-limit";
import { S3Service } from "@/services/s3.service";
import { getMaxBytes, formatBytes } from "@/lib/upload-limits";
import { z } from "zod";
import { logger } from "@repo/logger";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
] as const;

const UploadSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  contentType: z.string().refine((val) => ALLOWED_MIME_TYPES.includes(val as any), {
    message: "Invalid content type. Only safe images (JPEG, PNG, WEBP, GIF) and videos (MP4, QuickTime) are allowed.",
  }),
  fileSize: z.number().int().positive("File size must be a positive integer"),
});

export const POST = withAuth(
  withRateLimit(
    async (req, session) => {
      const body = await req.json();
      const parseResult = UploadSchema.safeParse(body);

      if (!parseResult.success) {
        return NextResponse.json(
          { error: parseResult.error.issues[0].message },
          { status: 400 }
        );
      }

      const { filename, contentType, fileSize } = parseResult.data;

      // Validate file size against limits
      const maxBytes = getMaxBytes(contentType);
      if (fileSize > maxBytes) {
        return NextResponse.json(
          { error: `File too large. Maximum allowed: ${formatBytes(maxBytes)}` },
          { status: 413 }
        );
      }

      try {
        const { url, key, fields } = await S3Service.generateUploadUrl(session.user.id, filename, contentType, fileSize);
        return NextResponse.json({ uploadUrl: url, key, fields });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error("GENERATE_PRESIGNED_URL_FAILED", { error: errorMsg, userId: session.user.id, filename });
        return NextResponse.json(
          { error: "Failed to generate presigned URL" },
          { status: 500 }
        );
      }
    },
    { keyPrefix: "upload-url", limit: 10, windowSeconds: 60 }
  )
);
