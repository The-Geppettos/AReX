import type { Table } from "./tables/abstract";

import { Pool } from "pg";

const RETRY_INTERVAL = 5000;

export class MainDB {
  private pool: Pool;

  private tables: Table<any>[] = [];

  private closeTriggered: boolean = false;

  query;

  constructor(
    host: string,
    port: number,
    user: string,
    password: string,
    dbName: string,
  ) {
    this.pool = new Pool({
      host: host,
      port: port,
      user: user,
      password: password,
      database: dbName,
    });

    this.query = ((...params: Parameters<typeof this.pool.query>) =>
      this.pool.query(...params)) as typeof this.pool.query;
  }

  addTable<T extends Record<string, any>>(table: Table<T>) {
    this.tables.push(table);
  }

  async initialize() {
    console.info(
      `Initializing PostgreSQL at ${this.pool.options.host}:${this.pool.options.port}/${this.pool.options.database}...`,
    );

    console.info("Initializing database schema...");

    for (const table of this.tables) {
      let tableCreateSuccess = false;

      while (!tableCreateSuccess) {
        if (this.closeTriggered) {
          return;
        }
        try {
          await this.query(table.createTableQuery);
          tableCreateSuccess = true;
        } catch (error) {
          console.error(`Error creating table ${table.tableName}:`, error);
          console.error(`Retrying in ${RETRY_INTERVAL} ms...`);

          await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
        }
      }

      for (const createindecQuery of table.createIndexQueries) {
        let indexCreateSuccess = false;

        while (!indexCreateSuccess) {
          if (this.closeTriggered) {
            return;
          }
          try {
            await this.query(createindecQuery);
            indexCreateSuccess = true;
          } catch (error) {
            console.error(
              `Error creating index for table ${table.tableName}:`,
              error,
            );
            console.error(`Retrying in ${RETRY_INTERVAL} ms...`);

            await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
          }
        }
      }
    }

    console.info("PostgreSQL initialized successfully.");
  }

  async close() {
    console.info("Closing PostgreSQL connection...");
    this.closeTriggered = true;
    try {
      await this.pool.end();
    } catch (error) {
      console.error("PostgreSQL connection close error:", error);
    }
    console.info("PostgreSQL connection closed.");
  }
}
