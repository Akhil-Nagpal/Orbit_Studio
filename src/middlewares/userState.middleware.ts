import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { User } from "../models/user.model";
import { UserState } from "../constants";

export const checkUserState = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  // get the userId from req.user
  const userId = req.user?._id;
  // check if the user logged in or not, if not jump to next
  if (!userId) return next();
  // get the user and select user state from User
  const user = await User.findById(userId).select("state");
  // check if the user exist or not
  if (!user) {
    throw new ApiError(401, "User not found");
  }
  // check if the user state is active or not, if not throw error
  if (user.status !== UserState.ACTIVE) {
    throw new ApiError(403, "User is Banned");
  }
  // pass to the next
  next();
};
