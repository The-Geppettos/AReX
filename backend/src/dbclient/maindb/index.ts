import type { Table } from "./tables/abstract";

import Database from "better-sqlite3";
import path from "path";

export class MainDB {
  private instance: Database.Database | undefined;

  private tables: Table[] = [];

  addTable(table: Table) {
    this.tables.push(table);
  }

  all<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.instance) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.instance.prepare(sql).all(params) as unknown as Promise<T[]>;
  }
  get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    if (!this.instance) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.instance.prepare(sql).get(params) as unknown as Promise<
      T | undefined
    >;
  }
  run(
    sql: string,
    params: any[] = [],
  ): Promise<{ lastInsertRowid: number | bigint }> {
    if (!this.instance) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.instance.prepare(sql).run(params) as unknown as Promise<{
      lastInsertRowid: number | bigint;
    }>;
  }

  async initialize() {
    this.instance = new Database(path.join(__dirname, "main.db"), {
      verbose: console.log,
    });

    console.log("Initializing database schema...");

    for (const table of this.tables) {
      await this.run(table.createTableQuery);
    }

    console.log("Database schema initialized");
  }
}
