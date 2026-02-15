import { Request, Response } from "express";
import RideRequest from "../models/RideRequest";
import RidePool from "../models/RidePool";
import {redlock} from "../config/lock";
import redis from "../config/redis";
import { io } from "../server";

export const cancelRide = async (req: Request, res: Response) => {
  const { rideId } = req.params;
  let lock;

  try {
    lock = await redlock.acquire([`locks:ride:${rideId}`], 3000);

    const ride = await RideRequest.findById(rideId);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    if (ride.status === "CANCELLED") {
      return res.status(400).json({ error: "Ride already cancelled" });
    }

    const pool = await RidePool.findById(ride.pool);

    ride.status = "CANCELLED";
    await ride.save();

    // decrease surge counter
    await redis.decr("active_requests");

    if (pool) {
      pool.passengers = pool.passengers.filter(
        (p) => p.toString() !== rideId
      );

      pool.currentSeats -= ride.seatCount;
      pool.currentLuggage -= ride.luggageCount;

      if (pool.passengers.length === 0) {
        await RidePool.deleteOne({ _id: pool._id });
      } else {
        pool.status = "OPEN";
        await pool.save();
      }
    }

    io.emit("rideCancelled", {
      rideId,
      poolId: pool?._id
    });

    return res.json({ message: "Ride cancelled successfully" });

  } catch (err: any) {
    console.error("Cancel Error:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (lock) await lock.release();
  }
};
