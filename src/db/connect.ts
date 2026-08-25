import mongoose from "mongoose";
import Redis from "ioredis";
import logger from "../utils/logger";

export const connectDB = async (): Promise<void> => {
  try {
    const options: mongoose.ConnectOptions = {
      // Connection Pool Setting
      // -----------------------------------
      maxPoolSize: 10, // Maximum number of connection in a pool
      minPoolSize: 5, // Minimum number of coonections to maintain

      // Timeout Settings
      // -----------------------------------
      serverSelectionTimeoutMS: 5000, // Time to find a server to do operations - 5 seconds
      socketTimeoutMS: 45000, // Time for socket operations - 45 seconds
      connectTimeoutMS: 10000, // Time to establish connections - 10 seconds

      // Retry Settings
      // -----------------------------------
      retryReads: true, // Retry when read operation fails
      retryWrites: true, // Retry when write operation fails

      // Advance Settings
      // -----------------------------------
      maxIdleTimeMS: 10000, // Close the idle connection after 10 seconds to reduce unnecessary load
      heartbeatFrequencyMS: 10000, // Check the server health every 10 seconds

      // Compression settings
      // -----------------------------------
      compressors: ["zlib"],
    };

    const connectionInstance = await mongoose.connect(
      `${Bun.env.MONGODB_URI}/${Bun.env.DB_NAME}`,
      options
    );
    logger.info(
      "Database connection established successfully!",
      "Host:",
      connectionInstance.connection.host
    );
  } catch (error) {
    logger.error("Databse connection failed!", error);
    process.exit(1);
  }
};

// Redis Connection Configuration
export const redis = new Redis(Bun.env.REDIS_URL! as string, {
  // Retry options
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 3000); // Delay is set to determine the retry frequency caped to 3s
    return delay;
  },

  // Connection behaviour options
  enableOfflineQueue: true, // Queue commands while reconnecting instead of failing instantly
  lazyConnect: false, // Connect immediately on startup, not on first command
});

// Connect Redis
redis.on("connect", () => {
  logger.info("Redis Connected Successfully!");
});

// Grab the connection error
redis.on("error", (err) => {
  logger.error("Redis Connection Failed!", err);
});
