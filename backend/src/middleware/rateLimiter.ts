import rateLimit from "express-rate-limit";

export const rideLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 20, // max 20 requests per second per IP
  standardHeaders: true,
  legacyHeaders: false,
});
