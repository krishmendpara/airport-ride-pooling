import RideRequest from "../models/RideRequest";
import RidePool from "../models/RidePool";
import { redlock } from "../config/lock";
import { calculateDistanceKm } from "../utils/distance";

export const matchRide = async (rideId: string) => {
  const lock = await redlock.acquire([`locks:ride:${rideId}`], 2000);

  try {
    const ride = await RideRequest.findById(rideId);
    if (!ride) return;

    // 1️⃣ Find nearby open pools
    const nearbyPools = await RidePool.find({
      status: "OPEN"
    });

    let bestPool = null;
    let minDeviation = Infinity;

    for (const pool of nearbyPools) {
      if (
        pool.currentSeats + ride.seatCount > pool.maxSeats ||
        pool.currentLuggage + ride.luggageCount > pool.maxLuggage
      ) continue;

      // simple deviation logic: distance between pickup points
      const existingRide = await RideRequest.findById(pool.passengers[0]);
      if (!existingRide) continue;

      const deviation = calculateDistanceKm(
        ride.pickupLocation.coordinates,
        existingRide.pickupLocation.coordinates
      );

      if (deviation <= ride.detourTolerance && deviation < minDeviation) {
        bestPool = pool;
        minDeviation = deviation;
      }
    }

    if (bestPool) {
      bestPool.passengers.push(ride._id as any);
      bestPool.currentSeats += ride.seatCount;
      bestPool.currentLuggage += ride.luggageCount;

      if (bestPool.currentSeats === bestPool.maxSeats)
        bestPool.status = "FULL";

      await bestPool.save();

      ride.status = "MATCHED";
      ride.pool = bestPool._id as any;
      await ride.save();

    } else {
      // create new pool
      const newPool = await RidePool.create({
        passengers: [ride._id],
        maxSeats: 4,
        maxLuggage: 6,
        currentSeats: ride.seatCount,
        currentLuggage: ride.luggageCount
      });

      ride.pool = newPool._id as any;
      ride.status = "MATCHED";
      await ride.save();
    }

  } finally {
    await lock.release();
  }
};
