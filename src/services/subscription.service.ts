import { Types } from "mongoose";
import { Subscription } from "../models/subscription.model";
import { ApiError } from "../utils/apiError";
import { Channel } from "../models/channel.model";
import { invalidateCache } from "./redis.service";

// Subscribe Service
export const subscribeService = async (
  // get both the ID's as params
  subscriberId: string,
  channelId: string
): Promise<void> => {
  // get the channel
  const channel = await Channel.findById(channelId);

  // check if the channel exists or not
  if (!channel) {
    throw new ApiError(404, "Channel Not Found!");
  }

  // check if the user subscribed to itself
  if (subscriberId === channel.owner.toString()) {
    throw new ApiError(400, "You cannot subscribe to yourself");
  }
  try {
    // create subscriber and chennel relationship
    await Subscription.create({
      subscriber: new Types.ObjectId(subscriberId),
      channel: new Types.ObjectId(channelId),
    });
    // update subscriber count after subscribtion relationship is successfull
    await Channel.updateOne(
      { _id: channelId },
      {
        $inc: {
          subscriberCount: 1,
        },
      }
    );

    // after subscribing, invalidate channel cache
    await invalidateCache(`channel-profile:${channelId}`);
  } catch (error: any) {
    // Check if the user already subscribed to channel or not
    // NOTE: 11000 error code is MongoDB duplication key error code
    if (error.code === 11000) {
      throw new ApiError(409, "Already subscribed");
    }
    throw error;
  }
};

// Unsubscribe Service
export const unsubscribeService = async (
  subscriberId: string,
  channelId: string
): Promise<void> => {
  try {
    // find the user and delete the relationship
    const result = await Subscription.findOneAndDelete({
      subscriber: subscriberId,
      channel: channelId,
    });

    //   check if the relationship exists or not
    if (!result) {
      throw new ApiError(404, "Subscription Not Found");
    }

    // update subscriber count after Unsubscription realtionship is successfull
    await Channel.updateOne(
      { _id: channelId },
      {
        $inc: {
          subscriberCount: -1,
        },
      }
    );

    // after unsubscribing, invalidate channel cache
    await invalidateCache(`channel-profile:${channelId}`);
  } catch (error) {
    throw error;
  }
};
