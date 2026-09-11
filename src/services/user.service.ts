import mongoose from "mongoose";
import { User } from "../models/user.model";
import { WatchHistory } from "../models/watchHistory.model";
import { ApiError } from "../utils/apiError";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary";
import { Channel } from "../models/channel.model";
import { Video } from "../models/video.model";
import { Like } from "../models/like.model";
import { Comment } from "../models/comment.model";
import { View } from "../models/view.model";
import { Subscription } from "../models/subscription.model";
import { getCached, invalidateCache, setCached } from "./redis.service";
import { userRepository } from "../repositories/user.repository";

// Interface for Updating User
interface updateUserPayload {
  fullName: string;
  username: string;
  bio: string;
}

// Interface for Changing Password
interface ChangePassword {
  oldPassword: string;
  newPassword: string;
}

// Get Current User Service
export const getCurrentUserService = async (userId: string) => {
  try {
    // check for redis cache first
    const cachedUserProfile = await getCached(`user-profile:${userId}`);
    // check if the cache exists or not if not then query to DB
    if (cachedUserProfile) {
      return cachedUserProfile;
    }
    // get the user from db and sanitize it
    const user = await userRepository.findSafeUser(userId);
    // check if user exists or not
    if (!user) {
      throw new ApiError(401, "User does not exist");
    }
    // set the data to redis if redis cache miss
    await setCached(`user-profile:${userId}`, user, 300);
    // return the user
    return user;
  } catch (error) {
    throw error;
  }
};

// Update the user profile Service
export const updateUserService = async (
  userId: string,
  { fullName, username, bio }: updateUserPayload // Accept user ID and all the fields
) => {
  try {
    // Check the uniqueness of username
    if (username) {
      const existingUser = await userRepository.findByIdExcludingSelf(
        userId,
        username
      );

      // if the user exist with same username then throw error
      if (existingUser) {
        throw new ApiError(409, "Username already taken");
      }
    }

    // Find & Update user in DB with sanitization
    // NOTE: "omitUndefined is a method of mongoose which remove all the fields strictly have the value of undefined
    const updatedUser = await userRepository.updateUser(userId, {
      fullName,
      username,
      bio,
    });

    // after updating the profile invalidate the cache
    await invalidateCache(`user-profile:${userId}`);

    // Return the sanitized user
    return updatedUser;
  } catch (error) {
    throw error;
  }
};

// Change password Service
export const changePasswordService = async (
  // Accept the userID and payload from controller as param
  userId: string,
  { oldPassword, newPassword }: ChangePassword
) => {
  // Get the user from DB
  const user = await userRepository.findById(userId);
  // Check if user exists or not
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  // compare current password with the stored one
  const isMatch = await user.comparePassword(oldPassword);
  // check if the old password is same as stored in db or not
  if (!isMatch) {
    throw new ApiError(400, "Old password is incorrect!");
  }
  // prevent same password issue old and new must not the same
  if (oldPassword === newPassword) {
    throw new ApiError(400, "New password must be different!");
  }
  // update password
  // invalidate sessions
  // save the user
  await userRepository.setChangePassword(user, newPassword);

  // nothing to return
};

// Delete User Service
export const deleteUserService = async (userId: string) => {
  // Add Transaction for consistent data deletion
  // Start Session
  const session = await mongoose.startSession();

  try {
    // start transaction
    session.startTransaction();
    // get the user from DB
    const user = await userRepository.findByIdWithSession(userId, session);

    // check if the user exists or not
    if (!user) {
      throw new ApiError(401, "User does not exist");
    }

    // get the channel from DB
    const channel = await userRepository.findChannelByOwner(userId, session);
    // if channel exists get all the channel video Id's
    if (channel) {
      const videoIds = await userRepository.findChannelVideosIds(
        channel._id,
        session
      );
      // NOTE: Distinct is the method which is used to extract the value in array, it is same as select but select gives array of object but distinct gives array of values directly
      // after fetching all the videos delete all the views, likes, comment, subscriptions, videos as well etc
      await userRepository.deleteChannelVideosData(
        channel._id,
        videoIds,
        session
      );
      // after deleting the channel data delete the cloud assets like avatar & cover image
      if (channel?.avatar?.publicId) {
        await deleteFromCloudinary(channel.avatar.publicId);
      }
      if (channel?.coverImage?.publicId) {
        await deleteFromCloudinary(channel.coverImage.publicId);
      }
      // delete the channel
      await userRepository.deleteChannelById(channel._id, session);
    }
    // then delete all the data related to user likes, comments, views, subscription
    await userRepository.deleteUserData(user._id, session);
    // then delete the user
    await userRepository.deleteUserById(userId, session);
    // commit transaction
    await session.commitTransaction();
    session.endSession();

    // after deleting everything and transaction being successful, delete the redis cache
    await invalidateCache(`user-profile:${userId}`);
  } catch (error) {
    // if something fails abort the transaction and rollback
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Watch History Service
// get watch history
export const getWatchHistoryService = async (
  // get the userId and query params
  userId: string,
  page: number,
  limit: number
) => {
  // calculating offset pagination
  const skip = (page - 1) * limit;

  // get all the watch history
  const [watchHistory, totalVideos] = await userRepository.findWatchHistory(
    userId,
    skip,
    limit
  );

  // calculate total pages
  const totalPages = Math.ceil(totalVideos / limit);

  // return the response
  return {
    watchHistory,
    pagination: {
      page,
      limit,
      totalVideos,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
    },
  };
};

// Update Watch History
export const updateWatchHistoryService = async (
  // get the user & video id's
  userId: string,
  videoId: string
) => {
  // update history
  const updateHistory = await userRepository.updateWatchHistory(
    userId,
    videoId
  );
  // return the updated history
  return updateHistory;
};

// Delete the video from watch history
export const deleteWatchHistoryVideoService = async (
  // get the user & video Id
  userId: string,
  videoId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  // delete the video from DB
  const deleteVideo = await userRepository.deleteWatchHistory(userId, videoId);

  // check if the delete video not exist then throw error
  if (!deleteVideo) {
    throw new ApiError(404, "Watch History not found");
  }
  // return the response
  return deleteVideo;
};
