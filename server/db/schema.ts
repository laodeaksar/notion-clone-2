import {
  pgTable, pgEnum, text, timestamp, integer,
  jsonb, primaryKey, index, boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

const id = () => text("id").primaryKey().$defaultFn(() => createId());
const now = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const roleEnum = pgEnum("role", ["owner", "admin", "member"]);

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: now(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: now(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("sessions_user_idx").on(t.userId)]);

export const accounts = pgTable("accounts", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: now(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("accounts_user_idx").on(t.userId)]);

export const verifications = pgTable("verifications", {
  id: id(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: now(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workspaces = pgTable("workspaces", {
  id: id(),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: now(),
});

export const members = pgTable("members", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull().default("member"),
}, t => [
  primaryKey({ columns: [t.userId, t.workspaceId] }),
  index("members_workspace_idx").on(t.workspaceId),
]);

export const pages = pgTable("pages", {
  id: id(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  parentId: text("parent_id"),
  title: text("title").notNull().default("Untitled"),
  icon: text("icon"),
  coverUrl: text("cover_url"),
  order: integer("order").notNull().default(0),
  createdAt: now(),
}, t => [
  index("pages_workspace_idx").on(t.workspaceId),
  index("pages_parent_idx").on(t.parentId),
]);

export const blocks = pgTable("blocks", {
  id: id(),
  pageId: text("page_id").notNull().references(() => pages.id, { onDelete: "cascade" }).unique(),
  yjsState: jsonb("yjs_state").notNull().default({}),
  createdBy: text("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("blocks_page_idx").on(t.pageId)]);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  ownedWorkspaces: many(workspaces),
  memberships: many(members),
  blocks: many(blocks),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  members: many(members),
  pages: many(pages),
}));

export const membersRelations = relations(members, ({ one }) => ({
  user: one(users, { fields: [members.userId], references: [users.id] }),
  workspace: one(workspaces, { fields: [members.workspaceId], references: [workspaces.id] }),
}));

export const pagesRelations = relations(pages, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [pages.workspaceId], references: [workspaces.id] }),
  parent: one(pages, { fields: [pages.parentId], references: [pages.id], relationName: "page_children" }),
  children: many(pages, { relationName: "page_children" }),
  block: one(blocks, { fields: [pages.id], references: [blocks.pageId] }),
}));

export const blocksRelations = relations(blocks, ({ one }) => ({
  page: one(pages, { fields: [blocks.pageId], references: [pages.id] }),
  creator: one(users, { fields: [blocks.createdBy], references: [users.id] }),
}));
