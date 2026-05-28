import { Context, Layer } from "effect";
import type { User, Session, Member } from "@shared/types";

export interface AuthContextData {
  user: User;
  session: Session;
  member?: Member;
}

export class AuthContext extends Context.Tag("AuthContext")<
  AuthContext,
  AuthContextData
>() {}

export const makeAuthLayer = (data: AuthContextData): Layer.Layer<AuthContext> =>
  Layer.succeed(AuthContext, data);
