import { treaty } from "@elysiajs/eden";
import type { App } from "../../server/index";

export const api = treaty<App>("", {
  fetch: { credentials: "include" },
});

export type ApiClient = typeof api;
