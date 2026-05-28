import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth.routes";
import { workspaceRoutes } from "./routes/workspace.routes";
import { pageRoutes } from "./routes/page.routes";
import { blockRoutes } from "./routes/block.routes";
import { existsSync } from "fs";
import { join } from "path";

const isProd = process.env["NODE_ENV"] === "production";
const clientDist = join(import.meta.dir, "../client/dist");

const app = new Elysia()
  .use(
    cors({
      origin: isProd
        ? (process.env["CLIENT_URL"] ?? true)
        : (process.env["CLIENT_URL"] ?? "http://localhost:5000"),
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
  });

if (isProd && existsSync(clientDist)) {
  app.get("/*", ({ request }) => {
    const url = new URL(request.url);
    const filePath = join(clientDist, url.pathname);
    const indexPath = join(clientDist, "index.html");

    if (existsSync(filePath) && !filePath.endsWith("/")) {
      return Bun.file(filePath);
    }
    return Bun.file(indexPath);
  });
}

app.listen(process.env["PORT"] ?? 3000);

console.log(`🚀 Server running at http://localhost:${app.server?.port} (${isProd ? "production" : "development"})`);

export type App = typeof app;
