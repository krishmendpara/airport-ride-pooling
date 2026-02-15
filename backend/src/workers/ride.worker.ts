// src/workers/rideProcessing.worker.ts
import { Worker } from "bullmq";
import { matchRide } from "../services/matching.service";
import { calculateFare } from "../services/pricing.service";
import RideRequest from "../models/RideRequest";
import { getIO } from "../sockets/socket";

console.log("🚀 Ride Worker Started");

const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

const worker = new Worker(
  "ride-processing",
  async (job) => {
    const { rideId } = job.data;
    console.log("📍 Processing ride:", rideId);

    try {
      // Match ride
      await matchRide(rideId);

      // Calculate fare
      const fare = await calculateFare(rideId);

      // Update ride
      const ride = await RideRequest.findById(rideId);
      if (!ride) throw new Error("Ride not found");

      ride.fare = fare;
      ride.status = "MATCHED";
      await ride.save();

      // Emit socket event
      const io = getIO();
      io.emit("rideMatched", {
        rideId,
        fare,
        poolId: ride.pool,
      });

      // ✅ FIXED: Proper template literal syntax
      console.log(`✅ Ride ${rideId} matched successfully`);
      
      return { success: true, rideId, fare };
    } catch (error) {
      // ✅ FIXED: Proper template literal syntax
      console.error(`❌ Error processing ride ${rideId}:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

// Event listeners
worker.on("completed", (job) => {
  // ✅ FIXED: Proper template literal syntax
  console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  // ✅ FIXED: Proper template literal syntax
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("❌ Worker error:", err);
});

worker.on("ready", () => {
  console.log("✅ Worker is ready to process jobs");
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