export type Role = "owner" | "admin" | "member";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
}

export interface Member {
  userId: string;
  workspaceId: string;
  role: Role;
}

export interface Page {
  id: string;
  workspaceId: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  coverUrl: string | null;
  order: number;
  createdAt: Date;
}

export interface Block {
  id: string;
  pageId: string;
  yjsState: Record<string, unknown>;
  createdBy: string;
  updatedAt: Date;
}

export interface AuthContext {
  user: User;
  session: Session;
  workspaceMember?: Member;
}

export type AppError =
  | { _tag: "Unauthorized"; message: string }
  | { _tag: "Forbidden"; message: string }
  | { _tag: "NotFound"; resource: string }
  | { _tag: "Conflict"; message: string }
  | { _tag: "DatabaseError"; cause: unknown }
  | { _tag: "ValidationError"; fields: Record<string, string> };
