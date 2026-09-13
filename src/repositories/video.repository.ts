import { Types } from "mongoose";
import { VideoState } from "../constants";
import { Video, VideoVisibility } from "../models/video.model";
import { View } from "../models/view.model";
import { Like } from "../models/like.model";
import { Comment } from "../models/comment.model";

interface ChannelProfile {
  _id: string;
  name: string;
  avatar: string;
  subscriberCount: number;
}

export const videoRepository = {
  // fetch the feed
  findFeed: (skip: number, limit: number) => {
    // create filter to find the relevant and available videos
    const filter: { visibility: VideoVisibility; status: VideoState } = {
      visibility: VideoVisibility.PUBLIC,
      status: VideoState.READY,
    };
    // fetch all videos using promise.all with pagination and latest videos first
    return Promise.all([
      Video.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .select("title thumbnail duration views createdAt channel")
        .populate({
          path: "channel",
          select: "name avatar",
        }),

      // Calculate Total Videos
      Video.countDocuments(filter),
    ]);
  },

  //   find the video which is ready and visible and populate channel info with it
  findVideoWithChannelInfo: (videoId: string) =>
    Video.findOne({
      _id: new Types.ObjectId(videoId),
      visibility: VideoVisibility.PUBLIC,
      status: VideoState.READY,
    })
      .select(
        "videoFile title description thumbnail duration tags views likesCount commentsCount channel"
      )
      .populate<{ channel: ChannelProfile }>({
        path: "channel",
        select: "name avatar subscriberCount",
      }),

  //   create video record for uploading
  createVideo: (data: {
    channel: string;
    videoFile: { url: string; publicId: string };
    duration: number;
    title: string;
    description: string;
    category: string;
    tags: string[];
    visibility: VideoVisibility;
    views: number;
    likesCount: number;
    commentsCount: number;
  }) => Video.create(data),

  //   find video by channel
  findVideoByChannel: (videoId: string, channelId: string) =>
    Video.findOne({ _id: videoId, channel: channelId }),

  //   update video metadata
  updateVideoMetadata: (
    video: InstanceType<typeof Video>,
    updates: {
      title: string;
      description: string;
      category: string;
      tags: string[];
      playlist: Types.ObjectId;
      visibility: VideoVisibility;
    }
  ) => {
    video.title = updates.title;
    video.description = updates.description;
    video.category = updates.category;
    video.tags = updates.tags;
    video.playlist = updates.playlist;
    video.visibility = updates.visibility;

    return video.save({ validateBeforeSave: false });
  },

  // find the video os already watched or not
  findExistingView: (viewerKey: string, videoId: string) =>
    View.findOne({ viewerKey, video: videoId }),

  // add the view if its not already counted
  createView: (videoId: string, viewerKey: string, lastCountedAt: Date) =>
    View.create({ video: videoId, viewerKey, lastCountedAt }),

  // increment view on Video
  incrementView: (videoId: string) =>
    Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } }),

  // update view if the time window is over
  updateViewTimestamp: (
    view: InstanceType<typeof View>,
    lastCountedAt: Date
  ) => {
    view.lastCountedAt = lastCountedAt;
    return view.save({ validateBeforeSave: false });
  },

  //   check if the user already gave the like or not
  findLike: (userId: string, videoId: string) =>
    Like.findOne({ user: userId, video: videoId }).lean(),

  // delete Like
  deleteLike: (likeId: string) => Like.deleteOne({ _id: likeId }),

  // create like
  createLike: (userId: string, videoId: string) =>
    Like.create({ user: userId, video: videoId }),

  //   toggle like count
  adjustLikeCount: (videoId: string, count: 1 | -1) =>
    Video.findByIdAndUpdate(
      videoId,
      { $inc: { likesCount: count } },
      { new: true }
    ).select("likesCount"),

  // find all the comments from a video
  findVideoComments: (videoId: string, skip: number, limit: number) =>
    Promise.all([
      Comment.find({ video: videoId })
        .populate("user", "username avatar")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit),

      Comment.countDocuments({ video: videoId }),
    ]),

  // find video by Id
  findVideoById: (videoId: string) => Video.findById(videoId).select("_id"),

  //   create single comment
  createComment: (videoId: string, userId: string, content: string) =>
    Comment.create({
      user: userId,
      video: videoId,
      content,
    }),

  // increment comment count
  incrementCommentCount: (videoId: string) =>
    Video.findByIdAndUpdate(videoId, { $inc: { commentsCount: 1 } }),

  // find comment by Id
  findCommentById: (commentId: string) => Comment.findById(commentId),

  //   update comment
  updateComment: (comment: InstanceType<typeof Comment>, content: string) => {
    comment.content = content;
    return comment.save({ validateBeforeSave: false });
  },

  //   delete comment
  deleteComment: (commentId: string, userId: string) =>
    Comment.findOneAndDelete({
      _id: commentId,
      user: userId,
    }),

  //   decrement comment count
  decrementCommentCount: (videoId: Types.ObjectId) =>
    Video.updateOne(
      { _id: videoId, commentsCount: { $gt: 0 } },
      { $inc: { commentsCount: -1 } }
    ),

  // find video by tags and category
  findByTagsAndCategory: (videoId: string) =>
    Video.findById(videoId).select("tags category").lean(),

  //   find the related videos excluding this video
  findRelatedVideos: (videoId: string, tags: string[], category: string) =>
    Video.find({
      _id: { $ne: videoId },
      $or: [{ tags: { $in: tags } }, { category: category }],
    })
      .sort({ views: -1 })
      .limit(20)
      .select("title thumbnail duration views channel createdAt"),
};
