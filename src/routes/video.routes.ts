import { Router } from "express";

import { optionalAuth } from "../middlewares/optionalAuth.middleware";
import {
  addView,
  deleteComment,
  getComments,
  getFeed,
  getRelatedVideos,
  getSingleVideo,
  getUploadSignature,
  postComment,
  toggleLike,
  updateComment,
  updateMetadata,
  uploadVideo,
} from "../controllers/video.controller";
import { validate } from "../middlewares/validation.middleware";
import {
  updateMetadataSchema,
  videoParamSchema,
} from "../validations/video.validation";
import { verifyJwt } from "../middlewares/auth.middleware";
import {
  commentParamSchema,
  commentsSchema,
  postCommentSchema,
  updateCommentSchema,
} from "../validations/comment.validation";
import {
  commentRateLimiter,
  uploadRateLimiter,
  viewRateLimiter,
} from "../middlewares/rateLimit.middleware";

const router = Router();

// --- Uploading Video ---
// For directly upload video from frontend I need 3 apis - 1st - signature assigning, 2nd - uploading video / creating video record in DB, 3rd - updating video metadata
// Assigning browser a signature for authorization
router.get(
  "/upload-signature",
  verifyJwt,
  uploadRateLimiter,
  getUploadSignature
);
// Uploading video / Creating video record in DB
router.post("/upload", verifyJwt, uploadRateLimiter, uploadVideo);

// Get Videos for Home Feed
router.get("/", optionalAuth, getFeed);

// Get Single Video
router.get(
  "/:videoId",
  optionalAuth,
  validate(videoParamSchema),
  getSingleVideo
);

// Updating Video Metadata
router.patch(
  "/:videoId",
  verifyJwt,
  validate(updateMetadataSchema),
  updateMetadata
);

// Engagement Routes of video
// view route
router.post(
  "/:videoId/view",
  viewRateLimiter,
  optionalAuth,
  validate(videoParamSchema),
  addView
);
// Toggle Like
router.post(
  "/:videoId/toggle-like",
  verifyJwt,
  validate(videoParamSchema),
  toggleLike
);
// Comment Routes
// Get all comments for a video
router.get(
  "/:videoId/comments",
  verifyJwt,
  validate(commentsSchema),
  getComments
);
// Post a comment
router.post(
  "/:videoId/comments",
  verifyJwt,
  commentRateLimiter,
  validate(postCommentSchema),
  postComment
);
// Update Comment
router.patch(
  "/:videoId/:commentId",
  verifyJwt,
  commentRateLimiter,
  validate(updateCommentSchema),
  updateComment
);
// Delete Comment
router.delete(
  "/:videoId/:commentId",
  verifyJwt,
  validate(commentParamSchema),
  deleteComment
);

// Related Video System
router.get(
  "/:videoId/realted",
  optionalAuth,
  validate(videoParamSchema),
  getRelatedVideos
);

export default router;
