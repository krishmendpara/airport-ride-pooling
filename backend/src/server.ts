// src/server.ts
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import rideRoutes from "./routes/ride.routes";
import cancelRoutes from "./routes/cancel.routes";
import "./workers/ride.worker"; // Auto-start worker
import { initSocket } from "./sockets/socket";
import { rideLimiter } from "./middleware/rateLimiter";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";




// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Routes
app.use("/api/rides",rideLimiter, rideRoutes);
app.use("/api/cancel", cancelRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root route
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Smart Airport Pooling Backend Running",
    version: "1.0.0",
    endpoints: {
      rides: "/api/rides",
      cancel: "/api/cancel",
    },
  });
});

// Database connection
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log("✅ MongoDB Connected");
    console.log(`📊 Database: ${mongoose.connection.name}`);
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  // ✅ FIXED: Proper template literal syntax
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO initialized`);
  console.log(`👷 Worker running in background`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log("\n🛑 Shutting down gracefully...");

  server.close(() => {
    console.log("✅ HTTP server closed");
  });

  await mongoose.connection.close();
  console.log("✅ MongoDB connection closed");

  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Handle uncaught errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

export default app;