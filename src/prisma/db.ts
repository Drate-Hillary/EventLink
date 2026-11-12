import "dotenv/config";
import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

// Server-side database client. Never import this from browser code: it holds
// DATABASE_URL and opens a Postgres connection. Prisma 8 reads the data model
// from contract.json, which `npm run db:emit` generates from contract.prisma.
const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy the connection string into .env before using the database.",
  );
}

export const contract = contractFromJson<Contract>(contractJson);

export const db = postgres({
  contract,
  url: connectionString,
});
