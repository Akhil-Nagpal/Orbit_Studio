import mongoose from "mongoose";
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
