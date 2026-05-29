import mongoose, { Document } from "mongoose";
import { PlaylistState } from "../constants";

export enum PlaylistVisibility {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}
export interface IPlaylist extends Document {
  title: string;
  description?: string;
  channel: mongoose.Types.ObjectId;
  videoCount: number;
  status: PlaylistState;
  visibility: PlaylistVisibility;
  createdAt: Date;
  updatedAt: Date;
}

const playlistSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 120,
      trim: true,
    },

    description: {
      type: String,
      maxlength: 2000,
      default: "",
      trim: true,
    },

    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
    },
    videoCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    visibility: {
      type: String,
      enum: Object.values(PlaylistVisibility),
      default: PlaylistVisibility.PUBLIC,
    },
    status: {
      type: String,
      enum: Object.values(PlaylistState),
      default: PlaylistState.ACTIVE,
    },
  },
  { timestamps: true }
);

// Indexes
playlistSchema.index({ channel: 1, visibility: 1 });
playlistSchema.index({ channel: 1, createdAt: -1 });

export const Playlist = mongoose.model("Playlist", playlistSchema);
