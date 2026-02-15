// src/config/queues.ts
import { Queue, QueueEvents } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();


const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Important for BullMQ
};

// Create ride processing queue
export const rideQueue = new Queue('ride-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds delay
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Keep for 24 hours
    },
    removeOnFail: {
      count: 1000, // Keep last 1000 failed jobs
      age: 7 * 24 * 3600, // Keep for 7 days
    },
  },
});

// Queue Events for monitoring
export const queueEvents = new QueueEvents('ride-processing', {
  connection: redisConnection,
});

// Event listeners
queueEvents.on('waiting', ({ jobId }) => {
  console.log(`⏳ Job ${jobId} is waiting`);
});

queueEvents.on('active', ({ jobId }) => {
  console.log(`⚡ Job ${jobId} is now active`);
});

queueEvents.on('completed', ({ jobId, returnvalue }) => {
  console.log(`✅ Job ${jobId} completed:`, returnvalue);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`❌ Job ${jobId} failed:`, failedReason);
});

// Helper function to add ride processing job
export const addRideJob = async (rideId: string, priority: number = 1) => {
  try {
    const job = await rideQueue.add(
      'process-ride',
      { rideId },
      {
        priority, // 1 = highest priority
        jobId: `ride-${rideId}`, // Custom job ID to prevent duplicates
      }
    );

    console.log(`➕ Added job ${job.id} for ride ${rideId}`);
    return job;
  } catch (error) {
    console.error('❌ Error adding job to queue:', error);
    throw error;
  }
};

// Helper to get job status
export const getRideJobStatus = async (rideId: string) => {
  try {
    const jobId = `ride-${rideId}`;
    const job = await rideQueue.getJob(jobId);

    if (!job) {
      return { found: false };
    }

    const state = await job.getState();
    const progress = job.progress;

    return {
      found: true,
      id: job.id,
      state,
      progress,
      data: job.data,
      returnvalue: job.returnvalue,
    };
  } catch (error) {
    console.error('❌ Error getting job status:', error);
    return { found: false, error };
  }
};

// Graceful shutdown
export const closeQueue = async () => {
  console.log('🛑 Closing ride queue...');
  await rideQueue.close();
  await queueEvents.close();
  console.log('✅ Ride queue closed');
};

// Log queue info on startup
rideQueue.on('error', (err) => {
  console.error('❌ Queue error:', err);
});

console.log('✅ Ride queue initialized');