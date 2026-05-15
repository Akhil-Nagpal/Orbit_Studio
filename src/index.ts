import { connectDB } from "./db/connect";
import { app } from "./app";
import logger from "./utils/logger";

const PORT: Number = Number(Bun.env.PORT) || 8000;

connectDB()
  .then(() => {
    logger.info("Database connected successfully!");

    app.listen(PORT, () => {
      logger.info("Server is running on Port:", PORT);
    });
  })
  .catch((error) => {
    logger.error("Database connection failed!", {
      message: error.message || "Unknown error",
      stack: error.stack || "No stack trace available",
      name: error.name || "DB Connection Error",
    });
  });
