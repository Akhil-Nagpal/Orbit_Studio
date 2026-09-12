import mongoose from "mongoose";
import { Playlist, PlaylistVisibility } from "../models/playlist.model";
import { Channel } from "../models/channel.model";
import { PlaylistVideo } from "../models/playlistVideo.model";
import { ApiError } from "../utils/apiError";
import { ChannelState } from "../constants";
import { invalidateCache } from "./redis.service";
import { playlistRepository } from "../repositories/playlist.repository";

interface UpdatePlaylistPayload {
  title: string;
  visibility: PlaylistVisibility;
  description?: string;
}

export const getSinglePlaylistService = async (
  playlistId: string,
  page: number,
  limit: number,
  userId?: string
) => {
  // get the playlist
  const playlist = await playlistRepository.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist Not Found");
  }
  // check ownership - through channel
  let isOwner = false;

  if (userId) {
    // find active channel
    const channel = await playlistRepository.findChannelByOwner(userId);

    isOwner =
      !!channel && playlist.channel.toString() === channel._id.toString();
  }

  // check visibility
  if (playlist.visibility === "PRIVATE" && !isOwner) {
    throw new ApiError(403, "Access Denied");
  }
  // calculate offset pagination
  const skip = (page - 1) * limit;

  // get every playlistVideo
  const [playlistVideos, totalPlaylistVideos]: [any[], number] = // [any[], number] is used to give type safety to totalPlaylistVideos cause it was showing undefined. NOTE: this solution is given by chatgpt and I don't know what the fuck is this "YET".
    // Note: Alright I do know now, this [any[], number] type safety is for heterogenous array de-structuring, it means this array contains multiple values which have multiple data types like (strings, objects, numbers, arrays, functions)
    await playlistRepository.findPlaylistVideo(playlistId, skip, limit);

  // calculate total videos and total pages
  const totalPages = Math.ceil(totalPlaylistVideos / limit);
  // return the response
  return {
    playlist: {
      _id: playlist._id,
      title: playlist.title,
      description: playlist.description,
      visibility: playlist.visibility,
      createdAt: playlist.createdAt,
    },
    videos: playlistVideos.map((pv) => pv.video), // extract videos from playlistVideos
    pagination: {
      page,
      limit,
      totalPlaylistVideos,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
    },
    isOwner,
  };
};

// Create Playlist
export const createPlaylistService = async (
  // get the data from user
  userId: string,
  title: string,
  description: string | undefined,
  visibility: PlaylistVisibility
) => {
  // find the active channel by owner
  const channel = await playlistRepository.findChannelByOwner(userId);

  // check if the channel exists or not
  if (!channel) {
    throw new ApiError(404, "Channel not Found");
  }
  // create the playlist
  const playlistCreated = await playlistRepository.createPlaylist({
    channel: channel._id,
    title,
    description,
    visibility,
  });

  // after creating the playlist, invalidate the cached data
  await invalidateCache(`channel-featured-content:${channel._id}`);

  // return the created Playlist
  return playlistCreated;
};

// add video to playlist
export const addVideoService = async (
  // get the id's
  playlistId: string,
  videoId: string,
  userId: string
) => {
  try {
    // get the channel
    const channel = await playlistRepository.findChannelByOwner(userId);
    // check if the channel exists or not
    if (!channel) {
      throw new ApiError(404, "Channel Not Found");
    }
    // get the playlist and update the video counter
    const playlist = await playlistRepository.incrementVideoCount(
      playlistId,
      channel._id
    );
    // check if the playlist exists or not
    if (!playlist) {
      throw new ApiError(404, "Playlist Not Found!");
    }
    // calculate the position of video
    const position = playlist.videoCount;
    // create the playlist video
    const addPlaylistVideo = await playlistRepository.createPlaylistVideo({
      playlist: playlistId,
      video: videoId,
      position,
    });

    // invalidate the cache when new video added for featured content in channel
    await invalidateCache(`channel-featured-content:${channel._id}`);

    // return the playlist video
    return addPlaylistVideo;
  } catch (error: any) {
    // check if the video is already there then update the video count and throw error
    if (error.code === 11000) {
      await playlistRepository.decrementVideoCount(playlistId);
      throw new ApiError(400, "Video already exists in playlist");
    }
    throw error;
  }
};

// Delete video from playlist
export const deleteVideoService = async (
  // get the id's
  playlistId: string,
  videoId: string,
  userId: string
) => {
  // get the channel
  const channel = await playlistRepository.findChannelByOwner(userId);
  // check if the channel exists or not
  if (!channel) {
    throw new ApiError(404, "Channel Not Found");
  }
  // find the playlist and check ownership
  const playlist = await playlistRepository.findPlaylistByChannel(
    playlistId,
    channel._id
  );
  // check if the playlist exists or not
  if (!playlist) {
    throw new ApiError(404, "Playlist Not Found!");
  }
  // Delete the video from playlist
  await playlistRepository.deletePlaylistVideo(playlistId, videoId);

  // decrement video count from playlist
  await playlistRepository.decrementVideoCount(playlistId);

  // after deleting the video, invalidate the cache
  await invalidateCache(`channel-featured-content:${channel._id}`);

  return;
};

// Update playlist
export const updatePlaylistService = async (
  // get the id's
  playlistId: string,
  userId: string,
  { title, visibility, description }: UpdatePlaylistPayload
) => {
  // get the channel
  const channel = await playlistRepository.findChannelByOwner(userId);
  // check if the channel exists or not
  if (!channel) {
    throw new ApiError(404, "Channel Not Found");
  }
  // find the playlist by id and check ownership
  const playlist = await Playlist.findOne({
    _id: playlistId,
    channel: channel._id,
  });

  if (!playlist) {
    throw new ApiError(404, "Playlist Not Found");
  }
  // update the fields
  if (title !== undefined) {
    playlist.title = title;
  }
  if (description !== undefined) {
    playlist.description = description;
  }
  if (visibility !== undefined) {
    playlist.visibility = visibility;
  }

  // save the playlist after updation
  await playlist.save({ validateBeforeSave: false });

  // after updating playlist, invalidate the cache
  await invalidateCache(`channel-featured-content:${channel._id}`);

  // return the updated playlist
  return playlist;
};

// Delete Playlist
export const deletePlaylistService = async (
  // get the id's
  playlistId: string,
  userId: string
) => {
  // start session and transaction
  const session = await mongoose.startSession();
  try {
    // add transaction
    session.startTransaction();
    // get the channel
    const channel = await Channel.findOne({
      owner: userId,
      status: ChannelState.ACTIVE,
    });
    // check if the channel exists or not
    if (!channel) {
      throw new ApiError(404, "Channel Not Found");
    }
    // find the playlist and check ownership
    const playlist = await Playlist.findOne({
      _id: playlistId,
      channel: channel._id,
    }).session(session);
    // check if playlist exists or not
    if (!playlist) {
      throw new ApiError(404, "Playlist Not Found");
    }
    // delete all the playlist videos first cause it's a child
    if (playlist) {
      await PlaylistVideo.deleteMany({ playlist: playlistId }).session(session);
    }
    // delete the Playlist
    await Playlist.deleteOne({ _id: playlistId }).session(session);
    // end session and transaction
    await session.commitTransaction();

    session.endSession();

    // after deleting the playlist, invalidate the cache
    await invalidateCache(`channel-featured-content:${channel._id}`);
  } catch (error) {
    // if something breaks abort and end session
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
