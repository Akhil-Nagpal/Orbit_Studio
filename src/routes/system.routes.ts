import { Router, type Request, type Response } from "express";

const router = Router();

// Basic Route
router.get("/", (req: Request, res: Response) => {
  res.send("API is running");
});

// Health Check Route
router.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Server is healthy",
    uptime: process.uptime(),
    timestamps: new Date().toISOString(),
  });
});

export default router;
