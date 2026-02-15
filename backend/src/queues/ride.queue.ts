import { Queue } from 'bullmq';

export const rideQueue = new Queue('myQueue', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
  }
});