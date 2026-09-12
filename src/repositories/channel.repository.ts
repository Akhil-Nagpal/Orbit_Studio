import mongoose from "mongoose";
import { Channel } from "../models/channel.model";
import { ChannelState, PlaylistState, VideoState } from "../constants";
import { Playlist, PlaylistVisibility } from "../models/playlist.model";
import { Video, VideoVisibility } from "../models/video.model";
import { Types } from "mongoose";
import type { User } from "../models/user.model";

export const channelRepository = {
  // find active channel by Id
  findActiveChannelById: (channelId: string) =>
    Channel.findOne({
      _id: new Types.ObjectId(channelId),
      status: ChannelState.ACTIVE,
    }),

  // find the channel by Id and name
  findActiveChannelByName: (channelId: string) =>
    Channel.findOne({
      _id: new Types.ObjectId(channelId),
      status: ChannelState.ACTIVE,
    }).select("name"),

  // find channel by owner
  findChannelByOwner: (channelId: string, userId: string) =>
    Channel.findOne({ _id: channelId, owner: userId }),

  // find channel from handle, if exists
  handleExists: (handle: string) => Channel.exists({ handle }),

  //   find channel by Id
  findById: (channelId: string) => Channel.findById(channelId),

  // get featured playlist for channel home page - playlist aggregation
  getFeaturedPlaylist: (
    channelObjectId: mongoose.Types.ObjectId,
    channelName: string
  ) =>
    Playlist.aggregate([
      // stage 1 - get the playlist of this channel only
      {
        $match: {
          channel: channelObjectId,
          status: PlaylistState.ACTIVE,
        },
      },
      {
        // stage 2 - get and sort the latest playlists
        $sort: {
          createdAt: -1,
        },
      },
      // stage 3 - limit the playlists to 5
      { $limit: 5 },
      // stage 4 - get the videos of all the playlists
      {
        $lookup: {
          from: "videos",
          let: { playlist: "$_id" },
          // create a sub pipeline
          pipeline: [
            {
              // stage 5 - get the videos of that single playlist, where visibility and status are Public and Active
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$playlist", "$$playlist"] },
                    { $eq: ["$visibility", VideoVisibility.PUBLIC] },
                    { $eq: ["$status", VideoState.READY] },
                  ],
                },
              },
            },
            {
              // stage 6 - add channel name to every video
              $addFields: {
                channel: {
                  _id: channelObjectId,
                  name: channelName,
                },
              },
            },
            // stage 7 - sort video to the newest first
            {
              $sort: { createdAt: -1 },
            },
            // stage 8 - limit the videos to 12 per playlist
            {
              $limit: 12,
            },
            // stage 9 - project the videos for response
            {
              $project: {
                title: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                channel: 1,
                createdAt: 1,
              },
            },
          ],
          as: "videos",
        },
      },
      // stage 10 - project the playlist for response
      {
        $project: {
          title: 1,
          videos: 1,
        },
      },
    ]),

  // find Videos in Channel
  findChannelVideos: (channelId: string, skip: number, limit: number) => {
    const filter: {
      channel: Types.ObjectId;
      visibility: VideoVisibility;
      status: VideoState;
    } = {
      channel: new Types.ObjectId(channelId),
      visibility: VideoVisibility.PUBLIC,
      status: VideoState.READY,
    };
    return Promise.all([
      Video.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .select("title thumbnail duration views createdAt"),

      // Calculate Total Videos
      Video.countDocuments(filter),
    ]);
  },

  //   find channel playlists
  findChannelPlaylist: (channelId: string, skip: number, limit: number) => {
    const filter: {
      channel: Types.ObjectId;
      visibility: PlaylistVisibility;
      status: PlaylistState;
    } = {
      channel: new Types.ObjectId(channelId),
      visibility: PlaylistVisibility.PUBLIC,
      status: PlaylistState.ACTIVE,
    };
    return Promise.all([
      Playlist.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .select("title description visibility thumbnail videoCount createdAt"),

      Playlist.countDocuments(filter),
    ]);
  },

  //   update channel Information
  updateChannelInfo: (
    channel: InstanceType<typeof Channel>,
    updates: { name?: string; handle?: string; bio?: string }
  ) => {
    if (updates.name !== undefined) channel.name = updates.name;
    if (updates.handle !== undefined) channel.handle = updates.handle;
    if (updates.bio !== undefined) channel.bio = updates.bio;
    return channel.save({ validateBeforeSave: false });
  },

  //   update Channel Avatar
  updateChannelAvatar: (
    channel: InstanceType<typeof Channel>,
    avatar: { url: string; publicId: string }
  ) => {
    channel.avatar = avatar;
    return channel.save({ validateBeforeSave: false });
  },

  //   sync channel avatar with user
  syncAvatarWithUser: (
    user: InstanceType<typeof User>,
    avatar: { url: string; publicId: string }
  ) => {
    user.avatar = avatar;
    return user.save({ validateBeforeSave: false });
  },

  //   update cover image of channel
  updateCoverImage: (
    channel: InstanceType<typeof Channel>,
    coverImage: { url: string; publicId: string }
  ) => {
    channel.coverImage = coverImage;
    return channel.save({ validateBeforeSave: false });
  },
};
