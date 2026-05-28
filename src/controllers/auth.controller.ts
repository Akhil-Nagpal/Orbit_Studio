// NOTE: inside controller only HTTP request logic comes no business logic, no routing, no databse
import {
  loginUserService,
  logoutUserService,
  registerUserService,
  tokenRotationService,
} from "../services/auth.service";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import type { Request, Response } from "express";

// Register User controller
// ------------------------------
export const registerUser = asyncHandler(
  async (req: Request, res: Response) => {
    // get the data from req.body
    const { username, fullName, email, password } = req.body;

    // check if all the fields are available or not
    // if (!username || !fullName || !email || !password) {
    //   throw new ApiError(400, "All feilds are required!");
    // }
    // Note: Zod validation is applied here, so no need for if else check

    // Call the service
    const user = await registerUserService({
      username,
      fullName,
      email,
      password,
    });

    // Controller sends the response
    res
      .status(201)
      .json(new ApiResponse(201, "User Registered Successfully", user));
  }
);

// Login User controller
// ------------------------------
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  // get data from user in req.body
  const { identifier, password } = req.body;

  // check if all the feilds are available or not
  // if (!identifier || !password) {
  //   throw new ApiError(404, "All feilds are required");
  // }
  // Note: Zod validation is applied here, so no need for if else check

  // Call the login service
  // what this does the controller sends the payload to serrvice then service do some checks and query to database then gets the data and then give that back to controller. So the controller sends the repsonse of the request that user asked
  const { user, accessToken, refreshToken } = await loginUserService({
    identifier,
    password,
  });
  // give the response including cookies
  res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      maxAge: Number(Bun.env.ACCESS_TOKEN_MAX_AGE),
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: Number(Bun.env.REFRESH_TOKEN_MAX_AGE),
    })
    .json(new ApiResponse(200, "Login successful", user));
});

// Logout user controller
// --------------------------
// 2. Add logoutUser method to controller (Controller) - it's a HTTP request logic only
// - get the user through req cause user is now called from req
// - call the service with user id
// remove the cokkies
export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  // check if user id exists or not - This step is neccessarily cause typscript thinks userId is possibily undefined
  if (!req.user) {
    throw new ApiError(401, "User not authorized");
  }
  // get user Id from req
  const userId = req.user._id;
  // Call Service
  await logoutUserService(userId.toString());

  // clear cookies
  res
    // cleared Access Token
    .clearCookie("accessToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    })
    // cleared Refresh Token
    .clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    })
    .status(201)
    .json(new ApiResponse(200, "Logged Out Successfully", null)); // why null as 3rd argument because there is no data to send in response
});

// Refresh Token Rotation - What goes inside controller
// 1. get refresh token from user
// 2. call the service to rotate the refresh token
// 3. give back the response with new Access and Refresh Token
export const tokenRotation = asyncHandler(
  async (req: Request, res: Response) => {
    // get refresh token from user cookies
    const incomingRefreshToken = req.cookies?.refreshToken;

    // check if the incoming refresh exists or not
    if (!incomingRefreshToken) {
      throw new ApiError(409, "Refresh token does not exist");
    }

    // Call the Service
    const { accessToken, refreshToken } =
      await tokenRotationService(incomingRefreshToken);

    // response
    res
      .status(201)
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        sameSite: true,
        secure: true,
        maxAge: Number(Bun.env.ACCESS_TOKEN_MAX_AGE),
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: true,
        secure: true,
        maxAge: Number(Bun.env.REFRESH_TOKEN_MAX_AGE),
      })
      .json(
        new ApiResponse(
          201,
          "Access And Refresh Token refresh successfully",
          null
        )
      );
  }
);
