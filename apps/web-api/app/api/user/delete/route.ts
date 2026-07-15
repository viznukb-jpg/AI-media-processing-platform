import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { withAuth } from "@/lib/auth-middleware";
import { S3Service } from "@/services/s3.service";
import { logger } from "@repo/logger";
import { handleApiError } from "@/lib/handle-api-error";

export const DELETE = withAuth(async (req, session) => {
  try {
    const userId = session.user.id;

    await S3Service.deleteUserFiles(userId);

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("DELETE_USER_FAILED", {
      error: errorMsg,
      userId: session.user.id,
    });
    return handleApiError(error);
  }
});
