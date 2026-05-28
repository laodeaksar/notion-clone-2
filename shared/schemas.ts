import * as v from "valibot";

export const EmailSchema = v.pipe(v.string(), v.email(), v.maxLength(255));
export const PasswordSchema = v.pipe(v.string(), v.minLength(8), v.maxLength(128));
export const UlidSchema = v.pipe(v.string(), v.regex(/^[0-9A-HJKMNP-TV-Z]{26}$/));
export const NameSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(100), v.trim());

export const SignUpSchema = v.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: NameSchema,
});

export const SignInSchema = v.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export const CreateWorkspaceSchema = v.object({
  name: NameSchema,
});

export const InviteMemberSchema = v.object({
  email: EmailSchema,
  role: v.picklist(["admin", "member"]),
  workspaceId: v.string(),
});

export const CreatePageSchema = v.object({
  workspaceId: v.string(),
  parentId: v.optional(v.string()),
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(500), v.trim()),
  icon: v.optional(v.pipe(v.string(), v.maxLength(10))),
  coverUrl: v.optional(v.pipe(v.string(), v.url())),
  order: v.optional(v.number()),
});

export const UpdatePageSchema = v.object({
  title: v.optional(NameSchema),
  icon: v.optional(v.pipe(v.string(), v.maxLength(10))),
  coverUrl: v.optional(v.pipe(v.string(), v.url())),
  parentId: v.optional(v.nullable(v.string())),
  order: v.optional(v.number()),
});

export const UpdateBlockSchema = v.object({
  pageId: v.string(),
  yjsState: v.record(v.string(), v.unknown()),
});

export const LiveblocksAuthSchema = v.object({
  room: v.string(),
});

export type SignUpInput = v.InferOutput<typeof SignUpSchema>;
export type SignInInput = v.InferOutput<typeof SignInSchema>;
export type CreateWorkspaceInput = v.InferOutput<typeof CreateWorkspaceSchema>;
export type InviteMemberInput = v.InferOutput<typeof InviteMemberSchema>;
export type CreatePageInput = v.InferOutput<typeof CreatePageSchema>;
export type UpdatePageInput = v.InferOutput<typeof UpdatePageSchema>;
export type UpdateBlockInput = v.InferOutput<typeof UpdateBlockSchema>;
export type LiveblocksAuthInput = v.InferOutput<typeof LiveblocksAuthSchema>;
