import type { Book, BookList } from "@shared/book";
import type { MainDB } from "..";

import { BOOK_STATUS } from "@shared/book";
import { Table } from "./abstract";

export class BooksTable extends Table<Book> {
  tableName = "books";
  idField = "id" as const;

  protected schema = {
    id: "TEXT PRIMARY KEY",
    title: "TEXT NOT NULL",
    author: "TEXT NOT NULL",
    status: "TEXT NOT NULL",
    language: "TEXT NOT NULL",
    total_pages: "INTEGER NOT NULL",
    created_at: "TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP",
    updated_at: "TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP",
  };

  constructor(mainDb: MainDB) {
    super(mainDb);
    this.addConstraint(
      `CHECK (${this.field("status")} IN (${BOOK_STATUS.map((s) => `'${s}'`).join(", ")}))`,
    );
    this.addIndex(this.field("updated_at"), "DESC");
  }

  async getList(
    offset: number,
    limit: number,
    status?: Book["status"],
  ): Promise<BookList> {
    const whereClause = status
      ? `WHERE ${this.field("status")} = '${status}'`
      : "";

    const total = await this.mainDb.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM ${this.tableName} ${whereClause}`,
    );

    const totalCount = total.rows?.[0]?.total;

    const books = await this.mainDb.query<Book>(
      `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY ${this.field("updated_at")} DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    return {
      books: books.rows,
      offset,
      limit,
      total: totalCount ? parseInt(totalCount) : 0,
    };
  }
}
