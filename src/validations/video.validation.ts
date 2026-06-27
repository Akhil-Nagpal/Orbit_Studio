import { z } from "zod";

export const videoParamSchema = z.object({
  params: z.object({
    videoId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Video ID"),
  }),
});

export const VideoQuerySchema = z.object({
  query: z.object({
    page: z.string().default("1").transform(Number),
    limit: z.string().default("12").transform(Number),
  }),
});

export const UploadVideoSchema = z.object({
  videoFile: z.object({
    url: z.url(),
    publicId: z.string(),
  }),
  duration: z.number(),
  thumbnail: z.string(),
  title: z.string().min(5).max(250),
  description: z.string().max(1000).optional(),
  category: z.string(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]),
});

export const updateMetadataSchema = z.object({
  params: z.object({
    videoId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Video ID"),
  }),
  body: z.object({
    title: z.string().min(5).max(150),
    description: z.string().min(5).max(1000).optional(),
    category: z.string(),
    tags: z.array(z.string()).optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]),
  }),
});
