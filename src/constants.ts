// Enums for Business state

// User Status
export enum UserState {
  ACTIVE = "ACTIVE",
  BANNED = "BANNED",
  DELETED = "DELETED",
}

// Channel Status
export enum ChannelState {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
}

// Video Status
export enum VideoState {
  PROCESSING = "PROCESSING",
  READY = "READY",
  FAILED = "FAILED",
}

// Playlist Status
export enum PlaylistState {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}
