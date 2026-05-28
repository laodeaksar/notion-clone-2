import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env["DATABASE_URL"] ?? "postgres://localhost:5432/notion_clone";

const queryClient = postgres(connectionString, { max: 10 });

export const db = drizzle(queryClient, { schema });

export type DB = typeof db;
