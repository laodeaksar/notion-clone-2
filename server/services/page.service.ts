import { Effect, Layer, Context } from "effect";
import { eq, and, asc } from "drizzle-orm";
import { db } from "../db";
import { pages } from "../db/schema";
import { NotFoundError, DatabaseError, ForbiddenError } from "../errors";
import { AuthContext } from "./auth.context";
import { WorkspaceService } from "./workspace.service";
import type { CreatePageInput, UpdatePageInput } from "@shared/schemas";
import type { Page } from "@shared/types";

export class PageService extends Context.Tag("PageService")<
  PageService,
  {
    create: (input: CreatePageInput) => Effect.Effect<Page, DatabaseError | ForbiddenError | NotFoundError, AuthContext>;
    update: (id: string, input: UpdatePageInput) => Effect.Effect<Page, DatabaseError | NotFoundError | ForbiddenError, AuthContext>;
    delete: (id: string) => Effect.Effect<void, DatabaseError | NotFoundError | ForbiddenError, AuthContext>;
    listByWorkspace: (workspaceId: string) => Effect.Effect<Page[], DatabaseError | ForbiddenError | NotFoundError, AuthContext>;
    getById: (id: string) => Effect.Effect<Page, DatabaseError | NotFoundError>;
  }
>() {}

export const PageServiceLive = Layer.effect(
  PageService,
  Effect.gen(function* () {
    const workspaceService = yield* WorkspaceService;

    return {
      create: (input) =>
        Effect.gen(function* () {
          yield* workspaceService.assertRole(input.workspaceId, "member");
          const nextOrder = input.order ?? 0;
          const rows = yield* Effect.tryPromise({
            try: () =>
              db.insert(pages).values({
                workspaceId: input.workspaceId,
                parentId: input.parentId ?? null,
                title: input.title,
                icon: input.icon ?? null,
                coverUrl: input.coverUrl ?? null,
                order: nextOrder,
              }).returning(),
            catch: cause => new DatabaseError({ cause }),
          });
          const page = rows[0];
          if (!page) return yield* Effect.fail(new DatabaseError({ cause: "Insert returned empty" }));
          return page as Page;
        }),

      update: (id, input) =>
        Effect.gen(function* () {
          const existing = yield* Effect.tryPromise({
            try: () => db.select().from(pages).where(eq(pages.id, id)).limit(1),
            catch: cause => new DatabaseError({ cause }),
          });
          const page = existing[0];
          if (!page) return yield* Effect.fail(new NotFoundError({ resource: "Page", id }));
          yield* workspaceService.assertRole(page.workspaceId, "member");

          const updates: Partial<typeof pages.$inferInsert> = {};
          if (input.title !== undefined) updates.title = input.title;
          if (input.icon !== undefined) updates.icon = input.icon;
          if (input.coverUrl !== undefined) updates.coverUrl = input.coverUrl;
          if (input.parentId !== undefined) updates.parentId = input.parentId;
          if (input.order !== undefined) updates.order = input.order;

          const rows = yield* Effect.tryPromise({
            try: () => db.update(pages).set(updates).where(eq(pages.id, id)).returning(),
            catch: cause => new DatabaseError({ cause }),
          });
          const updated = rows[0];
          if (!updated) return yield* Effect.fail(new NotFoundError({ resource: "Page", id }));
          return updated as Page;
        }),

      delete: (id) =>
        Effect.gen(function* () {
          const existing = yield* Effect.tryPromise({
            try: () => db.select().from(pages).where(eq(pages.id, id)).limit(1),
            catch: cause => new DatabaseError({ cause }),
          });
          const page = existing[0];
          if (!page) return yield* Effect.fail(new NotFoundError({ resource: "Page", id }));
          yield* workspaceService.assertRole(page.workspaceId, "member");
          yield* Effect.tryPromise({
            try: () => db.delete(pages).where(eq(pages.id, id)),
            catch: cause => new DatabaseError({ cause }),
          });
        }),

      listByWorkspace: (workspaceId) =>
        Effect.gen(function* () {
          yield* workspaceService.assertRole(workspaceId, "member");
          const rows = yield* Effect.tryPromise({
            try: () =>
              db.select().from(pages)
                .where(eq(pages.workspaceId, workspaceId))
                .orderBy(asc(pages.order), asc(pages.createdAt)),
            catch: cause => new DatabaseError({ cause }),
          });
          return rows as Page[];
        }),

      getById: (id) =>
        Effect.gen(function* () {
          const rows = yield* Effect.tryPromise({
            try: () => db.select().from(pages).where(eq(pages.id, id)).limit(1),
            catch: cause => new DatabaseError({ cause }),
          });
          const page = rows[0];
          if (!page) return yield* Effect.fail(new NotFoundError({ resource: "Page", id }));
          return page as Page;
        }),
    };
  })
);
