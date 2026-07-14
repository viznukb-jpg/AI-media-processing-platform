import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { s3Client } from "@/lib/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Error fetching job details:", error);
    return NextResponse.json(
      { error: "Failed to fetch job details" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete related events and the job
    await prisma.jobEvent.deleteMany({ where: { jobId: id } });
    await prisma.job.delete({ where: { id } });

    // Try to delete files from S3 if they exist
    const bucket = process.env.AWS_S3_BUCKET_NAME || "ai-media-platform-dev";
    
    if (job.originalUrl) {
      try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: job.originalUrl }));
      } catch (err) {
        console.error(`Failed to delete original file ${job.originalUrl} from S3`);
      }
    }

    if (job.processedUrl) {
      try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: job.processedUrl }));
      } catch (err) {
        console.error(`Failed to delete processed file ${job.processedUrl} from S3`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
