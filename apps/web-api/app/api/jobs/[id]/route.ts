import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { JobService } from "@/services/job.service";

export const GET = withAuth(async (req, session, context) => {
  const { id } = await context.params;
  try {
    const job = await JobService.getJobDetails(session.user.id, id);
    return NextResponse.json({ job });
  } catch (error: any) {
    console.error("Error fetching job details:", error);
    if (error.message === "Job not found") {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch job details" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req, session, context) => {
  const { id } = await context.params;
  try {
    await JobService.deleteJob(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting job:", error);
    if (error.message === "Job not found") {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
  }
});
