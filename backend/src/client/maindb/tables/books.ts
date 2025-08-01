import type { Book, BookCreate, BookList } from "@shared/types";
import type { MainDB } from "..";

import { BOOK_STATUS } from "@shared/types";
import { Table } from "./abstract";
import { generateId } from "@src/util";

export class BooksTable extends Table<Book> {
  tableName = "books";
  idField = "id" as const;

  protected schema = {
    id: "TEXT PRIMARY KEY",
    title: "TEXT NOT NULL",
    author: "TEXT NOT NULL",
    status: "TEXT NOT NULL",
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

  async createBook(book: BookCreate): Promise<Book> {
    const id = generateId();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const result = await this.insert({
      ...book,
      id,
      status: "draft",
      created_at: createdAt,
      updated_at: updatedAt,
    });

    return result[0];
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

  async changeBookStatus(id: string, status: Book["status"]): Promise<Book> {
    const updatedAt = new Date().toISOString();
    const result = await this.mainDb.query<Book>(
      `UPDATE ${this.tableName} SET ${this.field("status")} = $1, ${this.field("updated_at")} = $2 WHERE ${this.field("id")} = $3 RETURNING *`,
      [status, updatedAt, id],
    );

    if (result.rowCount === 0 || result.rows[0].status !== status) {
      throw new Error(`Failed to update book status to ${status}`);
    }

    return result.rows[0];
  }
}
