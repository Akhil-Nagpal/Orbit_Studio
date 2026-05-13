import mongoose from "mongoose";
import { ChannelState } from "../constants";

interface CloudinaryFiles {
  url?: string;
  publicId?: string;
}

export interface IChannel {
  owner: mongoose.Types.ObjectId;
  name: string;
  handle: string;
  bio: string;
  avatar: CloudinaryFiles;
  coverImage: CloudinaryFiles;
  subscriberCount: number;
  status: ChannelState;
}

const channelSchema = new mongoose.Schema<IChannel>(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    handle: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    bio: {
      type: String,
      maxlength: 2000,
      default: "",
    },
    avatar: {
      url: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    coverImage: {
      url: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    subscriberCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(ChannelState),
      default: ChannelState.ACTIVE,
    },
  },
  { timestamps: true }
);

channelSchema.index({ owner: 1 });
channelSchema.index({ status: 1 });

export const Channel = mongoose.model<IChannel>("Channel", channelSchema);
