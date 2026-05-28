import { Elysia, t } from "elysia";
import { auth } from "../auth";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .all("/*", async ({ request }) => {
    return auth.handler(request);
  });
