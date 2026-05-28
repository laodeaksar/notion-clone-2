import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env["DATABASE_URL"] ?? "postgres://localhost:5432/notion_clone";
const sql = postgres(connectionString, { max: 1 });

await migrate(drizzle(sql), { migrationsFolder: "./server/db/migrations" });
await sql.end();

console.log("Migrations applied.");
