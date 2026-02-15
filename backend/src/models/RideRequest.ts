import mongoose, { Schema, Document } from "mongoose";

export interface IRideRequest extends Document {
  user: mongoose.Types.ObjectId;
  pickupLocation: {
    type: string;
    coordinates: [number, number];
  };
  dropLocation: {
    type: string;
    coordinates: [number, number];
  };
  luggageCount: number;
  seatCount: number;
  detourTolerance: number;
  status: string;
  pool?: mongoose.Types.ObjectId;
}

const RideRequestSchema = new Schema<IRideRequest>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },

  pickupLocation: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true }
  },

  dropLocation: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true }
  },

  luggageCount: { type: Number, required: true },
  seatCount: { type: Number, required: true },
  detourTolerance: { type: Number, required: true },

  status: {
    type: String,
    enum: ["PENDING", "MATCHED", "CANCELLED"],
    default: "PENDING"
  },

  pool: { type: Schema.Types.ObjectId, ref: "RidePool" }

}, { timestamps: true });

RideRequestSchema.index({ pickupLocation: "2dsphere" });
RideRequestSchema.index({ dropLocation: "2dsphere" });
RideRequestSchema.index({ status: 1 });

export default mongoose.model<IRideRequest>("RideRequest", RideRequestSchema);
