import { Types } from "mongoose";
import { Channel } from "../models/channel.model";
import { ApiError } from "../utils/apiError";
import { Subscription } from "../models/subscription.model";
import { Playlist } from "../models/playlist.model";
import { User } from "../models/user.model";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary";
import { Video, VideoVisibility } from "../models/video.model";
import { ChannelState, VideoState } from "../constants";

// interface for update channel info
interface UpdateChannelInfoPayload {
  name: string;
  handle: string;
  bio: string;
}
interface ChannelProfileResult {
  channel: {
    id: string;
    name: string;
    handle: string;
    bio: string;
    avatar: string;
    coverImage: string;
    subscribersCount: number;
  };
  isSubscribed: boolean;
}
interface FeaturedPlaylistResult {
  featuredPlaylist: Array<{
    id: string;
    title: string;
    videos: Array<{
      _id: string;
      title: string;
      desription: string;
      thumbnail: string;
      duration: number;
      channel: {
        _id: string;
        name: string;
      };
      views: number;
      createdAt: Date;
    }>;
  }>;
}

// export const getChannelProfileService = async (
//   viewerId: string,
//   channelId: string
// ): Promise<ChannelProfileResult> => {
//   // get the channel and viewer Id and cover it to ObjectId
//   const channelObjectId = new Types.ObjectId(channelId);

//   const viewerObjectId = new Types.ObjectId(viewerId);
//   // fetch the channel
//   const channel = await Channel.findOne({
//     _id: channelObjectId,
//     status: "ACTIVE",
//   });
//   // check if the channel exist or not
//   if (!channel) {
//     throw new ApiError(404, "Channle not found");
//   }
//   // check if the viewer subscribed to this channel or not
//   let isSubscribed = false;

//   if (viewerObjectId) {
//     // NOTE: This !! is a Double Negation or Boolean casting. This does only 1 thing is to covert any value into a "strict boolean"
//     const subscriptionExists = !!(await Subscription.exists({
//       channel: channelObjectId,
//       subscriber: viewerObjectId,
//     }));

//     isSubscribed = subscriptionExists;
//   }
//   // add playlist with videos - Aggregation Pipeline
//   const featuredPlaylist = await Playlist.aggregate([
//     // Stage 1 - get the recent playlist from the channel, channel must be active
//     {
//       $match: {
//         channel: channelObjectId,
//         state: "ACTIVE",
//       },
//     },
//     // Stage 2 - sort Playlist by the lastest first
//     {
//       $sort: { createdAt: -1 },
//     },
//     // Stage 3 - get limited playlist
//     {
//       $limit: 5,
//     },
//     // Stage 4 - get all the videos from that single playlist
//     {
//       $lookup: {
//         from: "videos",
//         let: {
//           playlistId: "$_id",
//         },
//         // Stage 5 - create a subs pipeline to fetch videos
//         pipeline: [
//           {
//             // Stage 6 - get the videos from that selected playlist
//             $match: {
//               // Stage 7 - fetch the videos where Playlist, state and visibility are Active & Public
//               $expr: {
//                 $and: [
//                   { $eq: ["$playlist", "$$playlistId"] },
//                   { $eq: ["$visibility", "PUBLIC"] },
//                   { $eq: ["$state", "ACTIVE"] },
//                 ],
//               },
//             },
//           },
//           // Stage 8 - Add channel field to every video
//           {
//             $addFields: {
//               channel: {
//                 id: channel._id,
//                 name: channel.name,
//               },
//             },
//           },
//           // Stage 9 - sort them by the latest first
//           { $sort: { createdAt: -1 } },
//           // Stage 10 - limit videos by 12 per playlist
//           { $limit: 12 },
//           // Stage 11 - project videos for response
//           {
//             $project: {
//               title: 1,
//               thumbnail: 1,
//               duration: 1,
//               views: 1,
//               channel: 1,
//               createdAt: 1,
//             },
//           },
//         ],
//         as: "videos",
//       },
//     },
//     // Stage 12 - project playlist for response
//     {
//       $project: {
//         title: 1,
//         videos: 1,
//       },
//     },
//   ]);
//   // return the result
//   return {
//     channel: {
//       id: channel._id.toString(),
//       name: channel.name,
//       handle: channel.handle,
//       bio: channel.bio,
//       avatar: channel.avatar?.url ?? "",
//       coverImage: channel.coverImage?.url ?? "",
//       subscribersCount: channel.subscriberCount,
//     },
//     isSubscribed,
//     featuredPlaylist,
//   };
// };
// NOTE: This "??" operator is nullish coalescing operator - which means, If the left side is null or undefined, use the right side

