import { Request, Response } from "express";
import RideRequest from "../models/RideRequest";
import RidePool from "../models/RidePool";
import {redlock} from "../config/lock";
import redis from "../config/redis";
import { getIO } from "../sockets/socket";

export const cancelRide = async (req: Request, res: Response) => {
  const { rideId } = req.params;

  let lock: any;

  try {
    // 🔒 Acquire distributed lock
    lock = await redlock.acquire([`locks:ride:${rideId}`], 3000);

    const ride = await RideRequest.findById(rideId);

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    if (ride.status === "CANCELLED") {
      return res.status(400).json({ error: "Ride already cancelled" });
    }

    const pool = ride.pool
      ? await RidePool.findById(ride.pool)
      : null;

    // ✅ Mark ride cancelled
    ride.status = "CANCELLED";
    await ride.save();

    // ✅ Safely decrease active request counter
    const activeRequests = await redis.get("active_requests");
    if (activeRequests && Number(activeRequests) > 0) {
      await redis.decr("active_requests");
    }

    // ✅ Update pool safely
    if (pool) {
      pool.passengers = pool.passengers.filter(
        (p) => p.toString() !== rideId
      );

      pool.currentSeats = Math.max(
        0,
        pool.currentSeats - ride.seatCount
      );

      pool.currentLuggage = Math.max(
        0,
        pool.currentLuggage - ride.luggageCount
      );

      if (pool.passengers.length === 0) {
        await RidePool.deleteOne({ _id: pool._id });
      } else {
        pool.status = "OPEN";
        await pool.save();
      }
    }

    // 📡 Emit real-time update
    const io = getIO();
    io.emit("rideCancelled", {
      rideId,
      poolId: pool?._id || null,
    });

    return res.status(200).json({
      message: "Ride cancelled successfully",
      rideId,
    });

  } catch (err: any) {
    console.error("❌ Cancel Ride Error:", err);
    return res.status(500).json({
      error: "Cancellation failed",
      details: err.message,
    });
  } finally {
    // 🔓 Always release lock
    if (lock) {
      try {
        await lock.release();
      } catch (releaseError) {
        console.error("❌ Lock release error:", releaseError);
      }
    }
  }
};
