import { Elysia, t } from "elysia";
import { Effect, Layer } from "effect";
import { authMiddleware } from "../middleware/auth.middleware";
import { BlockService, BlockServiceLive } from "../services/block.service";
import { PageService, PageServiceLive } from "../services/page.service";
import { WorkspaceService, WorkspaceServiceLive } from "../services/workspace.service";
import { makeAuthLayer } from "../services/auth.context";
import { UpdateBlockSchema, LiveblocksAuthSchema } from "@shared/schemas";
import { Liveblocks } from "@liveblocks/node";
import type { User, Session } from "@shared/types";
import * as v from "valibot";

const runtimeLayer = Layer.mergeAll(BlockServiceLive, PageServiceLive, WorkspaceServiceLive);

const run = <A>(
  eff: Effect.Effect<A, unknown, typeof BlockService | typeof PageService | typeof WorkspaceService | import("../services/auth.context").AuthContext>,
  user: User,
  session: Session
) =>
  Effect.runPromise(
    Effect.provide(eff, Layer.merge(runtimeLayer, makeAuthLayer({ user, session })))
  );

const liveblocks = new Liveblocks({
  secret: process.env["LIVEBLOCKS_SECRET_KEY"] ?? "",
});

export const blockRoutes = new Elysia({ prefix: "/blocks" })
  .use(authMiddleware)
  .post("/update", async ({ body, authUser, authSession, error }) => {
    const parsed = v.safeParse(UpdateBlockSchema, body);
    if (!parsed.success) return error(400, { message: "Validation failed", issues: parsed.issues });

    const block = await run(
      Effect.flatMap(BlockService, s => s.upsert(parsed.output)),
      authUser,
      authSession,
    ).catch(e => { throw error(500, { message: String(e) }); });

    return { block };
  }, {
    body: t.Object({
      pageId: t.String(),
      yjsState: t.Record(t.String(), t.Unknown()),
    }),
  })
  .get("/page/:pageId", async ({ params, authUser, authSession, error }) => {
    const block = await run(
      Effect.flatMap(BlockService, s => s.getByPage(params.pageId)),
      authUser,
      authSession,
    ).catch(e => { throw error(500, { message: String(e) }); });
    return { block };
  })
  .post("/liveblocks-auth", async ({ body, authUser, error }) => {
    const parsed = v.safeParse(LiveblocksAuthSchema, body);
    if (!parsed.success) return error(400, { message: "Validation failed" });

    const { room } = parsed.output;
    const session = liveblocks.prepareSession(authUser.id, {
      userInfo: { name: authUser.name, email: authUser.email },
    });
    session.allow(room, session.FULL_ACCESS);
    const { status, body: responseBody } = await session.authorize();
    return new Response(responseBody, { status });
  }, {
    body: t.Object({ room: t.String() }),
  });
