import { Elysia, t } from "elysia";
import { Effect, Layer } from "effect";
import { authMiddleware } from "../middleware/auth.middleware";
import { PageService, PageServiceLive } from "../services/page.service";
import { WorkspaceService, WorkspaceServiceLive } from "../services/workspace.service";
import { makeAuthLayer } from "../services/auth.context";
import { CreatePageSchema, UpdatePageSchema } from "@shared/schemas";
import type { User, Session } from "@shared/types";
import * as v from "valibot";

const runtimeLayer = Layer.merge(PageServiceLive, WorkspaceServiceLive);

const run = <A>(
  eff: Effect.Effect<A, unknown, typeof PageService | typeof WorkspaceService | import("../services/auth.context").AuthContext>,
  user: User,
  session: Session
) =>
  Effect.runPromise(
    Effect.provide(eff, Layer.merge(runtimeLayer, makeAuthLayer({ user, session })))
  );

export const pageRoutes = new Elysia({ prefix: "/pages" })
  .use(authMiddleware)
  .get("/workspace/:workspaceId", async ({ params, authUser, authSession, error }) => {
    const pages = await run(
      Effect.flatMap(PageService, s => s.listByWorkspace(params.workspaceId)),
      authUser,
      authSession,
    ).catch(e => { throw error(403, { message: String(e) }); });
    return { pages };
  })
  .get("/:id", async ({ params, authUser, authSession, error }) => {
    const page = await run(
      Effect.flatMap(PageService, s => s.getById(params.id)),
      authUser,
      authSession,
    ).catch(() => { throw error(404, { message: "Page not found" }); });
    return { page };
  })
  .post("/", async ({ body, authUser, authSession, error }) => {
    const parsed = v.safeParse(CreatePageSchema, body);
    if (!parsed.success) return error(400, { message: "Validation failed", issues: parsed.issues });
    const page = await run(
      Effect.flatMap(PageService, s => s.create(parsed.output)),
      authUser,
      authSession,
    ).catch(e => { throw error(500, { message: String(e) }); });
    return { page };
  }, {
    body: t.Object({
      workspaceId: t.String(),
      title: t.String(),
      parentId: t.Optional(t.String()),
      icon: t.Optional(t.String()),
      coverUrl: t.Optional(t.String()),
      order: t.Optional(t.Number()),
    }),
  })
  .patch("/:id", async ({ params, body, authUser, authSession, error }) => {
    const parsed = v.safeParse(UpdatePageSchema, body);
    if (!parsed.success) return error(400, { message: "Validation failed" });
    const page = await run(
      Effect.flatMap(PageService, s => s.update(params.id, parsed.output)),
      authUser,
      authSession,
    ).catch(() => { throw error(404, { message: "Page not found" }); });
    return { page };
  }, {
    body: t.Object({
      title: t.Optional(t.String()),
      icon: t.Optional(t.String()),
      coverUrl: t.Optional(t.String()),
      parentId: t.Optional(t.Nullable(t.String())),
      order: t.Optional(t.Number()),
    }),
  })
  .delete("/:id", async ({ params, authUser, authSession, error }) => {
    await run(
      Effect.flatMap(PageService, s => s.delete(params.id)),
      authUser,
      authSession,
    ).catch(() => { throw error(404, { message: "Page not found" }); });
    return { success: true };
  });
