import { Queue } from 'bullmq';
import IORedis from 'ioredis';
const connection = new IORedis('redis://127.0.0.1:6379');
const queue = new Queue('media-processing', { connection });
async function main() {
  const failed = await queue.getFailed(0, 1);
  if (failed.length > 0) {
    console.log('Failed Reason:', failed[0].failedReason);
    console.log('Stacktrace:', failed[0].stacktrace);
  }
}
main().catch(console.error).finally(() => connection.quit());
