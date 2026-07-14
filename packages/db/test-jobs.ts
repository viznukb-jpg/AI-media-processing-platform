import { prisma } from './index';
async function main() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(jobs);
}
main().catch(console.error).finally(() => prisma.$disconnect());
