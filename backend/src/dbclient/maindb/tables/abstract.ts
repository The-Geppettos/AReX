import type MainDB from "..";

export default abstract class Table<T extends object = {}> {
  abstract tableName: string;

  protected abstract schema: { [field in keyof T]: string };
  protected constraints: string[] = [];

  protected mainDb: MainDB;

  constructor(mainDb: MainDB) {
    this.mainDb = mainDb;
    this.mainDb.addTable(this);
  }

  private _fields: { [field in keyof T]: string } | undefined;

  get fields() {
    if (this._fields) {
      return this._fields;
    }

    const fields = {} as { [field in keyof T]: string };
    for (const field of Object.keys(this.schema)) {
      fields[field as keyof T] = field;
    }

    return fields;
  }

  get createTableQuery() {
    const fields = [
      ...Object.entries(this.schema).map(([field, type]) => `${field} ${type}`),
      ...this.constraints,
    ].join(", ");

    return `CREATE TABLE IF NOT EXISTS ${this.tableName} (${fields});`;
  }

  protected generateInsertQuery(instance: T) {
    const fields = [];
    const params = [];
    const placeholders = [];
    for (const [key, value] of Object.entries(instance)) {
      fields.push(key);
      params.push(value);
      placeholders.push("?");
    }

    return {
      query: `INSERT INTO ${this.tableName} (${fields.join(",")}) VALUES (${placeholders.join(",")})`,
      params,
    };
  }

  async getById(id: string): Promise<T | undefined> {
    return this.mainDb.get<T>(`SELECT * FROM ${this.tableName} WHERE id = ?`, [
      id,
    ]);
  }
}
