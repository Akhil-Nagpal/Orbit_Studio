import type mongoose from "mongoose";
import { User } from "../models/user.model";
import { Channel } from "../models/channel.model";

export const authRepository = {
  // All finding methods
  // find user by email or username
  findByEmailOrUsername: (
    email: string,
    username: string,
    session?: mongoose.ClientSession
  ) =>
    User.findOne({ $or: [{ email }, { username }] }).session(session ?? null),

  // find user by identifier (email or username)
  findByIdentifier: (identifier: string, isEmail: boolean) =>
    User.findOne(isEmail ? { email: identifier } : { username: identifier }),

  // find user by Id
  findById: (userId: string) => User.findById(userId),

  // find the user safely
  findSafeUser: (userId: string) =>
    User.findById(userId).select("-password -refreshToken"),

  // create/register user
  createUser: (
    data: {
      username: string;
      fullName: string;
      email: string;
      password: string;
    },
    session: mongoose.ClientSession
  ) => {
    const user = new User({ ...data, subscribers: 0 });
    return user.save({ session });
  },

  // create channel at the same time of registration
  createChannel: (
    data: {
      owner: mongoose.Types.ObjectId;
      name: string;
      handle: string;
    },
    session: mongoose.ClientSession
  ) => {
    const channel = new Channel(data);
    return channel.save({ session });
  },

  // saving the reference of channel in user
  setChannelRef: (
    user: InstanceType<typeof User>,
    channelId: mongoose.Types.ObjectId,
    session: mongoose.ClientSession
  ) => {
    user.channel = channelId;
    return user.save({ session, validateBeforeSave: false });
  },

  // setting the refresh token
  setRefreshToken: (
    user: InstanceType<typeof User>, // added this because to let typescript know where user is coming from
    refreshToken: string | undefined
  ) => {
    user.refreshToken = refreshToken;
    return user.save({ validateBeforeSave: false });
  },
};
