import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.job.updateMany({
    where: { status: 'queued' },
    data: { status: 'failed', error: 'Stuck due to previous schema migration failure' }
  });
  console.log('Fixed stuck jobs');
}
main().catch(console.error).finally(() => prisma.$disconnect());
