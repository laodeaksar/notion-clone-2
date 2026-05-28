import { createAuthClient } from "better-auth/svelte";
import type { User, Session } from "@shared/types";

export const authClient = createAuthClient({
  baseURL: "/auth",
});

class AuthStore {
  user = $state<User | null>(null);
  session = $state<Session | null>(null);
  loading = $state(true);

  get isAuthenticated() {
    return this.user !== null;
  }

  async loadSession(): Promise<void> {
    this.loading = true;
    try {
      const result = await authClient.getSession();
      this.user = (result.data?.user as User) ?? null;
      this.session = (result.data?.session as Session) ?? null;
    } catch {
      this.user = null;
      this.session = null;
    } finally {
      this.loading = false;
    }
  }

  async signOut(): Promise<void> {
    await authClient.signOut();
    this.user = null;
    this.session = null;
  }
}

export const authStore = new AuthStore();
