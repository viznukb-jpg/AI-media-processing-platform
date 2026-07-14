import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@repo/db';

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete all related records first to avoid foreign key constraints, then delete user
    await prisma.$transaction([
      prisma.jobEvent.deleteMany({
        where: { job: { userId } }
      }),
      prisma.job.deleteMany({
        where: { userId }
      }),
      prisma.account.deleteMany({
        where: { userId }
      }),
      prisma.session.deleteMany({
        where: { userId }
      }),
      prisma.user.delete({
        where: { id: userId }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
