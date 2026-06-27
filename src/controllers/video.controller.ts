import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import {
  addViewService,
  deleteCommentService,
  getCommentsService,
  getFeedService,
  getRelatedVideosService,
  getSingleVideoService,
  getUploadSignatureService,
  postCommentService,
  toggleLikeService,
  updateCommentService,
  updateMetadataService,
  uploadVideoService,
} from "../services/video.service";
import { ApiResponse } from "../utils/apiResponse";
import { Channel } from "../models/channel.model";

// Get Videos for home feed from all channels
export const getFeed = asyncHandler(async (req: Request, res: Response) => {
  // get the page and limit for pagination
  const { page, limit } = req.query;
  // Call the service
  const feedFetched = getFeedService(Number(page), Number(limit));
  // give back the response to the client
  res
    .status(200)
    .json(new ApiResponse(200, "Feed Fetched Successfully", feedFetched));
});

// Get Single Video
export const getSingleVideo = asyncHandler(
  async (req: Request, res: Response) => {
    // get the video and viewer id
    const { videoId } = req.params;
    // check if the video id exists or not
    if (!videoId) {
      throw new ApiError(400, "Video ID is required");
    }
    const viewerId = req.user?._id;
    // call the service
    const singleVideo = await getSingleVideoService(
      videoId,
      viewerId?.toString()
    );
    // give back the response to the client
    res
      .status(200)
      .json(
        new ApiResponse(200, "Single Video fetched Successfully!", singleVideo)
      );
  }
);

// Uploading Video
// Get Upload Signature
export const getUploadSignature = asyncHandler(
  async (req: Request, res: Response) => {
    // In this request client won't send anything just call for getting the signature, so no request
    // call the service
    const uploadSignature = await getUploadSignatureService();
    // give back the response to the client
    res
      .status(200)
      .json(
        new ApiResponse(200, "Signature fetched successfully", uploadSignature)
      );
  }
);

// Upload Video / Creating video Record In DB
export const uploadVideo = asyncHandler(async (req: Request, res: Response) => {
  // gte the user id
  const userId = req.user?._id;
  // find the channel using userId and extract the channel Id
  const channel = await Channel.findOne({
    owner: userId,
  }).select("_id");
  // ckeck if the channel exists or not
  if (!channel) {
    throw new ApiError(404, "Channel Not Found");
  }
  console.log(req);
  // get the videoFile from the user
  const {
    videoFile,
    duration,
    thumbnail,
    title,
    description,
    category,
    tags,
    visibility,
  } = req.body;

  // call the service
  const uploadVideo = await uploadVideoService(channel._id.toString(), {
    videoFile,
    duration,
    thumbnail,
    title,
    description,
    category,
    tags,
    visibility,
  });
  // give back the response to the client
  res
    .status(200)
    .json(new ApiResponse(200, "Video uploaded Successfully", uploadVideo));
});

// Update Metadata
export const updateMetadata = asyncHandler(
  async (req: Request, res: Response) => {
    // get the videoId
    const { videoId } = req.params;
    // check if the video exists or not
    if (!videoId) {
      throw new ApiError(400, "Video ID is required");
    }

    const userId = req.user?._id;
    // get the channel id from the channel
    const channel = await Channel.findOne({
      owner: userId,
    }).select("_id");
    // check if the channel exists or not
    if (!channel) {
      throw new ApiError(404, "Channel Not Found");
    }
    // get the data from user
    const { title, description, category, tags, playlist, visibility } =
      req.body;
    // call the service
    const updatedMetadata = await updateMetadataService(
      videoId,
      channel._id.toString(),
      {
        title,
        description,
        category,
        tags,
        playlist,
        visibility,
      }
    );
    // give back the response to the client
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Video Metadata Updated Successfully",
          updatedMetadata
        )
      );
  }
);

