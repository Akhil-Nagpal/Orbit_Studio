import type { NextFunction, Request, Response } from "express";
import { Channel } from "../models/channel.model";
import { ApiError } from "../utils/apiError";
import { ChannelState } from "../constants";

export const checkChannelState = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  // get userId from req.user
  const userId = req.user?._id;
  // check if the user logged in or not, if not jump to next
  if (!userId) return next();
  // find the channel be userId and select the state
  const channel = await Channel.findOne({ owner: userId }).select("status");
  // check if channel exists or not
  if (!channel) {
    throw new ApiError(401, "Channel not found");
  }
  // check if the channel state is active or not, if not throw error channel is suspended
  if (channel.status !== ChannelState.ACTIVE) {
    throw new ApiError(403, "Channel is suspended");
  }
  // pass to the next
  next();
};
