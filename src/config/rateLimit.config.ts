// Rate limiting configuration

// This configuration is for tuning time limits for specific routes

const isProduction = process.env.NODE_ENV === "production";

export const rateLimitConfig = {
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes time window in milliseconds
    limit: isProduction ? 300 : 100000, // added limit withing 15 min's of window
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 10 minutes time window
    limit: isProduction ? 10 : 1000, // added limit for auth
  },
  upload: {
    windowMs: 60 * 60 * 1000, // 60 minutes time window
    limit: isProduction ? 20 : 1000, // limit for uploading videos
  },
  comment: {
    windowMs: 10 * 60 * 1000, // 10 minutes time window
    limit: isProduction ? 30 : 1000, // limit for adding comments or updating comments
  },
  view: {
    windowMs: 1 * 60 * 1000, // 1 minute time window
    limit: isProduction ? 50 : 10000, // limit for adding view in 1 minute
  },
};
