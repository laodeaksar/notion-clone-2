---
name: Better-Auth + Drizzle adapter schema requirements
description: Better-Auth's drizzle adapter requires specific columns and the auth handler needs full URL reconstruction
---

**Schema requirements:** The `users` table must include `emailVerified` (boolean), `image` (text), `updatedAt`. The `sessions` table needs `token`, `ipAddress`, `userAgent`, `updatedAt`. Also requires `accounts` and `verifications` tables. Missing fields throw `BetterAuthError` at runtime.

**Auth handler URL:** When mounting Better-Auth under an Elysia prefix (e.g. `/auth`), the request URL seen by Better-Auth is path-stripped. Must reconstruct the full URL:
```ts
const fullUrl = new URL(url.pathname + url.search, process.env.BETTER_AUTH_URL);
const newRequest = new Request(fullUrl.toString(), { method, headers, body });
return auth.handler(newRequest);
```

**Why:** Better-Auth routes internally by matching the full pathname including `/auth/` prefix against `basePath`.
