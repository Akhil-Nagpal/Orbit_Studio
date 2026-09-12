import type mongoose from "mongoose";
import { Playlist, PlaylistVisibility } from "../models/playlist.model";
import { PlaylistVideo } from "../models/playlistVideo.model";
import { ChannelState } from "../constants";
import { Channel } from "../models/channel.model";

export const playlistRepository = {
  // find playlist by id
  findById: (playlistId: string) => Playlist.findById(playlistId),

  findChannelByOwner: (userId: string) =>
    Channel.findOne({ owner: userId, status: ChannelState.ACTIVE }),

  // find playlist by channel
  findPlaylistByChannel: (
    playlistId: string,
    channelId: mongoose.Types.ObjectId
  ) =>
    Playlist.findOne({
      _id: playlistId,
      channel: channelId,
    }),

  //   find Playlist videos
  findPlaylistVideo: (playlistId: string, skip: number, limit: number) =>
    Promise.all([
      PlaylistVideo.find({ playlist: playlistId })
        .sort({ position: 1 })
        .skip(skip)
        .limit(limit)
        .populate("video"),

      PlaylistVideo.countDocuments({ playlist: playlistId }),
    ]),

  // find playlist with session
  findPlaylistWithSession: (
    playlistId: string,
    channelId: mongoose.Types.ObjectId,
    session: mongoose.ClientSession
  ) =>
    Playlist.findOne({
      _id: playlistId,
      channel: channelId,
    }).session(session),

  // create playlist
  createPlaylist: (data: {
    channel: mongoose.Types.ObjectId;
    title: string;
    description: string | undefined;
    visibility: PlaylistVisibility;
  }) => Playlist.create(data),

  // increment video count in playlist
  incrementVideoCount: (
    playlistId: string,
    channelId: mongoose.Types.ObjectId
  ) =>
    Playlist.findOneAndUpdate(
      { _id: playlistId, channel: channelId },
      { $inc: { videoCount: 1 } },
      { new: true }
    ),

  // decrement video count
  decrementVideoCount: (playlistId: string) =>
    Playlist.findByIdAndUpdate(playlistId, {
      $inc: { videoCount: -1 },
    }),

  // create Video inside playlist
  createPlaylistVideo: (data: {
    playlist: string;
    video: string;
    position: number;
  }) => PlaylistVideo.create(data),

  // delete video from playlist
  deletePlaylistVideo: (playlistId: string, videoId: string) =>
    PlaylistVideo.deleteOne({
      playlist: playlistId,
      video: videoId,
    }),

  // update Playlist
  updatePlaylist: (
    playlist: InstanceType<typeof Playlist>,
    updates: {
      title: string;
      description?: string;
      visibility: PlaylistVisibility;
    }
  ) => {
    playlist.title = updates.title;
    playlist.visibility = updates.visibility;
    if (updates.description !== undefined) {
      playlist.description = updates.description;
    }
    return playlist.save({ validateBeforeSave: false });
  },

  // delete playlist videos
  deleteAllPlaylistVideos: (
    playlistId: string,
    session: mongoose.ClientSession
  ) => PlaylistVideo.deleteMany({ playlist: playlistId }).session(session),

  // delete playlist itself
  deletePlaylist: (playlistId: string, session: mongoose.ClientSession) =>
    Playlist.deleteOne({ _id: playlistId }).session(session),
};
