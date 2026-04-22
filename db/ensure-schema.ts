import { readFile } from "node:fs/promises";
import path from "node:path";
import { Client, type ClientConfig } from "pg";

let schemaPromise: Promise<void> | null = null;

function createPgConfig(connectionString: string): ClientConfig {
  try {
    const parsed = new URL(connectionString);
    const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

    if (isLocal) {
      return { connectionString };
    }

    return {
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    };
  } catch {
    return { connectionString };
  }
}

export async function ensureDemoSchema() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return;
  }

  if (!schemaPromise) {
    schemaPromise = (async () => {
      const schemaPath = path.join(process.cwd(), "db", "schema.sql");
      const schemaSql = await readFile(schemaPath, "utf8");
      const client = new Client(createPgConfig(databaseUrl));

      await client.connect();

      try {
        await client.query(schemaSql);
        await client.query("NOTIFY pgrst, 'reload schema'");
      } finally {
        await client.end();
      }
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  await schemaPromise;
}
