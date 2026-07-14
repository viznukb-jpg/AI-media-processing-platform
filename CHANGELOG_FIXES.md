# CHANGELOG - Fixes implementation

All issues from `How to fix.txt` have been addressed and implemented in this project:

## Phase 1 — P0: Critical Bugs
- **Bug 1.1**: Fixed `worker.on("failed")` to use `job.data.jobId` (Prisma UUID) instead of `job.id` (BullMQ internal ID). Added defensive checks in `processMedia`.
- **Bug 1.2**: Implemented file size limits for S3 presigned URLs (25MB for images, 250MB for videos). The mobile app now extracts and sends the file size before requesting the URL. Added `ContentLength` constraint to `PutObjectCommand`.

## Phase 2 — P0/P1: Security & Authorization
- **2.1**: Added `role` field to `User` model for Role-Based Access Control (RBAC). Protected `/api/metrics` endpoint using a new `withAdminAuth` middleware. Mobile UI now conditionally hides the Metrics tab for non-admin users. Added `seed-admin.ts` script.
- **2.2**: Replaced non-atomic rate-limiter in `jobs/route.ts` with a robust Lua-based atomic implementation in `lib/rate-limit.ts` to prevent race conditions.
- **2.3**: Extended rate limiting to `/api/upload-url` and auth endpoints (configured in `better-auth`).
- **2.4**: Added `file-type` package to the worker. It now uses magic bytes validation (file signature) to detect actual media type and prevent spoofed extension processing.

## Phase 3 — P1: Architecture Refactoring
- **3.1**: Created a centralized API error handling module (`errors.ts`, `handle-api-error.ts`). Replaced manual 500 error logs in routes.
- **3.2**: Refactored `JobService` to use `findJobOrThrow` for DRY access checks.
- **3.3**: Added generics to `withAuth` and `RouteContext` to properly type `context.params`.
- **3.4**: Decomposed `apps/worker/src/index.ts` applying SRP into `processors`, `services` (job status, media downloader, thumbnail strategies), and `lib/logger`.
- **3.5**: Replaced `require()` calls inside functions in `s3.service.ts` with static imports.
- **3.6**: Extracted `LoginForm.tsx` and `RegisterForm.tsx` from `LoginScreen.tsx` into separate components.
- **3.7**: Implemented a lightweight event emitter in the mobile app. The 401 interceptor now automatically logs out the user and redirects to login when `apiFetch` receives a 401 error.

## Phase 4 — P1/P2: Production Readiness & Bonuses
- **4.1**: Fully implemented `docker-compose.yml` defining `db` and `redis`.
- **4.2**: Set up a real Dead-Letter Queue (`dlqQueue`). `worker.on("failed")` now pushes exhausted jobs to this queue instead of just logging them.
- **4.3**: Added `@@index([status])` on the `Job` model to optimize the `/api/metrics` grouping query.
- **4.4**: Implemented atomic job deletion in `JobService` using `Promise.allSettled` to delete S3 objects and then safely delete DB records via Cascade.
- **4.5**: Replaced Next.js boilerplate in `apps/web-api/app/page.tsx` with a lightweight landing page.
- **4.6**: Created a health-check endpoint at `/api/health`.

## Phase 5 — P2: Tests & CI
- **5.1 & 5.2**: Added `vitest` unit tests for `upload-limits` and `file-validator`.
- **5.3 & 5.4**: Created `.github/workflows/ci.yml` for CI automation in GitHub Actions.
