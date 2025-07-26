import Database from "better-sqlite3";
import path from "path";
import fs from "fs/promises";

export default class MainDB {
  private static instance: Database.Database;

  static all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return this.instance.prepare(sql).all(params) as unknown as Promise<T[]>;
  }
  static get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    return this.instance.prepare(sql).get(params) as unknown as Promise<
      T | undefined
    >;
  }
  static run(
    sql: string,
    params: any[] = [],
  ): Promise<{ lastInsertRowid: number | bigint }> {
    return this.instance.prepare(sql).run(params) as unknown as Promise<{
      lastInsertRowid: number | bigint;
    }>;
  }

  static async initialize() {
    this.instance = new Database(path.join(__dirname, "main.db"), {
      verbose: console.log,
    });

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
        this.run(statement + ";");
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
  }
}
