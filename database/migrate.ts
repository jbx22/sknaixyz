import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;

  if (!databaseUrl) {
    console.error("No DATABASE_URL found. Set DATABASE_URL, POSTGRES_URL, or POSTGRES_PRISMA_URL.");
    process.exit(1);
  }

  const migrationsDir = join(__dirname, "migrations");

  // Get all .sql files sorted by name (001_..., 002_..., etc.)
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migration files found in database/migrations/");
    process.exit(0);
  }

  console.log("Connecting to database...");
  const sql = postgres(databaseUrl, {
    prepare: false,
    idle_timeout: 10,
    max: 1,
    ssl: "require",
    onnotice: () => {}, // suppress notices
  });

  try {
    // Create migrations tracking table if it doesn't exist
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get already-applied migrations
    const applied = await sql.unsafe<{ filename: string }[]>(
      "SELECT filename FROM _migrations ORDER BY filename"
    );
    const appliedSet = new Set(applied.map((r) => r.filename));

    const pending = files.filter((f) => !appliedSet.has(f));

    if (pending.length === 0) {
      console.log("All migrations already applied. Nothing to do.");
      return;
    }

    console.log(`Found ${pending.length} pending migration(s):`);
    pending.forEach((f) => console.log(`  - ${f}`));

    for (const file of pending) {
      const filePath = join(migrationsDir, file);
      const sqlContent = readFileSync(filePath, "utf-8");

      console.log(`Running: ${file}...`);
      await sql.unsafe(sqlContent);

      // Record the migration
      await sql.unsafe("INSERT INTO _migrations (filename) VALUES ($1)", [file]);

      console.log(`Completed: ${file}`);
    }

    console.log("All migrations applied successfully!");
  } catch (error: any) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
