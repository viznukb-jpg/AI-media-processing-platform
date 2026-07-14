import { NextResponse } from "next/server";
import { connection } from "@repo/db";

// Atomic Lua script: INCR + conditional EXPIRE in a single Redis operation
// This prevents the race condition where INCR succeeds but EXPIRE fails
const RATE_LIMIT_SCRIPT = `
  local current = redis.call("INCR", KEYS[1])
  if tonumber(current) == 1 then
    redis.call("EXPIRE", KEYS[1], ARGV[1])
  end
  return current
`;

export async function checkRateLimit(
  key: string,
  windowSeconds: number,
  limit: number,
): Promise<{ allowed: boolean; current: number }> {
  const current = (await connection.eval(
    RATE_LIMIT_SCRIPT,
    1,
    key,
    windowSeconds,
  )) as number;
  return { allowed: current <= limit, current };
}

type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowSeconds: number;
};

type AuthenticatedHandler = (
  req: Request,
  session: { user: { id: string; email: string; name: string } },
  context: unknown,
) => Promise<NextResponse> | NextResponse;

export function withRateLimit(
  handler: AuthenticatedHandler,
  options: RateLimitOptions,
): AuthenticatedHandler {
  return async (req, session, context) => {
    const key = `rate-limit:${options.keyPrefix}:${session.user.id}`;
    const { allowed } = await checkRateLimit(
      key,
      options.windowSeconds,
      options.limit,
    );

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests, please try again later." },
        { status: 429 },
      );
    }

    return handler(req, session, context);
  };
}
