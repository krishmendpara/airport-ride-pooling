// workers/rideProcessing.worker.ts
import { Worker } from "bullmq";
import { matchRide } from "../services/matching.service";
import { calculateFare } from "../services/pricing.service";
import RideRequest from "../models/RideRequest";
import { io } from "../server";

// ✅ SOLUTION: Use connection options instead of redis instance
const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Important for BullMQ
};

const worker = new Worker(
  "ride-processing",
  async (job) => {
    const { rideId } = job.data;
    console.log("Processing ride:", rideId);

    try {
      // Match ride with available cabs
      await matchRide(rideId);

      // Calculate fare
      const fare = await calculateFare(rideId);

      // Update ride request
      const ride = await RideRequest.findById(rideId);
      if (!ride) {
        throw new Error(`Ride ${rideId} not found`);
      }

      ride.fare = fare;
      ride.status = "MATCHED";
      await ride.save();

      // Emit socket event
      io.emit("rideMatched", {
        rideId,
        fare,
        poolId: ride.pool,
      });

      console.log(`✅ Ride ${rideId} matched successfully`);
    } catch (error) {
      console.error(`❌ Error processing ride ${rideId}:`, error);
      throw error; // Will trigger retry
    }
  },
  {
    connection: redisConnection, // ✅ Use connection options
    concurrency: 5, // Process 5 jobs at a time
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000, // Per 1 second
    },
  }
);

// Event listeners
worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("❌ Worker error:", err);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received, closing worker...");
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received, closing worker...");
  await worker.close();
  process.exit(0);
});

export default worker;