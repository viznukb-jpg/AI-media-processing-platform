import { NextResponse } from "next/server";
import { AppError } from "./errors";
import { logger } from "@repo/logger";

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode },
    );
  }
  logger.error("UNHANDLED_API_ERROR", { error: error instanceof Error ? error.message : String(error) });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
