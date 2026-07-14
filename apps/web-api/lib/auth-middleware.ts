import { NextResponse } from "next/server";
import { auth } from "./auth";
import { headers } from "next/headers";

type AuthenticatedHandler = (
  req: Request,
  session: { user: { id: string; email: string; name: string } },
  context: any
) => Promise<NextResponse> | NextResponse;

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: Request, context: any) => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      return await handler(req, session as any, context);
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  };
}
