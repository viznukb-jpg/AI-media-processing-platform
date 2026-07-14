import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { JobService } from "@/services/job.service";
import { handleApiError } from "@/lib/handle-api-error";

export const GET = withAuth<{ id: string }>(async (req, session, context) => {
  const { id } = await context.params;
  try {
    const job = await JobService.getJobDetails(session.user.id, id);
    return NextResponse.json({ job });
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth<{ id: string }>(async (req, session, context) => {
  const { id } = await context.params;
  try {
    await JobService.deleteJob(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
});
