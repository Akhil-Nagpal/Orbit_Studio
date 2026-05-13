import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { VideoState } from "../constants";

export enum VideoVisibility {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
  UNLISTED = "UNLISTED",
}

interface CloudinaryFiles {
  url?: string;
  publicId?: string;
}

// interface must extends Document only when we need mongoose inbuild methods otherwise, No need of that
export interface IVideo {
  videoFile: CloudinaryFiles;
  title: string;
  description: string;
  thumbnail: CloudinaryFiles; // cloudinary url
  duration: number;
  category: string;
  tags: string[];
  views: number;
  likesCount: number;
  commentsCount: number;
  channel: mongoose.Types.ObjectId;
  playlist?: mongoose.Types.ObjectId;
  visibility: VideoVisibility;
  status: VideoState;
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new mongoose.Schema<IVideo>(
  {
    videoFile: {
      url: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    title: {
      type: String,
      minlenght: 5,
      maxlength: 250,
    },
    description: {
      type: String,
      minlength: 5,
      maxlength: 1000,
    },
    thumbnail: {
      url: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    duration: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
    },
    tags: [
      {
        type: String,
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
    },
    playlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Playlist",
      },
    ],
    visibility: {
      type: String,
      enum: Object.values(VideoVisibility),
      default: VideoVisibility.PUBLIC,
    },
    status: {
      type: String,
      enum: Object.values(VideoState),
      default: VideoState.PROCESSING,
    },
  },
  { timestamps: true }
);

// Indexes
videoSchema.index({
  channel: 1,
  visibility: 1,
  status: 1,
  createdAt: -1,
  _id: -1,
});
videoSchema.index({ "videoFile.publicId": 1 }, { unique: true });
videoSchema.index({ title: "text", description: "text", tags: "text" });

// Added a plugin of mongoose aggregate paginate version 2 for pagination
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model<IVideo>("Video", videoSchema);
