import { Channel } from "../models/channel.model";
import { User } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import logger from "../utils/logger";

// Register User Types
interface RegisterUserPayload {
  username: string;
  fullName: string;
  email: string;
  password: string;
}

// Login User Types
interface LoginUserPayload {
  identifier: string;
  password: string;
}

interface RefreshTokenPayload {
  incomingRefreshToken: string;
}

// Register User service
// -------------------------
export const registerUserService = async ({
  username,
  fullName,
  email,
  password,
}: RegisterUserPayload) => {
  // This requires transaction cause if the either user creation or channel creation or both fails even the checks this whole process must rollback - that mena if one fails to exist then both can't exists
  // Added session of mongoose
  const session = await mongoose.startSession();

  try {
    // Added transaction
    session.startTransaction();
    // check if the user exists or not
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    }).session(session);

    if (existingUser) {
      throw new ApiError(409, "User already exists");
    }

    // if the user does not exists then create a new one
    const user = await new User({
      username,
      fullName,
      email,
      password,
      subscribers: 0,
    });

    // Saved user in session now cause needed user _id
    await user.save({ session });

    // create channel after creating the user
    const channel = await new Channel({
      owner: user._id,
      name: fullName,
      handle: username,
    });

    // same as user
    await channel.save({ session });

    // throw error if user registered but channel is not created successfully
    // NOTE: delete the user if channel is not created cause if user is created so channel must be created as well if channel creation failed then delete that user as well cause we don't want to save any user without channel
    // if (!channel) {
    //   await User.findByIdAndDelete(user._id);
    //   throw new ApiError(500, "Channel creation failed");
    // }

    // update the channel feild in user
    user.channel = channel._id;
    await user.save({ session, validateBeforeSave: false });

    // after saving the user with all the updated credential now commit the transaction and end the session
    await session.commitTransaction();
    session.endSession();

    // Return the user with out password and tokens
    const safeUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    return safeUser;
  } catch (error) {
    // if something goes wrong abort the transaction then end the session
    await session.abortTransaction();
    session.endSession();

    if (error instanceof ApiError) throw error;
    logger.error("registerUserService failed:", error);
    throw new ApiError(500, "Registration failed due to a server error");
  }
};

// Login User service
// -------------------------

export const loginUserService = async ({
  identifier,
  password,
}: LoginUserPayload) => {
  try {
    // first check if the user gave email or username
    const isEmail = identifier.includes("@");

    // check if the user exists or not
    const existingUser = await User.findOne(
      isEmail ? { email: identifier } : { username: identifier }
    );

    if (!existingUser) {
      throw new ApiError(409, "User does not exist");
    }
    // if the existing user exist then check if the password is valid or not
    const isPasswordValid = await existingUser.comparePassword(password);

    if (!isPasswordValid) {
      throw new ApiError(401, "Wrong Password!");
    }
    // generate access Token & refresh Token
    // NOTE: Token generation are always syncronous
    const accessToken = existingUser.generateAccessToken();
    const refreshToken = existingUser.generateRefreshToken();

    // update the refresh Token feild with newly generated one
    existingUser.refreshToken = refreshToken;
    await existingUser.save({ validateBeforeSave: false });

    // remove password and refresh token feilds for security
    const safeUser = await User.findById(existingUser._id).select(
      "-password -refreshToken"
    );

    return { user: safeUser, accessToken, refreshToken };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error("loginUserService failed:", error);
    throw new ApiError(500, "Login failed due to a server error");
  }
};

// Logout User
// --------------------
// 3. Add business logout inside service (Auth service) - it's only a business logic where we query data from DB
// - get user id from controller as param
// - then find the user and update refresh token to undefined
// - return true
export const logoutUserService = async (userId: string) => {
  try {
    // Get user by id
    const user = await User.findById(userId);
    // check if user exists or not
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // remove refresh token from user
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });

    return true;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error("logoutUserService failed:", error);
    throw new ApiError(500, "Logout failed due to a server error");
  }
};

// Refresh Token Rotaion - What goes inside service
// 1. get incoming refresh token from controller
// 2. verify if the incoming rfresh token is same as token saved in DB
// 3. after verify get the user from DB
// 4. check if the refresh token is used or expired
// 5. if the token is reused or expired then remove the refresh token from DB this makes user logout forcefully
// 6. after checking generate the new Access & refresh tokens
// 7. update refresh toke with the new one
// 8. return both tokens to the controller
export const tokenRotationService = async ({
  incomingRefreshToken,
}: RefreshTokenPayload) => {
  try {
    // Verify the incoming token with existing one
    const verifyToken = jwt.verify(
      incomingRefreshToken,
      Bun.env.REFRESH_TOKEN_SECRET!
    ) as { _id: string };

    // Get the user from DB
    const user = await User.findById(verifyToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token!");
    }

    // check if the incoming refresh token is same as saved in DB
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh Token is reused or expired");
    }

    // if refresh token is tampered then make user logout
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });

    // Generate new tokens
    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    // update refresh token with new one
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    // returning token to controller
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error("tokenRotationService failed:", error);
    throw new ApiError(401, "Invalid or expired refresh token");
  }
};
