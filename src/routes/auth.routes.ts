import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  tokenRotation,
} from "../controllers/auth.controller";
import { verifyJwt } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  loginUserSchema,
  registerUserSchema,
} from "../validations/auth.validation";
import { authRatelimiter } from "../middlewares/rateLimit.middleware";

const router = Router();

// Method 1 - directly calls the post method and its simple to read and write
router.post(
  "/register",
  authRatelimiter,
  validate(registerUserSchema),
  registerUser
);
router.post("/login", authRatelimiter, validate(loginUserSchema), loginUser);

// Secured Routes
router.post("/logout", verifyJwt, authRatelimiter, logoutUser);
router.post("/refresh-token", authRatelimiter, tokenRotation);

// Method 2 - it make the route seprately and used when multiple HTTP methods exists on same route like GET, POST, DELETE
// router.route("/register").post(registerUser);

export default router;
