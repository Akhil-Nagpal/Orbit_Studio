import rateLimit, {
  type Options,
  type RateLimitRequestHandler,
} from "express-rate-limit";

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
