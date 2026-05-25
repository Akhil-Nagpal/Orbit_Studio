import { Router, type Request, type Response } from "express";

const router = Router();

// Basic Route
router.get("/", (req: Request, res: Response) => {
  res.send("Server is working. HURRAY!");
});

// Health Check Route
router.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Server is healthy v2",
    uptime: process.uptime(),
    timestamps: new Date().toISOString(),
  });
});

export default router;