export const getChannelInfoService = async (
  // get the channel Id and viewerId
  channelId: string,
  viewerId: string
): Promise<ChannelProfileResult> => {
  // find the channel with channel id and status must be active
  const channel = await Channel.findOne({
    _id: new Types.ObjectId(channelId),
    status: ChannelState.ACTIVE,
  });
  // check if the channel exists or not
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }
  // check if the viewer subscribed this channel or not
  let isSubscribed = false;

  if (viewerId) {
    const subscriptionExists = !!(await Subscription.exists({
      channel: channelId,
      subscriber: viewerId,
    }));

    isSubscribed = subscriptionExists;
  }
  // return the response
  return {
    channel: {
      id: channel._id.toString(),
      name: channel.name,
      handle: channel.handle,
      bio: channel.bio,
      avatar: channel.avatar?.url ?? "",
      coverImage: channel.coverImage?.url ?? "",
      subscribersCount: channel.subscriberCount,
    },
    isSubscribed,
  };
};

// Featured Content Service
export const getFeaturedContentService = async (
  channelId: string
): Promise<FeaturedPlaylistResult> => {
  // get the channel Id and convert it into Object Id
  const channelObjectId = new Types.ObjectId(channelId);
  // find the channel
  const channel = await Channel.findOne({
    _id: channelObjectId,
    status: ChannelState.ACTIVE,
  }).select("name");
  // check if the channel exists or not
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }
  // get the palyslist using aggregation pipeline
  const featuredPlaylist = await Playlist.aggregate([
    // stage 1 - get the playlist of this channel only
    {
      $match: {
        channel: channelObjectId,
        status: "ACTIVE",
      },
    },
    {
      // stage 2 - get and sort the latest playlists
      $sort: {
        createdAt: -1,
      },
    },
    // stage 3 - limit the playlists to 5
    { $limit: 5 },
    // stage 4 - get the videos of all the playlists
    {
      $lookup: {
        from: "videos",
        let: { playlist: "$_id" },
        // create a subpipline
        pipeline: [
          {
            // stage 5 - get the videos of that single playlist, where visibility and status are Public and Active
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$playlist", "$$playlist"] },
                  { $eq: ["$visibility", "PUBLIC"] },
                  { $eq: ["$status", "ACTIVE"] },
                ],
              },
            },
          },
          {
            // stage 6 - add channel name to evry video
            $addFields: {
              channel: {
                id: channel._id,
                name: channel.name,
              },
            },
          },
          // stage 7 - sort video to the newest first
          {
            $sort: { createdAt: -1 },
          },
          // stage 8 - limit the videos to 12 per playlist
          {
            $limit: 12,
          },
          // stage 9 - project the videos for response
          {
            $project: {
              title: 1,
              thumbnail: 1,
              duration: 1,
              views: 1,
              channel: 1,
              cretaedAt: 1,
            },
          },
        ],
        as: "videos",
      },
    },
    // stage 10 - project the plylist for response
    {
      $project: {
        title: 1,
        videos: 1,
      },
    },
  ]);
  // return featured playlist
  return {
    featuredPlaylist,
  };
};

// Get all the videos Service
export const getVideosService = async (
  channelId: string,
  page: number,
  limit: number
) => {
  // get the channel id and find the channel
  const channel = await Channel.findOne({
    _id: channelId,
    status: ChannelState.ACTIVE,
  });
  // check if the channel exists or not
  if (!channel) {
    throw new ApiError(404, "Channel Not Found");
  }
  // Calculate offset pagination
  const skip = (page - 1) * limit;
  // NOTE: understanding this formula with an example - let's say - page = 2 and limit = 12
  // so the formula is (2 - 1) * 12 = 12, So skip 12 videos and show next 12 videos

  // creating filter for finding videos
  const filter: {
    channel: Types.ObjectId;
    visibility: VideoVisibility;
    status: VideoState;
  } = {
    channel: new Types.ObjectId(channelId),
    visibility: VideoVisibility.PUBLIC,
    status: VideoState.READY,
  };

  // fetch videos using Promise.all
  const [videos, totalVideos] = await Promise.all([
    Video.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .select("title thumbnail duration views createdAt"),

    // Calculate Total Videos
    Video.countDocuments(filter),
  ]);

  // Calculate total pages
  const totalPages = Math.ceil(totalVideos / limit);

  // return the videos including pagination
  return {
    videos,
    pagination: {
      page,
      limit,
      totalVideos,
      totalPages,
      hasNextPage: page < totalPages,
    },
  };
};

