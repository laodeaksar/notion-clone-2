import { Elysia } from "elysia";
import { auth } from "../auth";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .all("/*", async ({ request }) => {
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;
    const fullUrl = new URL(url.pathname + url.search, origin);
    const newRequest = new Request(fullUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    return auth.handler(newRequest);
  });
