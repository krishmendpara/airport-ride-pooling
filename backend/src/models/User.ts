import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  phone: { type: String }
}, { timestamps: true });

export default mongoose.model<IUser>("User", UserSchema);
