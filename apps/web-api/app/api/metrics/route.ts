import { NextResponse } from "next/server";
import { prisma, connection } from "@repo/db";
import { withAuth } from "@/lib/auth-middleware";
import { withRateLimit } from "@/lib/rate-limit";
import { logger } from "@repo/logger";

export const GET = withAuth(
  withRateLimit(
    async (req, session) => {
      try {
        const CACHE_KEY = "global_metrics";
        const cachedMetrics = await connection.get(CACHE_KEY);
        
        if (cachedMetrics) {
          return NextResponse.json(JSON.parse(cachedMetrics));
        }

        const [jobStats, totalJobs, totalUsers] = await Promise.all([
          prisma.job.groupBy({
            by: ["status"],
            _count: { _all: true },
          }),
          prisma.job.count(),
          prisma.user.count(),
        ]);

        // Format the response
        const statusBreakdown = jobStats.reduce(
          (acc, curr) => {
            acc[curr.status] = curr._count._all;
            return acc;
          },
          {} as Record<string, number>,
        );

        const activeJobs =
          (statusBreakdown["queued"] || 0) +
          (statusBreakdown["downloading"] || 0) +
          (statusBreakdown["analyzing"] || 0) +
          (statusBreakdown["generating_thumbnail"] || 0);

        const metrics = {
          total: totalJobs,
          totalUsers,
          activeJobs,
          statusBreakdown,
        };

        // Cache the result for 30 seconds
        await connection.set(CACHE_KEY, JSON.stringify(metrics), "EX", 30);

        return NextResponse.json(metrics);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error("FETCH_METRICS_FAILED", { error: errorMsg });
        return NextResponse.json(
          { error: "Failed to fetch metrics" },
          { status: 500 },
        );
      }
    },
    { keyPrefix: "metrics", limit: 30, windowSeconds: 60 } // Increased to 30 to prevent UI errors during navigation, since it's cached anyway
  )
);
