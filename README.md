# Orbit Studio — Video Streaming Backend

A REST API backend for a video streaming platform, built with **Bun**, **Express**, **TypeScript**, and **MongoDB**. Supports channel management, video uploads, playlists, subscriptions, comments, likes, views, and watch history — deployed on AWS EC2 with Nginx reverse proxy, PM2 process management, and automated CI/CD via GitHub Actions.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Security](#security)
- [Performance](#performance)
- [Deployment](#deployment)
- [CI/CD](#cicd)
- [Testing](#testing)
- [Roadmap](#roadmap)

---

## Features

- **Authentication** — Register, login, logout, token refresh with JWT (access + refresh tokens via HTTP-only cookies)
- **Channel Management** — Create and manage channels, update avatar and cover image, channel state enforcement
- **Video Uploads** — Upload videos and thumbnails to Cloudinary, paginated video listing
- **Playlists** — Create, update, delete playlists; add/remove videos; visibility control (PUBLIC/PRIVATE)
- **Subscriptions** — Subscribe/unsubscribe to channels, subscriber count tracking
- **Comments** — Add, update, delete comments on videos
- **Likes** — Like/unlike videos and comments
- **Views** — Track video views with deduplication
- **Watch History** — Per-user watch history tracking
- **User Management** — Update profile, avatar, password
- **Rate Limiting** — Per-route configurable rate limiting (auth, upload, comment, view, global API)
- **Structured Logging** — Winston-based JSON logging with request context
- **Input Validation** — Zod schema validation on all routes
- **Error Handling** — Centralized global error middleware with consistent API error responses

---

## Tech Stack

| Layer               | Technology                          |
| ------------------- | ----------------------------------- |
| Runtime             | Bun                                 |
| Framework           | Express 5                           |
| Language            | TypeScript                          |
| Database            | MongoDB + Mongoose                  |
| Authentication      | JWT (access + refresh tokens)       |
| File Storage        | Cloudinary                          |
| File Uploads        | Multer                              |
| Validation          | Zod                                 |
| Logging             | Winston                             |
| Rate Limiting       | express-rate-limit                  |
| Password Hashing    | bcrypt                              |
| Process Manager     | PM2                                 |
| Reverse Proxy       | Nginx                               |
| Cloud               | AWS EC2                             |
| CI/CD               | GitHub Actions (self-hosted runner) |
| Performance Testing | k6                                  |
| Build               | tsc                                 |

---

## Architecture

```
Client
  │
  ▼
Nginx (Port 80)          ← Reverse proxy, cookie forwarding
  │
  ▼
Bun/Express (Port 5000)  ← Application server (PM2 managed)
  │
  ├── Rate Limiter       ← Per-route limits (auth, upload, comment, view, api)
  ├── Auth Middleware     ← JWT verification via HTTP-only cookies
  ├── Validation          ← Zod schema validation
  ├── Controllers         ← Request/response handling
  ├── Services            ← Business logic layer
  │
  ▼
MongoDB                  ← Primary database
  │
  ▼
Cloudinary               ← Media storage (videos, thumbnails, avatars, cover images)
```

---

## Project Structure

```
Orbit_Studio/
├── index.ts                          # Entry point (dev)
├── package.json
├── tsconfig.json
├── tsconfig.build.json               # Production build config
├── .prettierrc
├── .prettierignore
├── .env                              # Environment variables (not committed)
│
├── .github/
│   └── workflows/
│       └── deploy.yml                # GitHub Actions CI/CD
│
├── tests/
│   └── performance/
│       ├── load-test.js              # General load test
│       └── Playlist-load-test.js     # Playlist endpoint load test (k6)
│
└── src/
    ├── app.ts                        # Express app setup, middleware registration
    ├── index.ts                      # Server entry point
    ├── constants.ts                  # Enums and shared constants
    │
    ├── config/
    │   ├── cloudinary.ts             # Cloudinary SDK config
    │   ├── cors.config.ts            # CORS allowed origins
    │   └── rateLimit.config.ts       # Rate limit values per route type (env-aware)
    │
    ├── controllers/
    │   ├── auth.controller.ts
    │   ├── channel.controller.ts
    │   ├── playlist.controller.ts
    │   ├── subscription.controller.ts
    │   ├── user.controller.ts
    │   └── video.controller.ts
    │
    ├── db/
    │   └── connect.ts                # MongoDB connection
    │
    ├── middlewares/
    │   ├── auth.middleware.ts         # JWT verification
    │   ├── channelState.middleware.ts # Channel active/suspended check
    │   ├── globalError.middleware.ts  # Centralized error handler
    │   ├── multer.middleware.ts       # File upload handling
    │   ├── optionalAuth.middleware.ts # Auth without throwing for public routes
    │   ├── rateLimit.middleware.ts    # Rate limiter instances
    │   ├── userState.middleware.ts    # User active/suspended check
    │   └── validation.middleware.ts   # Zod schema validator
    │
    ├── models/
    │   ├── channel.model.ts
    │   ├── comment.model.ts
    │   ├── like.model.ts
    │   ├── playlist.model.ts
    │   ├── playlistVideo.model.ts
    │   ├── subscription.model.ts
    │   ├── user.model.ts
    │   ├── video.model.ts
    │   ├── view.model.ts
    │   └── watchHistory.model.ts
    │
    ├── routes/
    │   ├── auth.routes.ts
    │   ├── channel.routes.ts
    │   ├── playlist.routes.ts
    │   ├── subscription.routes.ts
    │   ├── system.routes.ts          # Health check
    │   ├── user.routes.ts
    │   └── video.routes.ts
    │
    ├── services/
    │   ├── auth.service.ts
    │   ├── channel.service.ts
    │   ├── playlist.service.ts
    │   ├── subscription.service.ts
    │   ├── user.service.ts
    │   └── video.service.ts
    │
    ├── types/
    │   └── express.d.ts              # Module augmentation for req.user
    │
    ├── utils/
    │   ├── apiError.ts               # Custom ApiError class
    │   ├── apiResponse.ts            # Consistent response wrapper
    │   ├── asyncHandler.ts           # Async error wrapper
    │   ├── deleteFromCloudinary.ts
    │   ├── generateThumbnails.ts
    │   ├── logger.ts                 # Winston JSON logger
    │   └── uploadToCloudinary.ts
    │
    └── validations/
        ├── auth.validation.ts
        ├── channel.validation.ts
        ├── comment.validation.ts
        ├── playlist.validation.ts
        ├── subscription.validation.ts
        ├── user.validation.ts
        └── video.validation.ts
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- MongoDB instance (local or Atlas)
- Cloudinary account

### Installation

```bash
# Clone the repository
git clone https://github.com/BackendLab/Orbit_Studio.git
cd Orbit_Studio

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env
# Fill in your values in .env

# Run in development
bun run dev
```

### Build for Production

```bash
bun run build       # Compiles TypeScript to dist/
bun run start       # Runs compiled output with Node.js
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Environment
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net
DB_NAME=your_db_name

# CORS
CORS_ORIGIN=http://localhost:3000

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=86400
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=604800

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=your_folder_name

# Cookies
ACCESS_TOKEN_MAX_AGE=86400000
REFRESH_TOKEN_MAX_AGE=604800000

# Logging
LOG_LEVEL=debug
```

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Auth

| Method | Endpoint         | Description              | Auth |
| ------ | ---------------- | ------------------------ | ---- |
| POST   | `/auth/register` | Register a new user      | ❌   |
| POST   | `/auth/login`    | Login and receive tokens | ❌   |
| POST   | `/auth/logout`   | Logout and clear cookies | ✅   |
| POST   | `/auth/refresh`  | Refresh access token     | ❌   |

### User

| Method | Endpoint         | Description              | Auth |
| ------ | ---------------- | ------------------------ | ---- |
| GET    | `/user/profile`  | Get current user profile | ✅   |
| PATCH  | `/user/profile`  | Update profile info      | ✅   |
| PATCH  | `/user/avatar`   | Update avatar            | ✅   |
| PATCH  | `/user/password` | Change password          | ✅   |

### Channel

| Method | Endpoint                          | Description           | Auth |
| ------ | --------------------------------- | --------------------- | ---- |
| GET    | `/channel/:channelId`             | Get channel info      | ✅   |
| GET    | `/channel/:channelId/featured`    | Get featured content  | ✅   |
| GET    | `/channel/:channelId/videos`      | Get channel videos    | ✅   |
| GET    | `/channel/:channelId/playlists`   | Get channel playlists | ✅   |
| PATCH  | `/channel/:channelId`             | Update channel info   | ✅   |
| PATCH  | `/channel/:channelId/avatar`      | Update channel avatar | ✅   |
| PATCH  | `/channel/:channelId/cover-image` | Update cover image    | ✅   |

### Video

| Method | Endpoint          | Description          | Auth |
| ------ | ----------------- | -------------------- | ---- |
| POST   | `/video`          | Upload a video       | ✅   |
| GET    | `/video/:videoId` | Get video by ID      | ✅   |
| PATCH  | `/video/:videoId` | Update video details | ✅   |
| DELETE | `/video/:videoId` | Delete a video       | ✅   |

### Playlist

| Method | Endpoint                               | Description           | Auth |
| ------ | -------------------------------------- | --------------------- | ---- |
| POST   | `/playlist`                            | Create a playlist     | ✅   |
| GET    | `/playlist/:playlistId`                | Get playlist by ID    | ✅   |
| PATCH  | `/playlist/:playlistId`                | Update playlist       | ✅   |
| DELETE | `/playlist/:playlistId`                | Delete playlist       | ✅   |
| POST   | `/playlist/:playlistId/video`          | Add video to playlist | ✅   |
| DELETE | `/playlist/:playlistId/video/:videoId` | Remove video          | ✅   |

### Subscription

| Method | Endpoint                   | Description          | Auth |
| ------ | -------------------------- | -------------------- | ---- |
| POST   | `/subscription/:channelId` | Subscribe to channel | ✅   |
| DELETE | `/subscription/:channelId` | Unsubscribe          | ✅   |
| GET    | `/subscription`            | Get subscriptions    | ✅   |

### System

| Method | Endpoint  | Description  | Auth |
| ------ | --------- | ------------ | ---- |
| GET    | `/health` | Health check | ❌   |

---

## Security

- **JWT** — Short-lived access tokens (24h) + long-lived refresh tokens (7d) stored in HTTP-only cookies
- **Rate Limiting** — Configurable per route type, environment-aware (stricter in production)
- **Input Validation** — All request bodies, params, and query strings validated with Zod
- **Password Hashing** — bcrypt with salt rounds
- **CORS** — Allowlist-based origin control with credentials support
- **Channel/User State** — Middleware enforces active status on protected routes; suspended accounts are blocked

### Rate Limit Configuration

| Route Type | Window | Limit (Production) |
| ---------- | ------ | ------------------ |
| Global API | 15 min | 300 requests       |
| Auth       | 15 min | 10 requests        |
| Upload     | 60 min | 20 requests        |
| Comment    | 10 min | 30 requests        |
| View       | 1 min  | 50 requests        |

---

## Performance

- **MongoDB Indexes** — Compound indexes on frequently queried fields (channel + visibility, channel + createdAt)
- **Aggregation Pipelines** — Used for featured content with sub-pipeline video lookups
- **Pagination** — Offset-based pagination on all list endpoints
- **Promise.all** — Parallel DB queries where possible (e.g. videos + count in a single round trip)
- **Structured Logging** — Winston JSON logger with log levels to minimize I/O overhead in production

### Load Test Results (k6)

Tested against AWS EC2 t2.micro (1 vCPU, 1GB RAM).

#### Health Check Endpoint (`/health`) — Stress Test

Ramped up to 1000 concurrent users over 4 minutes.

| Metric         | Value                   |
| -------------- | ----------------------- |
| Total Requests | 81,756                  |
| Throughput     | 339 req/sec             |
| Avg Latency    | 232ms                   |
| Median Latency | 49ms                    |
| p(90) Latency  | 578ms                   |
| p(95) Latency  | 955ms                   |
| Failure Rate   | 0.00% (7 out of 81,756) |
| Peak VUs       | 997                     |

> Server handled 1000 concurrent users with 0% failure rate and 339 req/sec throughput on a t2.micro instance.

#### Playlist Endpoint (`/channel/:id/playlists`) — Authenticated Load Test

Ramped up to 50-100 concurrent users with JWT authentication.

| VUs | p(95) Latency | Failure Rate |
| --- | ------------- | ------------ |
| 50  | ~1.9s         | 0%           |
| 100 | ~3.9s         | 0%           |

> **Note:** Authenticated endpoint performance is bottlenecked by the t2.micro instance (951MB RAM) and lack of caching. Redis caching is planned as the next optimization.

---

## Deployment

### AWS EC2 + Nginx + PM2

#### 1. Nginx Configuration

```nginx
server {
    listen 80;
    server_name _;
    client_max_body_size 1G;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Cookie $http_cookie;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

#### 2. PM2 Process Management

```bash
# Start in production
NODE_ENV=production pm2 start dist/index.js --name orbit-studio --interpreter bun

# Save process list
pm2 save

# Auto-start on reboot
pm2 startup
```

#### 3. Manual Deploy

```bash
git pull origin main
bun run build
pm2 restart orbit-studio
```

---

## CI/CD

### GitHub Actions — Self-Hosted Runner

Deployments are fully automated using a **self-hosted GitHub Actions runner** installed directly on the EC2 instance. On every push to `main`, the runner pulls the latest code, installs dependencies, builds, and restarts PM2 — no SSH keys or external access required from GitHub's side.

```yaml
name: Deploy Orbit Studio

on:
  push:
    branches:
      - main

concurrency:
  group: orbit-studio-production
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: self-hosted

    steps:
      - name: Deploy Orbit Studio to EC2
        run: |
          set -e

          echo "Starting Deployment..."

          cd /home/ubuntu/Orbit_Studio
          git pull origin main
          /home/ubuntu/.bun/bin/bun install
          /home/ubuntu/.bun/bin/bun run build
          /home/ubuntu/.bun/bin/pm2 restart orbit-studio
```

**How it works:**

1. Push to `main` triggers the workflow
2. `concurrency` ensures only one deployment runs at a time — any in-progress deploy is cancelled if a new push arrives
3. The self-hosted runner on EC2 pulls, builds, and restarts the server automatically

---

## Testing

### Performance Testing with k6

```bash
# Install k6
# https://grafana.com/docs/k6/latest/set-up/install-k6/

# Run playlist load test
k6 run tests/performance/Playlist-load-test.js
```

The load test simulates:

- Ramp up to 50 concurrent users over 60 seconds
- Sustained load for 30 seconds
- Ramp down to 0

Thresholds:

- p(95) response time < 1000ms
- Error rate < 1%

---

## Roadmap

- [ ] Redis caching for channel and playlist endpoints
- [ ] Video transcoding pipeline (FFmpeg)
- [x] CI/CD with GitHub Actions (self-hosted runner)
- [ ] Docker containerization
- [ ] Search functionality
- [ ] Notification system
- [ ] Admin dashboard

---

## License

MIT
