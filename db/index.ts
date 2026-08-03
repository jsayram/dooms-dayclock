import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export class DatabaseConfigurationError extends Error {
  constructor() {
    super("Cloud persistence is not configured.");
    this.name = "DatabaseConfigurationError";
  }
}

type RuntimeBindings = { DB?: D1Database };

export function getD1(): D1Database {
  const binding = (env as unknown as RuntimeBindings).DB;
  if (!binding) throw new DatabaseConfigurationError();
  return binding;
}

export function getDb() {
  const binding = getD1();
  return drizzle(binding, { schema });
}
