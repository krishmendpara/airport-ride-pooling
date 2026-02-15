import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import rideRoutes from "./routes/ride.routes";
import cancelRoutes from "./routes/cancel.routes"
import "./workers/ride.worker";


dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

export { io };


app.use("/api/rides", rideRoutes);
app.use("/api/cancel" , cancelRoutes);

mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

app.get("/", (_req , res) => {
  res.send("Smart Airport Pooling Backend Running");
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
