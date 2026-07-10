import { betterAuth as betterAuthLib } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { uuidv7 } from "uuidv7";
import { db } from "~/src/db/index.ts";
import * as schema from "~/src/db/schema.ts";

export const betterAuth = betterAuthLib({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET ?? "corkbord-dev-secret-change-me",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  advanced: {
    database: {
      generateId: () => uuidv7(),
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
    }),
  ],
});

export const auth = betterAuth;
