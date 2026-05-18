// Rate limiting configuration

// This configuration is for tuning time limits for specific routes

export const rateLimitConfig = {
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes time window in milliseconds
    limit: 300, // added limit withing 15 min's of window
  },
  auth: {
    windowMs: 10 * 60 * 1000, // 10 minutes time window
    limit: 5, // added limit for auth
  },
  upload: {
    windowMs: 60 * 60 * 1000, // 60 minutes time window
    limit: 20, // limit for uploading videos
  },
  comment: {
    windowMs: 10 * 60 * 1000, // 10 minutes time window
    limit: 30, // limit for adding comments or updating comments
  },
  view: {
    windowMs: 1 * 60 * 1000, // 1 minute time window
    limit: 50, // limit for adding view in 1 minute
  },
};
