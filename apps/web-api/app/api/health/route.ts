import { NextResponse } from "next/server";
import { prisma, connection } from "@repo/db";
import { logger } from "@repo/logger";

export async function GET() {
  try {
    // Ping Database
    await prisma.$queryRaw`SELECT 1`;
    
    // Ping Redis
    await connection.ping();

    return NextResponse.json({ 
      status: "ok", 
      services: { db: "ok", redis: "ok" },
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("HEALTH_CHECK_FAILED", { error: errorMsg });
    
    return NextResponse.json(
      { 
        status: "error", 
        message: "Service Unavailable", 
        timestamp: new Date().toISOString() 
      }, 
      { status: 503 }
    );
  }
}
