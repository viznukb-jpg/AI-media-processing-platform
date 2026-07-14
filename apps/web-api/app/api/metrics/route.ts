import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { withAuth } from "@/lib/auth-middleware";
import { logger } from "@repo/logger";

export const GET = withAuth(async (req, session) => {
  try {
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

    return NextResponse.json(metrics);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("FETCH_METRICS_FAILED", { error: errorMsg });
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 },
    );
  }
});
