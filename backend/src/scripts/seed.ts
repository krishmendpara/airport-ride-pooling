import mongoose from "mongoose";
import dotenv from "dotenv";
import RidePool from "../models/RidePool.js";

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);

  await RidePool.create({
    passengers: [],
    maxSeats: 4,
    maxLuggage: 6,
    currentSeats: 0,
    currentLuggage: 0,
    status: "OPEN"
  });

  console.log("Database seeded");
  process.exit();
}

seed();
