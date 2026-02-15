import { Request, Response } from "express";
import RideRequest from "../models/RideRequest";

import { rideQueue } from "../queues/ride.queue";

export const createRide = async (req: Request, res: Response) => {
  try {

    const ride = await RideRequest.create(req.body);

    await rideQueue.add("processRide", {
      rideId: ride._id.toString()
    });

    return res.status(201).json({
      message: "Ride request received",
      rideId: ride._id
    });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}