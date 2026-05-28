import { Elysia } from "elysia";
import { auth } from "../auth";
import type { User, Session } from "@shared/types";

export interface AuthMiddlewareContext {
  user: User;
  session: Session;
}

export const authMiddleware = new Elysia({ name: "auth-middleware" })
  .derive({ as: "scoped" }, async ({ request, error }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || !session.session) {
      throw error(401, { message: "Unauthorized" });
    }
    return {
      authUser: session.user as User,
      authSession: session.session as Session,
    };
  });

export const optionalAuthMiddleware = new Elysia({ name: "optional-auth-middleware" })
  .derive({ as: "scoped" }, async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    return {
      authUser: (session?.user ?? null) as User | null,
      authSession: (session?.session ?? null) as Session | null,
    };
  });
