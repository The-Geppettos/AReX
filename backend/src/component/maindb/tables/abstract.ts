import type { MainDB } from "..";

type IndexType<T> = keyof T | [keyof T, "ASC" | "DESC"];

export abstract class Table<T extends Object = {}> {
  abstract tableName: string;
  abstract idField: keyof T;

  protected abstract schema: { [field in keyof T]: string };

  private constraints: string[] = [];
  private indexes: IndexType<T>[][] = [];

  protected mainDb: MainDB;

  protected addIndex(field: keyof T, order?: "ASC" | "DESC"): void;
  protected addIndex(indexes: IndexType<T>[]): void;

  protected addIndex(field: keyof T | IndexType<T>[], order?: "ASC" | "DESC") {
    let index: IndexType<T>[];

    if (Array.isArray(field)) {
      index = field;
    } else {
      if (!order) {
        index = [field];
      } else {
        index = [[field, order]];
      }
    }

    this.indexes.push(index);
  }

  protected addConstraint(constraint: string) {
    this.constraints.push(constraint);
  }

  constructor(mainDb: MainDB) {
    this.mainDb = mainDb;
    this.mainDb.addTable(this);
  }

  field<F extends keyof T>(field: F) {
    return field;
  }

  get createTableQuery() {
    const fields = [
      ...Object.entries(this.schema).map(([field, type]) => `${field} ${type}`),
      ...this.constraints,
    ].join(", ");

    return `CREATE TABLE IF NOT EXISTS ${this.tableName} (${fields});`;
  }

  get createIndexQueries() {
    return this.indexes.map((index) => {
      const indexName = index
        .map((field) => {
          if (Array.isArray(field)) {
            return `${field[0] as string}_${field[1]}`;
          }
          return field;
        })
        .join("_");

      const indexFields = index
        .map((field) => {
          if (Array.isArray(field)) {
            return `${field[0] as string} ${field[1]}`;
          }
          return field;
        })
        .join(", ");

      return `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_${indexName} ON ${this.tableName} (${indexFields});`;
    });
  }

  async insert(instance: T | T[]): Promise<T[]> {
    let instances;
    if (!Array.isArray(instance)) {
      instances = [instance];
    } else {
      instances = instance;
    }

    if (!instances.length) {
      throw new Error("Cannot insert empty instance");
    }

    const fields = [];

    for (const field of Object.keys(this.schema)) {
      fields.push(field as keyof T);
    }

    const values = [];
    const placeholders = [];

    for (const instance of instances) {
      const placeholder = [];

      for (const field of fields) {
        values.push(instance[field]);
        placeholder.push(`$${values.length}`);
      }

      placeholders.push(`(${placeholder.join(",")})`);
    }

    const query = `INSERT INTO ${this.tableName} (${fields.join(",")}) VALUES ${placeholders.join(",")} RETURNING *;`;
    const result = await this.mainDb.query<T>(query, values);

    if (result.rowCount !== instances.length) {
      throw new Error(
        "Unexpected number of rows affected when inserting records",
      );
    }

    return result.rows;
  }

  async updateById(id: string, instance: Partial<T>): Promise<T | null> {
    if (!Object.keys(instance).length) {
      throw new Error("Cannot update with empty instance");
    }

    const fields = [];
    const values = [];

    for (const [field, value] of Object.entries(instance)) {
      fields.push(field);
      values.push(value);
    }

    values.push(id);

    const setClause = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");

    const query = `UPDATE ${this.tableName}
                   SET ${setClause}
                   WHERE ${this.idField as string} = $${fields.length + 1}
                   RETURNING *;`;
    const result = await this.mainDb.query<T>(query, values);

    if (!result.rowCount) {
      return null;
    }

    return result.rows[0];
  }

  async getById(id: string) {
    const result = await this.mainDb.query<T>(
      `SELECT * FROM ${this.tableName} WHERE ${this.idField as string} = $1`,
      [id],
    );

    if (!result.rowCount) {
      return null;
    }

    return result.rows[0];
  }

  async count(query: Partial<T> = {}): Promise<number> {
    const values = [];
    const fields = [];

    for (const [field, value] of Object.entries(query)) {
      fields.push(field);
      values.push(value);
    }
    const whereClause = fields
      .map((field, index) => {
        return `${field} = $${index + 1}`;
      })
      .join(" AND ");

    const result = await this.mainDb.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM ${this.tableName} ${whereClause ? `WHERE ${whereClause}` : ""}`,
      values,
    );

    return result.rows?.[0]?.count ? parseInt(result.rows[0].count, 10) : 0;
  }
}