// Engagement Controller
// Adding View
// Note: For adding the view for both - logged in or guest user we need to check whether the user logged in or not and even if the user is not logged in the user must able to watch the video, so we store sessions and store that to cookies
export const addView = asyncHandler(async (req: Request, res: Response) => {
  // get the videoId
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }
  // get the userId for authorization
  const userId = req.user?._id.toString() || null;

  // get the sessionId to set the cookies
  const sessionId = req.cookies.viewer_session;
  // call the service - Note: while calling the service we also have to send response to the service cause we need to set the cokkies from service
  const result = await addViewService(videoId, userId, sessionId);

  // give back the response to the client
  if (result.newSessionId) {
    res.cookie("viewer_session", result.newSessionId, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
  }

  res.status(200).json(
    new ApiResponse(200, "View Added Successfully", {
      counted: result.counted,
    })
  );
});

// Liking or Unliking the video
export const toggleLike = asyncHandler(async (req: Request, res: Response) => {
  // get the user and video id
  const userId = req.user?._id;
  const { videoId } = req.params;
  // check if both exists or not
  if (!userId) {
    throw new ApiError(401, "Unauthorized Request");
  }
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }
  // call the service
  const toggledLike = await toggleLikeService(userId.toString(), videoId);
  // give back the response to the client
  res
    .status(200)
    .json(new ApiResponse(200, "Like Toggled successfully!", toggledLike));
});

// Get all Comments of a video
export const getComments = asyncHandler(async (req: Request, res: Response) => {
  // get the videoId
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }
  // get the query parameters
  const { page, limit } = req.query;
  // Call the service
  const comments = await getCommentsService(
    videoId,
    Number(page),
    Number(limit)
  );
  // Give back the response to the client
  res
    .status(200)
    .json(new ApiResponse(200, "Comments fetched successfully", comments));
});

// Posting a comment
export const postComment = asyncHandler(async (req: Request, res: Response) => {
  // get the userId, video id and content from user
  const userId = req.user?._id;
  const { videoId } = req.params;
  const { content } = req.body;
  // check if the user is authorized or not
  if (!userId) {
    throw new ApiError(401, "Unauthorized Request");
  }
  // check if the video id exists or not
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }
  // check if the content came or not
  if (!content) {
    throw new ApiError(400, "Comment is required");
  }
  // call the service
  const postedComment = await postCommentService(
    userId.toString(),
    videoId,
    content
  );
  // give back the resposne top the client
  res.status(200).json(new ApiResponse(200, "Comment Posted!", postedComment));
});

// Update Comment
export const updateComment = asyncHandler(
  async (req: Request, res: Response) => {
    // get the userId and commentId
    const userId = req.user?._id;
    const { commentId } = req.params;

    if (!userId) {
      throw new ApiError(401, "Unauthorized Request");
    }
    if (!commentId) {
      throw new ApiError(400, "Comment ID is required");
    }
    // get the content
    const { content } = req.body;

    if (!content) {
      throw new ApiError(400, "Content is required");
    }
    // call the service
    const updatedComment = await updateCommentService(
      userId.toString(),
      commentId,
      content
    );
    // give back the response to the client
    res
      .status(200)
      .json(
        new ApiResponse(200, "Comment Edited successfully", updatedComment)
      );
  }
);

// Delete Comment
export const deleteComment = asyncHandler(
  async (req: Request, res: Response) => {
    // get the commentId and userId
    const userId = req.user?._id;

    const { commentId } = req.params;
    // check if the commentId and user Id exists or not
    if (!userId) {
      throw new ApiError(401, "Unauthorized Request");
    }
    if (!commentId) {
      throw new ApiError(400, "Comment ID is required");
    }
    // call the service
    await deleteCommentService(userId.toString(), commentId);
    // give abck the reponse to the client
    res
      .status(200)
      .json(new ApiResponse(200, "Comment deleted successfully", null));
  }
);

// Related Videos
export const getRelatedVideos = asyncHandler(
  async (req: Request, res: Response) => {
    // get the videoId
    const { videoId } = req.params;
    // check if the video id is valid or not
    if (!videoId) {
      throw new ApiError(400, "Video ID is required");
    }
    // call the service
    const relatedVideos = await getRelatedVideosService(videoId);
    // give back the response to the client
    res
      .status(200)
      .json(new ApiResponse(200, "Related Videos Fetched", relatedVideos));
  }
);
