import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { JobService } from "@/services/job.service";
import { z } from "zod";

import { connection } from "@repo/db";

const JobSchema = z.object({
  originalUrl: z.string().min(1, "originalUrl is required"),
});

export const POST = withAuth(async (req, session) => {
  // Simple Rate Limiting: 5 jobs per minute per user
  const rateLimitKey = `rate-limit:jobs:${session.user.id}`;
  const currentCount = await connection.incr(rateLimitKey);
  
  if (currentCount === 1) {
    await connection.expire(rateLimitKey, 60);
  }

  if (currentCount > 5) {
    return NextResponse.json({ error: "Too many requests, please try again later." }, { status: 429 });
  }

  const body = await req.json();
  const parseResult = JobSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.errors[0].message },
      { status: 400 }
    );
  }

  const { originalUrl } = parseResult.data;

  try {
    const job = await JobService.createJob(session.user.id, originalUrl);
    return NextResponse.json({ job }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating job:", error);
    if (error.message === "Invalid or unauthorized S3 key") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
});

export const GET = withAuth(async (req, session) => {
  try {
    const url = new URL(req.url);
    const skip = parseInt(url.searchParams.get("skip") || "0");
    const take = parseInt(url.searchParams.get("take") || "20");

    const jobs = await JobService.getJobs(session.user.id, skip, take);
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
});
