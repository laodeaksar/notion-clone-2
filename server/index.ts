import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth.routes";
import { workspaceRoutes } from "./routes/workspace.routes";
import { pageRoutes } from "./routes/page.routes";
import { blockRoutes } from "./routes/block.routes";

const app = new Elysia()
  .use(
    cors({
      origin: process.env["CLIENT_URL"] ?? "http://localhost:5173",
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    })
  )
  .get("/health", () => ({ status: "ok", ts: Date.now() }))
  .use(authRoutes)
  .group("/api", app =>
    app
      .use(workspaceRoutes)
      .use(pageRoutes)
      .use(blockRoutes)
  )
  .onError(({ code, error }) => {
    const status = code === "NOT_FOUND" ? 404 : code === "VALIDATION" ? 400 : 500;
    return new Response(
      JSON.stringify({ error: error.message ?? "Internal server error" }),
      { status, headers: { "Content-Type": "application/json" } }
    );
  })
  .listen(process.env["PORT"] ?? 3000);

console.log(`🚀 Server running at http://localhost:${app.server?.port}`);

export type App = typeof app;
