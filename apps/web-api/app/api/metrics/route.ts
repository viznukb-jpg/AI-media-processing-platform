import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { withAuth } from "@/lib/auth-middleware";

export const GET = withAuth(async (req, session) => {
  try {
    const jobStats = await prisma.job.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    const totalJobs = await prisma.job.count();
    const totalUsers = await prisma.user.count();
    
    // Format the response
    const statusBreakdown = jobStats.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    const activeJobs = (statusBreakdown['queued'] || 0) + 
                       (statusBreakdown['downloading'] || 0) + 
                       (statusBreakdown['analyzing'] || 0) + 
                       (statusBreakdown['generating_thumbnail'] || 0);

    const metrics = {
      total: totalJobs,
      totalUsers,
      activeJobs,
      statusBreakdown,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
});
