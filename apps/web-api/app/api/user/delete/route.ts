import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { withAuth } from '@/lib/auth-middleware';
import { S3Service } from '@/services/s3.service';
import { logger } from "@repo/logger";

export const DELETE = withAuth(async (req, session) => {
  try {
    const userId = session.user.id;

    // S3 cleanup of all user files
    await S3Service.deleteUserFiles(userId);

    // Delete user (relies on Prisma onDelete: Cascade for jobs, sessions, accounts, etc)
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('DELETE_USER_FAILED', { error: error.message, userId: session.user.id });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
