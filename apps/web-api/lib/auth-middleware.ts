import { NextResponse } from "next/server";
import { auth } from "./auth";
import { headers } from "next/headers";
import { logger } from "@repo/logger";

type RouteContext<T = Record<string, string>> = { params: Promise<T> };

type AuthenticatedHandler<T = Record<string, string>> = (
  req: Request,
  session: { user: { id: string; email: string; name: string } },
  context: RouteContext<T>,
) => Promise<NextResponse> | NextResponse;

export function withAuth<T = Record<string, string>>(
  handler: AuthenticatedHandler<T>,
) {
  return async (req: Request, context: RouteContext<T>) => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      return await handler(req, session as any, context);
    } catch (error: any) {
      logger.error("AUTH_MIDDLEWARE_ERROR", { error: error.message });
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }
  };
}
