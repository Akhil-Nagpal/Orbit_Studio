import type { CorsOptions } from "cors";

// allowed origins are coming from .env as a string and we need to convert it into array, so used split method
const allowedOrigins = Bun.env.CORS_ORIGIN?.split(",") || [];

export const corsOption: CorsOptions = {
  // set origins - origin controls who can access the api from browser
  origin: (origin, callback) => {
    // case 1 -> No Origin (Postman, Thunder-Client, server to server, mobile apps) cause cors is applied only to browser
    if (!origin) {
      return callback(null, true);
    }

    // case 2 -> Origins exists in whitelist - Requests from these origins are allowed
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // case 3 -> Origins Not allowed - Requests from these origins are blocked
    return callback(new Error("CORS Policy Violation"));
  },
  // set credentials to true -> means allow cookies and JWT tokens, these required for authentication systems
  credentials: true,

  // set HTTP methods aloowed from frontends
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  // set headers which are allowed in request
  allowedHeaders: ["Content-Type", "Authorization"],
  // set headers which are exposed to frontend, It's optinal if tokens are set in cookies, this only valid when tokens are set in headers
  exposedHeaders: [],
};
