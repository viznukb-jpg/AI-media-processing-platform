import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { S3Service } from "@/services/s3.service";
import { z } from "zod";

const UploadSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  contentType: z.string().min(1, "Content type is required").regex(/^(image|video)\/.+$/, "Invalid content type"),
});

export const POST = withAuth(async (req, session) => {
  const body = await req.json();
  const parseResult = UploadSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.errors[0].message },
      { status: 400 }
    );
  }

  const { filename, contentType } = parseResult.data;

  try {
    const { url, key } = await S3Service.generateUploadUrl(session.user.id, filename, contentType);
    return NextResponse.json({ uploadUrl: url, key });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
});
