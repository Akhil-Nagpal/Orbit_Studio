import rateLimit, {
  type Options,
  type RateLimitRequestHandler,
} from "express-rate-limit";
import { rateLimitConfig } from "../config/rateLimit.config";

// This is Resuable function for creating rate limiters using the ratLimitConfig file for specific routes
const createRateLimiter = (
  options: Partial<Options>
): RateLimitRequestHandler =>
  rateLimit({
    standardHeaders: true, // Enable standard rate limit headers (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
    legacyHeaders: false, // Disable old X-RateLimit headers for morern approach
    skipFailedRequests: false, // Count Failed requests
    skipSuccessfulRequests: false, // Count successfull requests

    // Default response messge when user exceeds the limit
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },

    ...options, // Spread route specific options like (windowMs, limit)
  });

// Global API Limiter
export const apiRateLimiter = createRateLimiter({
  ...rateLimitConfig.api, // get config options from ratelimit config file for api's
});

// Auth rate Limiter
export const authRatelimiter = createRateLimiter({
  ...rateLimitConfig.auth,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

// Upload Rate limiter
export const uploadRateLimiter = createRateLimiter({
  ...rateLimitConfig.upload,
  message: {
    success: false,
    message: "Upload limit exceeded. Please try again later.",
  },
});

// Comment Rate Limiter
export const commentRateLimiter = createRateLimiter({
  ...rateLimitConfig.upload,
  message: {
    success: false,
    message: "Too manny comments. Slow down and try again",
  },
});

// View Rate Limiter
export const viewRateLimiter = createRateLimiter({
  ...rateLimitConfig.view,
});
