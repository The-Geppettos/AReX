import Database from "better-sqlite3";
import path from "path";
import fs from "fs/promises";

// Create database instance
const dbInstance = new Database(
  path.join(__dirname, "main.db"),
  {
    verbose: console.log,
  },
);

// Add type definitions for database methods
export const maindb = {
  all: <T>(sql: string, params: any[] = []): Promise<T[]> => {
    return dbInstance.prepare(sql).all(params) as unknown as Promise<T[]>;
  },
  get: <T>(sql: string, params: any[] = []): Promise<T | undefined> => {
    return dbInstance.prepare(sql).get(params) as unknown as Promise<
      T | undefined
    >;
  },
  run: (
    sql: string,
    params: any[] = [],
  ): Promise<{ lastInsertRowid: number | bigint }> => {
    return dbInstance.prepare(sql).run(params) as unknown as Promise<{
      lastInsertRowid: number | bigint;
    }>;
  },
};

// Initialize database if needed
export const initializeDatabase = async () => {
  try {
    console.log("Initializing database schema...");
    const schema = await fs.readFile(
      path.join(__dirname, "schema.sql"),
      "utf-8",
    );

    // Split schema into individual statements
    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Execute each statement separately
    for (const statement of statements) {
      try {
        maindb.run(statement + ";");
      } catch (err) {
        const error = err as { code?: string; message?: string };
        // Skip if table already exists
        if (
          error.code === "SQLITE_ERROR" &&
          error.message?.includes("already exists")
        ) {
          console.log("Table already exists, skipping...");
          continue;
        }
        throw err;
      }
    }
    console.log("Database schema initialized");
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
};
