import { Router } from "express";
import { cancelRide } from "../controllers/cancel.controller";

const router = Router();

// DELETE /api/cancel/:rideId
router.delete("/:rideId", cancelRide);

export default router;
