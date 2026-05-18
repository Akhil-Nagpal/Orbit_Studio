import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Server Readiness Route import
import systemRoutes from "./routes/system.routes";

// All Route imports
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import channelRoutes from "./routes/channel.routes";
import videoRoutes from "./routes/video.routes";
import playlistRoutes from "./routes/playlist.routes";
import { globalErrorHandler } from "./middlewares/globalError.middleware";
import { corsOption } from "./config/cors.config";
import { apiRateLimiter } from "./middlewares/rateLimit.middleware";

export const app = express();

// middleware for express json limit
app.use(express.json({ limit: "16kb" }));

// middleware for rate limiting
app.use(apiRateLimiter);

// middleware for cors origin
app.use(cors(corsOption));

// middleware for Url Encoding - example - this change the link in the browser like akhil+nagpal or akhil%20nagpal
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// middleware for cookie-parser
app.use(cookieParser());

// Service Readiness Endpoints
app.use("/", systemRoutes);

// All Routes implemented
// Auth route
app.use("/api/v1/auth", authRoutes);
// User Route
app.use("/api/v1/user", userRoutes);
// Subscription Route
app.use("/api/v1/subscription", subscriptionRoutes);
// Channel Routes
app.use("/api/v1/channel", channelRoutes);
// Video Routes
app.use("/api/v1/video", videoRoutes);
// Playlist Routes
app.use("/api/v1/playlist", playlistRoutes);

// Global Error Middleware
app.use(globalErrorHandler);
