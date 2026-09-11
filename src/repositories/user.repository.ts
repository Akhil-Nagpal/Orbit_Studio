import type mongoose from "mongoose";
import { User } from "../models/user.model";
import { Channel } from "../models/channel.model";
import { Video } from "../models/video.model";
import { Like } from "../models/like.model";
import { Comment } from "../models/comment.model";
import { View } from "../models/view.model";
import { Subscription } from "../models/subscription.model";
import { WatchHistory } from "../models/watchHistory.model";

export const userRepository = {
  // fetch user safely
  findSafeUser: (userId: string) =>
    User.findById(userId).select("-password -refreshToken"),

  // find user by username but exclude current user
  findByIdExcludingSelf: (userId: string, username: string) =>
    User.findOne({ username, _id: { $ne: userId } }),

  // find user by Id
  findById: (userId: string) => User.findById(userId),

  //   update the user
  updateUser: (
    userId: string,
    updates: { fullName?: string; username?: string; bio?: string }
  ) =>
    User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
      omitUndefined: true,
    }).select("-password -refreshToken"),

  // change password
  setChangePassword: (user: InstanceType<typeof User>, password: string) => {
    user.password = password;
    user.refreshToken = undefined;
    return user.save();
  },

  //   find user by id with sessions
  findByIdWithSession: (userId: string, session: mongoose.ClientSession) =>
    User.findById(userId).session(session),

  //   find channel with session
  findChannelByOwner: (userId: string, session: mongoose.ClientSession) =>
    Channel.findOne({ owner: userId }).session(session),

  //   find all channel Videos by Id
  findChannelVideosIds: (
    channelId: mongoose.Types.ObjectId,
    session: mongoose.ClientSession
  ) => Video.find({ channel: channelId }).session(session).distinct("_id"),

  //  delete channel video data (likes, comments, etc)
  deleteChannelVideosData: (
    channelId: mongoose.Types.ObjectId,
    videoIds: mongoose.Types.ObjectId[],
    session: mongoose.ClientSession
  ) =>
    Promise.all([
      Like.deleteMany({ video: { $in: videoIds } }).session(session),
      Comment.deleteMany({ video: { $in: videoIds } }).session(session),
      View.deleteMany({ video: { $in: videoIds } }).session(session),
      Subscription.deleteMany({ channel: channelId }).session(session),
      Video.deleteMany({ _id: { $in: videoIds } }).session(session),
    ]),

  //   delete channel By Id
  deleteChannelById: (
    channelId: mongoose.Types.ObjectId,
    session: mongoose.ClientSession
  ) => Channel.deleteOne({ _id: channelId }).session(session),

  //   delete all user data
  deleteUserData: (
    userId: mongoose.Types.ObjectId,
    session: mongoose.ClientSession
  ) =>
    Promise.all([
      Like.deleteMany({ user: userId }).session(session),
      View.deleteMany({ user: userId }).session(session),
      Comment.deleteMany({ user: userId }).session(session),
      Subscription.deleteMany({ subscriber: userId }).session(session),
    ]),

  //   delete User By Id
  deleteUserById: (userId: string, session: mongoose.ClientSession) =>
    User.deleteOne({ _id: userId }).session(session),

  // get all Watch history
  findWatchHistory: (userId: string, skip: number, limit: number) =>
    Promise.all([
      WatchHistory.find({ user: userId })
        .sort({ watchedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate("video"),

      WatchHistory.countDocuments({ user: userId }),
    ]),

  //   update watch history
  updateWatchHistory: (userId: string, videoId: string) =>
    WatchHistory.findOneAndUpdate(
      { user: userId, video: videoId },
      { watchedAt: new Date() },
      { upsert: true, new: true }
    ),

  // delete watch history
  deleteWatchHistory: (userId: string, videoId: string) =>
    WatchHistory.findOneAndDelete({
      user: userId,
      video: videoId,
    }),
};
