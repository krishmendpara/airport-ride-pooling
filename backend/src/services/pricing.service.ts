import { getDistance } from "geolib";
import redis from "../config/redis";
import RideRequest from "../models/RideRequest";

const BASE_FARE = 100;
const PER_KM_RATE = 15;
const POOL_DISCOUNT = 0.8; // 20% discount

// Calculate distance in KM
const calculateDistance = (
  pickup: [number, number],
  drop: [number, number]
): number => {

  const distance = getDistance(
    { latitude: pickup[1], longitude: pickup[0] },
    { latitude: drop[1], longitude: drop[0] }
  );

  return distance / 1000;
};

// Surge multiplier logic
const getSurgeMultiplier = async (): Promise<number> => {

  const activeRequests = await redis.get("active_requests");
  const demand = activeRequests ? parseInt(activeRequests) : 0;

  if (demand < 10) return 1;
  if (demand < 20) return 1.2;
  if (demand < 50) return 1.5;

  return 2;
};

export const calculateFare = async (rideId: string): Promise<number> => {

  const ride = await RideRequest.findById(rideId);
  if (!ride) throw new Error("Ride not found");

  const distance = calculateDistance(
    ride.pickupLocation.coordinates,
    ride.dropLocation.coordinates
  );

  const surge = await getSurgeMultiplier();

  let fare = BASE_FARE + (distance * PER_KM_RATE);

  fare = fare * surge;

  // Apply pooling discount if ride is matched to pool
  if (ride.pool) {
    fare = fare * POOL_DISCOUNT;
  }

  return Math.round(fare);
};
