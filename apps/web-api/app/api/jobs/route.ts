import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { withRateLimit } from "@/lib/rate-limit";
import { JobService } from "@/services/job.service";
import { handleApiError } from "@/lib/handle-api-error";
import { z } from "zod";

const JobSchema = z.object({
  originalUrl: z.string().min(1, "originalUrl is required"),
});

export const POST = withAuth(
  withRateLimit(
    async (req, session) => {
      const body = await req.json();
      const parseResult = JobSchema.safeParse(body);

      if (!parseResult.success) {
        return NextResponse.json(
          { error: parseResult.error.issues[0].message },
          { status: 400 }
        );
      }

      const { originalUrl } = parseResult.data;

      try {
        const job = await JobService.createJob(session.user.id, originalUrl);
        return NextResponse.json({ job }, { status: 201 });
      } catch (error) {
        return handleApiError(error);
      }
    },
    { keyPrefix: "jobs", limit: 5, windowSeconds: 60 }
  )
);

export const GET = withAuth(async (req, session) => {
  try {
    const url = new URL(req.url);
    const skip = parseInt(url.searchParams.get("skip") || "0");
    const take = parseInt(url.searchParams.get("take") || "20");

    const jobs = await JobService.getJobs(session.user.id, skip, take);
    return NextResponse.json({ jobs });
  } catch (error) {
    return handleApiError(error);
  }
});
