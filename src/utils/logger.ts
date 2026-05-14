import winston from "winston";
import fs from "fs";
import path from "path";

// ------
// Crerate logs directory if it doesn't exists
// ------
const logDir = "logs";

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// -----
// Determining Environment
// -----
const isProduction = Bun.env.NODE_ENV === "production";

const logLevel = Bun.env.LOG_LEVEL || "info";
// -----
// Create Winston Logger
// -----
const logger = winston.createLogger({
  // Set Log Level
  // Log level controls what gets printed
  // * debug - everything
  // * info - info, warn, error
  // * error - only errors
  level: logLevel,

  // Set Format
  // This defines hows logs look - like timestamps, error stack trace, in which format
  format: winston.format.combine(
    winston.format.timestamp(), // Add timestamps automatically
    winston.format.errors({ stack: true }), // Include stack trace in errors
    winston.format.json() // Structured JSON logs
  ),

  // Set Transports
  // Transports defines where logs go, this is an array
  transports: [
    // Always log to console
    new winston.transports.Console(),

    // But in Production also log to files
    ...(isProduction
      ? [
          // Error Only File
          new winston.transports.File({
            filename: path.join(logDir, "error.log"),
            level: "error",
          }),

          // All Logs File
          new winston.transports.File({
            filename: path.join(logDir, "combined.log"),
          }),
        ]
      : []),
  ],
});

export default logger;
