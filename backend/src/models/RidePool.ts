import mongoose, { Schema, Document } from "mongoose";

export interface IRidePool extends Document {
  passengers: mongoose.Types.ObjectId[];
   maxSeats: number;
    maxLuggage: number;
  currentSeats: number;
   currentLuggage: number;
  status: string;
  totalDistance: number;
}

const RidePoolSchema = new Schema<IRidePool>({
  passengers: [{ type: Schema.Types.ObjectId, ref: "RideRequest" }],

  maxSeats: { type: Number, required: true },
  maxLuggage: { type: Number, required: true },

  currentSeats: { type: Number, default: 0 },
  currentLuggage: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ["OPEN", "FULL", "COMPLETED"],
    default: "OPEN"
  },

  totalDistance: { type: Number, default: 0 }

}, { timestamps: true });

RidePoolSchema.index({ status: 1 });

export default mongoose.model<IRidePool>("RidePool", RidePoolSchema);
