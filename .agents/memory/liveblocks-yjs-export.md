---
name: @liveblocks/yjs named export
description: The Liveblocks Y.js provider is a named export, not a default export
---

`@liveblocks/yjs` exports `{ LiveblocksYjsProvider, getYjsProviderForRoom }` — there is no default export.

**Why:** The package ships as an ES module with named exports only. `import LiveblocksProvider from "@liveblocks/yjs"` fails at build time with Vite/Rollup.

**How to apply:** Always use: `import { LiveblocksYjsProvider } from "@liveblocks/yjs";`
