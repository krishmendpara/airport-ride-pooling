import Redis from "ioredis";

const redisHost = process.env.REDIS_HOST ?? "localhost";
const redisPort = Number(process.env.REDIS_PORT ?? 6379);
const redisPassword = process.env.REDIS_PASSWORD;

if (Number.isNaN(redisPort)) {
  throw new Error("REDIS_PORT must be a valid number");
}

const redis = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword, // Add password support
  maxRetriesPerRequest: 5,
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true;
    }
    return false;
  },
});

// Event Handlers
redis.on("connect", () => {
  console.log(`✅ Redis Connected at ${redisHost}:${redisPort}`); // Fixed template literal
});

redis.on("ready", () => {
  console.log("✅ Redis Ready to use"); // Fixed spacing
});

redis.on("error", (err) => {
  console.error("❌ Redis Error:", err.message);
});

redis.on("close", () => {
  console.warn("⚠️ Redis connection closed"); // Fixed spacing
});

redis.on("reconnecting", () => {
  console.log("🔄 Redis reconnecting..."); // Fixed spacing
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n📛 ${signal} received, closing Redis connection...`);
  try {
    await redis.quit();
    console.log("✅ Redis connection closed gracefully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during Redis shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

export default redis;