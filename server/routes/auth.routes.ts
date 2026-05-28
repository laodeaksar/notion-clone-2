import { Elysia } from "elysia";
import { auth } from "../auth";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .all("/*", async ({ request }) => {
    const url = new URL(request.url);
    const fullUrl = new URL(
      url.pathname + url.search,
      process.env["BETTER_AUTH_URL"] ?? "http://localhost:3000"
    );
    const newRequest = new Request(fullUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    return auth.handler(newRequest);
  });
