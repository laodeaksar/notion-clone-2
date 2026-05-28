import { Effect, Layer, Context } from "effect";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { blocks } from "../db/schema";
import { NotFoundError, DatabaseError, ForbiddenError } from "../errors";
import { AuthContext } from "./auth.context";
import { WorkspaceService } from "./workspace.service";
import { PageService } from "./page.service";
import type { UpdateBlockInput } from "@shared/schemas";
import type { Block } from "@shared/types";

export class BlockService extends Context.Tag("BlockService")<
  BlockService,
  {
    upsert: (input: UpdateBlockInput) => Effect.Effect<Block, DatabaseError | NotFoundError | ForbiddenError, AuthContext>;
    getByPage: (pageId: string) => Effect.Effect<Block | null, DatabaseError>;
  }
>() {}

export const BlockServiceLive = Layer.effect(
  BlockService,
  Effect.gen(function* () {
    const pageService = yield* PageService;
    const workspaceService = yield* WorkspaceService;

    return {
      upsert: (input) =>
        Effect.gen(function* () {
          const { user } = yield* AuthContext;
          const page = yield* pageService.getById(input.pageId);
          yield* workspaceService.assertRole(page.workspaceId, "member");

          const existing = yield* Effect.tryPromise({
            try: () => db.select().from(blocks).where(eq(blocks.pageId, input.pageId)).limit(1),
            catch: cause => new DatabaseError({ cause }),
          });

          if (existing[0]) {
            const rows = yield* Effect.tryPromise({
              try: () =>
                db.update(blocks)
                  .set({ yjsState: input.yjsState, updatedAt: new Date() })
                  .where(eq(blocks.pageId, input.pageId))
                  .returning(),
              catch: cause => new DatabaseError({ cause }),
            });
            const updated = rows[0];
            if (!updated) return yield* Effect.fail(new DatabaseError({ cause: "Update returned empty" }));
            return updated as Block;
          }

          const rows = yield* Effect.tryPromise({
            try: () =>
              db.insert(blocks).values({
                pageId: input.pageId,
                yjsState: input.yjsState,
                createdBy: user.id,
                updatedAt: new Date(),
              }).returning(),
            catch: cause => new DatabaseError({ cause }),
          });
          const created = rows[0];
          if (!created) return yield* Effect.fail(new DatabaseError({ cause: "Insert returned empty" }));
          return created as Block;
        }),

      getByPage: (pageId) =>
        Effect.gen(function* () {
          const rows = yield* Effect.tryPromise({
            try: () => db.select().from(blocks).where(eq(blocks.pageId, pageId)).limit(1),
            catch: cause => new DatabaseError({ cause }),
          });
          return (rows[0] ?? null) as Block | null;
        }),
    };
  })
);
