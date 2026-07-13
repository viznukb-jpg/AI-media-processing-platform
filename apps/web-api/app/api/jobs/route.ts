import { NextResponse } from "next/server";
import { prisma, mediaQueue } from "@repo/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { z } from "zod";

const JobSchema = z.object({
  originalUrl: z.string().min(1, "originalUrl is required"),
});

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Create the job in DB
    const job = await prisma.job.create({
      data: {
        userId: session.user.id,
        originalUrl,
        status: "queued",
      },
    });

    // Enqueue the job for the worker with retries and exponential backoff
    await mediaQueue.add("process-media", {
      jobId: job.id,
      originalUrl,
      userId: session.user.id,
    }, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create job" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobs = await prisma.job.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