// Get Channel Playlists
export const getPlaylistsService = async (
  channelId: string,
  page: number = 1,
  limit: number = 10
) => {
  // get the channel
  const channel = await Channel.findOne({
    _id: new Types.ObjectId(channelId),
    status: ChannelState.ACTIVE,
  });

  // check if the channel exists or not
  if (!channel) {
    throw new ApiError(404, "Channel Not Found!");
  }

  // Calculate offset pagination
  const skip = (page - 1) * limit;

  // creating filter for finding playlists
  const filter = {
    channel: new Types.ObjectId(channelId),
    visibility: "PUBLIC",
    status: "ACTIVE",
  };

  // Get all the playlists with visibility and status using Promise.all
  const [playlists, totalPlaylists] = await Promise.all([
    Playlist.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .select("title description visibility thumbnail videoCount createdAt"),

    Playlist.countDocuments(filter),
  ]);

  // Calculate Total Pages
  const totalPages = Math.ceil(totalPlaylists / limit);

  // return the playlists with pagination
  return {
    playlists,
    pagination: {
      page,
      limit,
      totalPlaylists,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
    },
  };
};

// Updatre Channel Info Service
export const updateChannelInfoService = async (
  channelId: string,
  userId: string,
  { name, handle, bio }: UpdateChannelInfoPayload
) => {
  // find the channel with ownership enforcement
  const channel = await Channel.findOne({ _id: channelId, owner: userId });
  // check if the channel exist or not
  if (!channel) {
    throw new ApiError(404, "Channel not found!");
  }
  // check if the handle is unique or not
  if (handle && handle !== channel.handle) {
    const handleExists = await Channel.exists({ handle });
    // check if the handle exists or not, if yes then throw error
    if (handleExists) {
      throw new ApiError(409, "Handle is already taken");
    }
  }
  // update the channel info
  if (name !== undefined) {
    channel.name = name;
  }
  if (handle !== undefined) {
    channel.handle = handle;
  }
  if (bio !== undefined) {
    channel.bio = bio;
  }
  // save updated info in DB
  await channel.save({ validateBeforeSave: false });
  // return updated fields
  return { name: channel.name, handle: channel.handle, bio: channel.bio };
};

// Update Avatar Service
export const updateAvatarService = async (
  channelId: string,
  userId: string,
  filepath: string
) => {
  // find the channel, user using channelId and userId
  const channel = await Channel.findById(channelId);
  if (!channel) {
    throw new ApiError(401, "Channel not found");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(401, "user not found");
  }
  // check the ownership of user with channel -> check channel.owner = user or not
  if (channel?.owner.toString() !== userId) {
    throw new ApiError(403, "Not allowed to update this channel");
  }
  // upload new avatar
  const uploadedAvatar = await uploadToCloudinary(filepath);
  // check if the avatar file uploaded or not
  if (
    !uploadedAvatar ||
    !uploadedAvatar.secure_url ||
    !uploadedAvatar.public_id
  ) {
    throw new ApiError(500, "Avatar uploaded failed");
  }
  // if uploading successfull delete the old avatar file
  if (channel.avatar.publicId) {
    await deleteFromCloudinary(channel.avatar.publicId);
  }
  // update the channel avatar and user avatar and save them to DB
  const newAvatar = {
    url: uploadedAvatar.secure_url,
    publicId: uploadedAvatar.public_id,
  };

  channel.avatar = newAvatar;
  user.avatar = newAvatar;

  // save the updated avatar in DB at once
  await Promise.all([
    channel.save({ validateBeforeSave: false }),
    user.save({ validateBeforeSave: false }),
  ]);
  // return the updated avatar
  return { url: newAvatar.url, publicId: newAvatar.publicId };
};

// Update Cover Image Service
export const updateCoverImageService = async (
  channelId: string,
  userId: string,
  filepath: string
) => {
  // get the channel id find the channel and user
  const channel = await Channel.findById(channelId);
  // check if the channel exists or not
  if (!channel) {
    throw new ApiError(401, "Channel not found");
  }

  // check if the current user is owner of the channel or not
  if (channel?.owner.toString() !== userId) {
    throw new ApiError(403, "Not allowed to change this channel");
  }

  // get the old cover image public id for deletion
  const oldCoverImage = channel?.coverImage.publicId;

  // upload the new cover image
  const uploadCoverImage = await uploadToCloudinary(filepath);
  // check if the cover image is uploaded or not
  if (
    !uploadCoverImage ||
    !uploadCoverImage.secure_url ||
    !uploadCoverImage.public_id
  ) {
    throw new ApiError(500, "Cover Image not uploaded");
  }
  // save the updated cover image credentials to the DB
  channel.coverImage = {
    url: uploadCoverImage.secure_url,
    publicId: uploadCoverImage.public_id,
  };
  await channel.save({ validateBeforeSave: false });
  // after saving, delete the old cover image
  if (oldCoverImage) {
    await deleteFromCloudinary(oldCoverImage);
  }
  // return the new credentials
  return {
    url: uploadCoverImage.secure_url,
    publicid: uploadCoverImage.public_id,
  };
};
