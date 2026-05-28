import { Elysia, t } from "elysia";
import { Effect, Layer } from "effect";
import { authMiddleware } from "../middleware/auth.middleware";
import { WorkspaceService, WorkspaceServiceLive } from "../services/workspace.service";
import { makeAuthLayer } from "../services/auth.context";
import { CreateWorkspaceSchema } from "@shared/schemas";
import * as v from "valibot";

const runtimeLayer = WorkspaceServiceLive;

const runWithAuth = <A, E>(
  effect: Effect.Effect<A, E, typeof WorkspaceService | typeof import("../services/auth.context").AuthContext>,
  authUser: import("@shared/types").User,
  authSession: import("@shared/types").Session
): Promise<A> => {
  const layer = Layer.merge(runtimeLayer, makeAuthLayer({ user: authUser, session: authSession }));
  return Effect.runPromise(Effect.provide(effect, layer));
};

export const workspaceRoutes = new Elysia({ prefix: "/workspaces" })
  .use(authMiddleware)
  .get("/", async ({ authUser, authSession }) => {
    const workspaceService = WorkspaceService;
    const list = await runWithAuth(
      Effect.flatMap(workspaceService, s => s.listForUser()),
      authUser,
      authSession,
    );
    return { workspaces: list };
  })
  .post("/", async ({ body, authUser, authSession, error }) => {
    const parsed = v.safeParse(CreateWorkspaceSchema, body);
    if (!parsed.success) return error(400, { message: "Validation failed" });

    const ws = await runWithAuth(
      Effect.flatMap(WorkspaceService, s => s.create(parsed.output)),
      authUser,
      authSession,
    ).catch(e => { throw error(500, { message: String(e) }); });
    return { workspace: ws };
  }, {
    body: t.Object({ name: t.String() }),
  })
  .get("/:id", async ({ params, authUser, authSession, error }) => {
    const ws = await runWithAuth(
      Effect.flatMap(WorkspaceService, s => s.getById(params.id)),
      authUser,
      authSession,
    ).catch(() => { throw error(404, { message: "Workspace not found" }); });
    return { workspace: ws };
  });
