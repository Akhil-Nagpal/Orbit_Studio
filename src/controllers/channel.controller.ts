import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import {
  getChannelInfoService,
  getFeaturedContentService,
  getPlaylistsService,
  getVideosService,
  updateAvatarService,
  updateChannelInfoService,
  updateCoverImageService,
} from "../services/channel.service";
import { ApiResponse } from "../utils/apiResponse";

// export const getChannelProfile = asyncHandler(
//   async (req: Request, res: Response) => {
//     // get the channel id and viewer id from request
//     const viewerId = req.user?._id;
//     // check if  viewer  exist or not
//     if (!viewerId) {
//       throw new ApiError(401, "Unauthorized request");
//     }
//     const { channelId } = req.params;
//     // check if channelId exists or not
//     if (!channelId) {
//       throw new ApiError(400, "Channel ID is required");
//     }
//     // call the service
//     const channelData = await getChannelProfileService(
//       viewerId.toString(),
//       channelId
//     );
//     // give back the response to the client
//     res
//       .status(200)
//       .json(new ApiResponse(200, "Channel fetched successfully", channelData));
//   }
// );

export const getChannelInfo = asyncHandler(
  async (req: Request, res: Response) => {
    // get the channel id
    const { channelId } = req.params;
    // check if the channel Id exists or not
    if (!channelId) {
      throw new ApiError(400, "Channel ID is required");
    }
    // get the viewer id
    const viewerId = req.user?._id;
    // check if the viewer exists or not
    if (!viewerId) {
      throw new ApiError(401, "Unauthorized request");
    }
    // call the service
    const channelInfo = await getChannelInfoService(
      channelId,
      viewerId.toString()
    );
    // give back the resposne to the client
    res
      .status(200)
      .json(new ApiResponse(200, "Channel Info Fetched", channelInfo));
  }
);

// Get Channel Featured Content
export const getFeaturedContent = asyncHandler(
  async (req: Request, res: Response) => {
    // get the channel Id from params
    const { channelId } = req.params;
    // check if the channel Id exists or not
    if (!channelId) {
      throw new ApiError(401, "Channel ID is required");
    }
    // call the service
    const featuredContent = await getFeaturedContentService(channelId);
    // give back the response to the client
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "featured Content fetrched successfully",
          featuredContent
        )
      );
  }
);

// Get all the channel videos
export const getVideos = asyncHandler(async (req: Request, res: Response) => {
  // get the channel Id from param
  const { channelId } = req.params;
  // check if the channel Id exists or not
  if (!channelId) {
    throw new ApiError(401, "Channel ID is required");
  }
  // get the page and limit from query param
  const { page, limit } = req.query;
  // call the service
  const videos = await getVideosService(channelId, Number(page), Number(limit));
  // give back the response back to the client
  res.status(200).json(new ApiResponse(200, "Fetched All Videos", videos));
});

// Get all the channel Palylists
export const getPlaylists = asyncHandler(
  async (req: Request, res: Response) => {
    // get channel id
    const { channelId } = req.params;

    // check if the channelId received or not
    if (!channelId) {
      throw new ApiError(400, "Channel ID is required");
    }

    // get viewer id
    const viewerId = req.user?._id;

    // check if the viewerId recieved or not
    if (!viewerId) {
      throw new ApiError(401, "Unauthorized request");
    }

    // get query params from request and also set deafult values
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    // call the service
    const playlists = await getPlaylistsService(channelId, page, limit);

    // give back the response to the client
    res
      .status(200)
      .json(
        new ApiResponse(200, "All Playlists fetched successfully", playlists)
      );
  }
);

// Update Channel Basic Info
export const updateChannelInfo = asyncHandler(
  async (req: Request, res: Response) => {
    // get the the channel Id and user Id from poram and req.user
    const { channleId } = req.params;
    // chheck if the channel exists or not
    if (!channleId) {
      throw new ApiError(400, "Channel ID is required");
    }
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiError(401, "Unautorized request");
    }
    // get the info - name, handle, bio from req.body
    const { name, handle, bio } = req.body;
    // call the service
    const updatedChannel = await updateChannelInfoService(
      channleId,
      userId.toString(),
      {
        name,
        handle,
        bio,
      }
    );
    // give back the response to the client
    res
      .status(200)
      .json(
        new ApiResponse(200, "Channel updated Successfully", updatedChannel)
      );
  }
);

// Update Channel Avatar
export const updateAvatar = asyncHandler(
  async (req: Request, res: Response) => {
    // get the channel id, user id and filepath
    const { channelId } = req.params;
    // check if the channel and user exists or not
    if (!channelId) {
      throw new ApiError(400, "Channel ID is required");
    }

    const userId = req.user?._id;
    if (!userId) {
      throw new ApiError(401, "Unauthorized request");
    }

    const filepath = req.file?.path;
    // check if fileapth exists or not
    if (!filepath) {
      throw new ApiError(400, "Avatar file is required");
    }
    // call the service
    const updatedAvatar = await updateAvatarService(
      channelId,
      userId.toString(),
      filepath
    );
    // give the response back to the client
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Channel & User avatar is updated successfully",
          updatedAvatar
        )
      );
  }
);

// Update Channel Cover Image
export const updateCoverImage = asyncHandler(
  async (req: Request, res: Response) => {
    // get the channel and user id
    const { channelId } = req.params;
    // check if the channel and user exists or not
    if (!channelId) {
      throw new ApiError(400, "Channel ID is required");
    }

    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized request");
    }
    // get the file from body
    const filepath = req.file?.path;
    // check if the file exists or not
    if (!filepath) {
      throw new ApiError(400, "Avatar file is missing");
    }
    // call the service
    const updatedCoverImage = await updateCoverImageService(
      channelId,
      userId.toString(),
      filepath
    );
    // give back the response to the client
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Channel cover image updated successfully",
          updatedCoverImage
        )
      );
  }
);
