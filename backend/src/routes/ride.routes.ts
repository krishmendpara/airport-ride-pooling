import { Router } from "express";
import { createRide } from "../controllers/ride.controller";

const router = Router();

router.post("/create", createRide);

export default router;
