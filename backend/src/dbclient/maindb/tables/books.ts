import type { Book, BookCreate, BookList } from "@shared/types";

import { Table } from "./abstract";
import { generateId } from "@src/util";

export class BooksTable extends Table<Book> {
  tableName = "books";

  protected schema = {
    id: "TEXT PRIMARY KEY",
    title: "TEXT NOT NULL",
    author: "TEXT NOT NULL",
    status:
      "TEXT CHECK(status IN ('draft', 'published')) NOT NULL DEFAULT 'draft'",
    created_at: "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
    updated_at: "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
  };

  async insert(book: BookCreate): Promise<Book> {
    const id = generateId();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const { query, params } = this.generateInsertQuery({
      ...book,
      id,
      status: "draft",
      created_at: createdAt,
      updated_at: updatedAt,
    });

    await this.mainDb.run(query, params);

    const newBook = await this.getById(id);

    if (!newBook) {
      throw new Error("Failed to create book");
    }

    return newBook;
  }

  async getList(
    offset: number,
    limit: number,
    status?: Book["status"],
  ): Promise<BookList> {
    const whereClause = status
      ? `WHERE ${this.fields.status} = '${status}'`
      : "";

    const total = await this.mainDb.get<{ total: number }>(
      `SELECT COUNT(*) AS total FROM ${this.tableName} ${whereClause}`,
    );

    const books = await this.mainDb.all<Book>(
      `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY ${this.fields.updated_at} DESC LIMIT ? OFFSET ?`,
      [limit, offset],
    );

    return {
      books,
      offset,
      limit,
      total: total?.total || 0,
    };
  }

  async changeBookStatus(id: string, status: Book["status"]): Promise<Book> {
    const updatedAt = new Date().toISOString();
    await this.mainDb.run(
      `UPDATE ${this.tableName} SET ${this.fields.status} = ?, ${this.fields.updated_at} = ? WHERE ${this.fields.id} = ?`,
      [status, updatedAt, id],
    );

    const book = await this.mainDb.get<Book>(
      `SELECT * FROM ${this.tableName} WHERE ${this.fields.id} = ?`,
      [id],
    );

    if (!book) {
      throw new Error("Book not found");
    }
    if (book.status !== status) {
      throw new Error(`Failed to update book status to ${status}`);
    }

    return book;
  }
}
