import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";

import {
  addVideoService,
  createPlaylistService,
  deletePlaylistService,
  deleteVideoService,
  getSinglePlaylistService,
  updatePlaylistService,
} from "../services/playlist.service";

// Get single playlist
export const getSinglePlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    const { playlistId } = req.params;

    if (!playlistId) {
      throw new ApiError(400, "Playlist ID is required");
    }

    const userId = req.user?._id?.toString();

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const playlist = await getSinglePlaylistService(
      playlistId,
      page,
      limit,
      userId
    );

    res
      .status(200)
      .json(new ApiResponse(200, "Playlist fetched successfully", playlist));
  }
);

// Create playlist
export const createPlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized request");
    }

    const { title, description, visibility } = req.body;

    const createdPlaylist = await createPlaylistService(
      userId.toString(),
      title,
      description,
      visibility
    );

    res
      .status(201)
      .json(
        new ApiResponse(201, "Playlist created successfully", createdPlaylist)
      );
  }
);

// Add video to playlist
export const addVideo = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }

  const { playlistId } = req.params;
  const { videoId } = req.body;

  if (!playlistId) {
    throw new ApiError(400, "Playlist ID is required");
  }

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  const addedVideo = await addVideoService(
    playlistId,
    videoId,
    userId.toString()
  );

  res
    .status(200)
    .json(new ApiResponse(200, "Video added successfully", addedVideo));
});

// Delete video
export const deleteVideo = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }

  const { playlistId, videoId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "Playlist ID is required");
  }

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  await deleteVideoService(playlistId, videoId, userId.toString());

  res
    .status(200)
    .json(new ApiResponse(200, "Video deleted successfully", null));
});

// Update playlist
export const updatePlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized request");
    }

    const { playlistId } = req.params;

    if (!playlistId) {
      throw new ApiError(400, "Playlist ID is required");
    }

    const { title, description, visibility } = req.body;

    const updatedPlaylist = await updatePlaylistService(
      playlistId,
      userId.toString(),
      {
        title,
        description,
        visibility,
      }
    );

    res
      .status(200)
      .json(
        new ApiResponse(200, "Playlist updated successfully", updatedPlaylist)
      );
  }
);

// Delete playlist
export const deletePlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized request");
    }

    const { playlistId } = req.params;

    if (!playlistId) {
      throw new ApiError(400, "Playlist ID is required");
    }

    await deletePlaylistService(playlistId, userId.toString());

    res
      .status(200)
      .json(new ApiResponse(200, "Playlist deleted successfully", null));
  }
);
