import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { users, sessions, accounts, verifications } from "./db/schema";

export const auth = betterAuth({
  baseURL: process.env["BETTER_AUTH_URL"] ?? "http://localhost:3000",
  basePath: "/auth",
  secret: process.env["BETTER_AUTH_SECRET"],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: users, session: sessions, account: accounts, verification: verifications },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    cookieCache: { enabled: true, maxAge: 60 * 60 * 24 * 7 },
  },
  advanced: {
    useSecureCookies: process.env["NODE_ENV"] === "production",
    defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
  },
  trustedOrigins: [
    process.env["CLIENT_URL"] ?? "http://localhost:5000",
  ],
});

export type Auth = typeof auth;
