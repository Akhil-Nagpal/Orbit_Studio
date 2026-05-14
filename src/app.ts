import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// All Route imports
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import channelRoutes from "./routes/channel.routes";
import videoRoutes from "./routes/video.routes";
import playlistRoutes from "./routes/playlist.routes";
import { globalErrorHandler } from "./middlewares/globalError.middleware";

export const app = express();

// middleware for express json limit
app.use(express.json({ limit: "16kb" }));

// middleware for cors origin
app.use(
  cors({
    origin: Bun.env.CORS_ORIGIN,
    credentials: true,
  })
);

// middleware for Url Encoding - example - this change the link in the browser like akhil+nagpal or akhil%20nagpal
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// middleware for cookie-parser
app.use(cookieParser());

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
