import mongoose, { Document } from "mongoose";

export interface IPlaylistVideo extends Document {
  playlist: mongoose.Types.ObjectId;
  video: mongoose.Types.ObjectId;
  position: number;
}

const playlistVideoSchema = new mongoose.Schema(
  {
    playlist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Playlist",
      required: true,
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },
    position: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
playlistVideoSchema.index({ playlist: 1, video: 1 }, { unique: true }); // No duplicates
playlistVideoSchema.index({ playlist: 1, position: 1 }); // For video pagination

export const PlaylistVideo = mongoose.model<IPlaylistVideo>(
  "PlaylistVideo",
  playlistVideoSchema
);
