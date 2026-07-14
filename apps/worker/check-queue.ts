import { Queue } from 'bullmq';
import IORedis from 'ioredis';
const connection = new IORedis('redis://127.0.0.1:6379');
const queue = new Queue('media-processing', { connection });
async function main() {
  console.log('Waiting:', await queue.getWaitingCount());
  console.log('Active:', await queue.getActiveCount());
  console.log('Failed:', await queue.getFailedCount());
  console.log('Delayed:', await queue.getDelayedCount());
}
main().catch(console.error).finally(() => connection.quit());
