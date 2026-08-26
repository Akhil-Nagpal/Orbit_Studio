import { redis } from "../db/connect";
import logger from "../utils/logger";

// Get User Profile Caching
export const getCached = async (key: string) => {
  try {
    // get the key as a string
    const cache = await redis.get(key);

    // check if the cache is exists or not, if yes then return the data
    if (cache) {
      return JSON.parse(cache);
    }
    // if not return null
    return null;
  } catch (error) {
    // log the error
    logger.error("Redis getCached error", error);
    // if error comes the return null
    return null;
  }
};

// Set User Profile Caching
export const setCached = async (
  key: string,
  value: any,
  ttlSeconds: number
) => {
  try {
    // set the data to redis
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    // log the error
    logger.error("Redis setCached failed", error);
  }
};

// Deleting user Profile Cache
export const invalidateCache = async (key: string) => {
  try {
    // delete the cache from redis DB
    await redis.del(key);
  } catch (error) {
    // log the error
    logger.error("Redis invalidateCache Failed", error);
  }
};
