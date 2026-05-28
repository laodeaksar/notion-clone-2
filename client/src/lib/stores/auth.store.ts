import { createAuthClient } from "better-auth/svelte";
import type { User, Session } from "@shared/types";

export const authClient = createAuthClient({
  baseURL: "/auth",
});

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

let _state = $state<AuthState>({ user: null, session: null, loading: true });

export const authState = {
  get user() { return _state.user; },
  get session() { return _state.session; },
  get loading() { return _state.loading; },
  get isAuthenticated() { return _state.user !== null; },
};

export async function loadSession(): Promise<void> {
  _state.loading = true;
  try {
    const session = await authClient.getSession();
    _state.user = (session.data?.user as User) ?? null;
    _state.session = (session.data?.session as Session) ?? null;
  } catch {
    _state.user = null;
    _state.session = null;
  } finally {
    _state.loading = false;
  }
}

export async function signOut(): Promise<void> {
  await authClient.signOut();
  _state.user = null;
  _state.session = null;
}
