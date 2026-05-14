import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import logger from "../utils/logger";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // set status code and message
  let statusCode = 500;
  let message = "Internal Server Error";

  // Check if the error comes from custom error class
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Log Error Internally
  logger.error("Application Error", {
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.originalUrl,
    method: req.method,
  });

  // Send clean Response to client
  res.status(statusCode).json({
    success: false,
    message,
  });
};
