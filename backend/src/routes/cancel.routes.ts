import { Router } from "express";
import { cancelRide } from "../controllers/cancel.controller";

const router = Router();

router.delete("/:rideId", cancelRide);

export default router;
