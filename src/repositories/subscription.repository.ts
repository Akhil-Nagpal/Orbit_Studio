import { Types } from "mongoose";
import { Subscription } from "../models/subscription.model";
import { Channel } from "../models/channel.model";

export const subscriptionRepository = {
  // create subscription
  createSubscription: (subscriberId: string, channelId: string) =>
    Subscription.create({
      subscriber: new Types.ObjectId(subscriberId),
      channel: new Types.ObjectId(channelId),
    }),

  // delete/remove subscription
  deleteSubscription: (subscriberId: string, channelId: string) =>
    Subscription.findOneAndDelete({
      subscriber: subscriberId,
      channel: channelId,
    }),

  adjustSubscriberCount: (channelId: string, count: 1 | -1) =>
    Channel.updateOne(
      { _id: channelId },
      {
        $inc: {
          subscriberCount: count,
        },
      }
    ),
};
