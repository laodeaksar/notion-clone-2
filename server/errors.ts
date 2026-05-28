import { Data } from "effect";

export class UnauthorizedError extends Data.TaggedError("Unauthorized")<{
  message: string;
}> {}

export class ForbiddenError extends Data.TaggedError("Forbidden")<{
  message: string;
}> {}

export class NotFoundError extends Data.TaggedError("NotFound")<{
  resource: string;
  id: string;
}> {}

export class ConflictError extends Data.TaggedError("Conflict")<{
  message: string;
}> {}

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  cause: unknown;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  fields: Record<string, string>;
}> {}

export type AppError =
  | UnauthorizedError
  | ForbiddenError
  | NotFoundError
  | ConflictError
  | DatabaseError
  | ValidationError;
