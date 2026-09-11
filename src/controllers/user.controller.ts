import {
  getCurrentUserService,
  updateUserService,
  changePasswordService,
  deleteUserService,
  getWatchHistoryService,
  updateWatchHistoryService,
  deleteWatchHistoryVideoService,
} from "../services/user.service";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import type { Request, Response } from "express";

// Get Current User
export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    // check before fetching Id from req.user cause typescript shout about the type of userId
    if (!req.user) {
      throw new ApiError(401, "Unauthorized user");
    }
    // get the user from req user
    const userId = req.user?._id;
    // Call the service to get the user
    const user = await getCurrentUserService(userId.toString());
    // return the response
    res
      .status(201)
      .json(new ApiResponse(201, "User Fetched Successfully", user));
  }
);

// Update User Profile
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  // check if the user exist or not in req.user
  if (!req.user) {
    throw new ApiError(401, "User not authorized");
  }
  // Get the user from req.user
  const userId = req.user?._id;
  // Get all the data from user
  const { fullName, username, bio } = req.body;
  // Check if all the fields are available or not
  if (!fullName && !username && !bio) {
    throw new ApiError(400, "One field is must");
  }
  // Call the service with user ID + all the fields
  const updatedUser = await updateUserService(userId?.toString(), {
    fullName,
    username,
    bio,
  });
  // Send response back to the client
  res
    .status(200)
    .json(
      new ApiResponse(200, "User profile updated successfully!", updatedUser)
    );
});

// Change Password
export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    // get userId from req.user
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "User not authorized");
    }
    // get old and new password from the user in req.body
    const { oldPassword, newPassword } = req.body;

    // validate both inputs exists or not
    if (!oldPassword || !newPassword) {
      throw new ApiError(400, "All Fields are required!");
    }

    // call the service
    await changePasswordService(userId.toString(), {
      oldPassword,
      newPassword,
    });
    // give back the response to the client
    res
      .status(200)
      .clearCookie("accessToken", {
        httpOnly: true,
        sameSite: "strict",
        secure: true,
      })
      // cleared Refresh Token
      .clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "strict",
      })
      .json(
        new ApiResponse(
          200,
          "Password Changed Successfully!, Please log-in again",
          null
        )
      );
  }
);

// Delete user
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  // get the userId from req.suer
  const userId = req.user?._id;
  // check if user Id exists or not
  if (!userId) {
    throw new ApiError(401, "User is not authorized!");
  }
  // call service
  await deleteUserService(userId.toString());
  // give response back to the client
  res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, "User Deleted Successfully!", null));
});

// Watch History Controller
// Get Watch History
export const getWatchHistory = asyncHandler(
  async (req: Request, res: Response) => {
    // get the user id
    const userId = req.user?._id;
    // check if the user exists or not
    if (!userId) {
      throw new ApiError(400, "Unauthorized Request");
    }
    // get the page and limit params
    const { page, limit } = req.query;
    // call the service
    const watchHistory = await getWatchHistoryService(
      userId.toString(),
      Number(page),
      Number(limit)
    );
    // give back the response to the
    res
      .status(200)
      .json(
        new ApiResponse(200, "watch history fetched successfully", watchHistory)
      );
  }
);

// Update Watch History
export const updateWatchHistory = asyncHandler(
  async (req: Request, res: Response) => {
    // get the user Id and video Id
    const userId = req.user?._id;

    const { videoId } = req.params;
    // check user and video exists or not
    if (!userId) {
      throw new ApiError(400, "Unauthorized Request");
    }
    if (!videoId) {
      throw new ApiError(404, "Video ID is required");
    }
    // call the service
    const updatedHistory = await updateWatchHistoryService(
      userId.toString(),
      videoId
    );
    // give back the response to the client
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Watch History updated Successfully",
          updatedHistory
        )
      );
  }
);

// Delete videos from watch history
export const deleteWatchHistoryVideo = asyncHandler(
  async (req: Request, res: Response) => {
    // get the userId and check if the request is authorized or not
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized Request");
    }
    // get the videoId and check if the video Is is present or not
    const { videoId } = req.params;

    if (!videoId) {
      throw new ApiError(403, "Video ID is required");
    }
    // call the service
    const deletedVideo = await deleteWatchHistoryVideoService(
      userId.toString(),
      videoId
    );
    // give back the response to the client
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Video deleted successfully from watch history",
          deletedVideo
        )
      );
  }
);
