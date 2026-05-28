---
name: Svelte 5 runes in .ts files
description: $state/$derived/$effect runes fail silently in plain .ts files — only work in .svelte or .svelte.ts
---

Svelte 5 runes (`$state`, `$derived`, `$effect`) only compile correctly inside `.svelte` components or files explicitly named `.svelte.ts`.

**Why:** The Svelte compiler only processes rune syntax in these file types. In a plain `.ts` file, `$state<T>(...)` is treated as a tagged template or identifier — it compiles without error but produces no reactivity, causing blank screens with no browser console errors.

**How to apply:** For shared reactive state (stores), use class-based pattern in a `.svelte.ts` file:
```ts
// auth.store.svelte.ts
class AuthStore {
  user = $state<User | null>(null);
}
export const authStore = new AuthStore();
```
Then import in `.svelte` components normally.
