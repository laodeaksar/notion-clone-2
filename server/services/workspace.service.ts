import { Effect, Layer, Context } from "effect";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { workspaces, members } from "../db/schema";
import {
  NotFoundError, ForbiddenError, DatabaseError, ConflictError,
} from "../errors";
import { AuthContext } from "./auth.context";
import type { CreateWorkspaceInput } from "@shared/schemas";
import type { Workspace, Member, Role } from "@shared/types";

export class WorkspaceService extends Context.Tag("WorkspaceService")<
  WorkspaceService,
  {
    create: (input: CreateWorkspaceInput) => Effect.Effect<Workspace, DatabaseError | ConflictError, AuthContext>;
    getById: (id: string) => Effect.Effect<Workspace, NotFoundError | DatabaseError>;
    listForUser: () => Effect.Effect<Workspace[], DatabaseError, AuthContext>;
    getMember: (workspaceId: string, userId: string) => Effect.Effect<Member, NotFoundError | DatabaseError>;
    assertRole: (workspaceId: string, minimum: Role) => Effect.Effect<Member, ForbiddenError | NotFoundError | DatabaseError, AuthContext>;
  }
>() {}

const ROLE_RANK: Record<Role, number> = { owner: 3, admin: 2, member: 1 };

export const WorkspaceServiceLive = Layer.effect(
  WorkspaceService,
  Effect.gen(function* () {
    return {
      create: (input) =>
        Effect.gen(function* () {
          const { user } = yield* AuthContext;
          const [ws] = yield* Effect.tryPromise({
            try: () =>
              db.transaction(async tx => {
                const [workspace] = await tx.insert(workspaces).values({
                  name: input.name,
                  ownerId: user.id,
                }).returning();
                if (!workspace) throw new Error("Insert failed");
                await tx.insert(members).values({
                  userId: user.id,
                  workspaceId: workspace.id,
                  role: "owner",
                });
                return [workspace];
              }),
            catch: cause => new DatabaseError({ cause }),
          });
          return ws as Workspace;
        }),

      getById: (id) =>
        Effect.gen(function* () {
          const rows = yield* Effect.tryPromise({
            try: () => db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1),
            catch: cause => new DatabaseError({ cause }),
          });
          const ws = rows[0];
          if (!ws) return yield* Effect.fail(new NotFoundError({ resource: "Workspace", id }));
          return ws as Workspace;
        }),

      listForUser: () =>
        Effect.gen(function* () {
          const { user } = yield* AuthContext;
          const rows = yield* Effect.tryPromise({
            try: () =>
              db.select({ workspace: workspaces })
                .from(workspaces)
                .innerJoin(members, eq(members.workspaceId, workspaces.id))
                .where(eq(members.userId, user.id)),
            catch: cause => new DatabaseError({ cause }),
          });
          return rows.map(r => r.workspace as Workspace);
        }),

      getMember: (workspaceId, userId) =>
        Effect.gen(function* () {
          const rows = yield* Effect.tryPromise({
            try: () =>
              db.select().from(members).where(
                and(eq(members.workspaceId, workspaceId), eq(members.userId, userId))
              ).limit(1),
            catch: cause => new DatabaseError({ cause }),
          });
          const m = rows[0];
          if (!m) return yield* Effect.fail(new NotFoundError({ resource: "Member", id: userId }));
          return m as Member;
        }),

      assertRole: (workspaceId, minimum) =>
        Effect.gen(function* () {
          const { user } = yield* AuthContext;
          const rows = yield* Effect.tryPromise({
            try: () =>
              db.select().from(members).where(
                and(eq(members.workspaceId, workspaceId), eq(members.userId, user.id))
              ).limit(1),
            catch: cause => new DatabaseError({ cause }),
          });
          const m = rows[0];
          if (!m) return yield* Effect.fail(new NotFoundError({ resource: "Member", id: user.id }));
          if (ROLE_RANK[m.role as Role] < ROLE_RANK[minimum]) {
            return yield* Effect.fail(new ForbiddenError({ message: `Requires role: ${minimum}` }));
          }
          return m as Member;
        }),
    };
  })
);
