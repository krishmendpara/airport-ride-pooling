// src/routes/ride.routes.ts
import { Router } from "express";
import mongoose from "mongoose";  // ✅ Add this import
import { createRide } from "../controllers/ride.controller";
import RideRequest from "../models/RideRequest";
import redis from "../config/redis";

const router = Router();

// Create ride
router.post("/create", createRide);

// Get ride by ID with caching
router.get("/:rideId", async (req, res) => {
  try {
    const { rideId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(rideId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid ride ID format",
      });
    }

    const cacheKey = `ride:${rideId}`;

    // Check cache
    const cached = await redis.get(cacheKey);

    if (cached) {
      console.log(`✅ Cache HIT for ride ${rideId}`);
      return res.json({
        success: true,
        data: JSON.parse(cached),
        source: "cache",
      });
    }

    console.log(`❌ Cache MISS for ride ${rideId}`);

    // Fetch from database
    const ride = await RideRequest.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: "Ride not found",
      });
    }

    // Cache for 30 seconds
    await redis.set(cacheKey, JSON.stringify(ride), "EX", 30);

    return res.json({
      success: true,
      data: ride,
      source: "database",
    });
  } catch (error: any) {
    console.error("❌ Error fetching ride:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

export default router;