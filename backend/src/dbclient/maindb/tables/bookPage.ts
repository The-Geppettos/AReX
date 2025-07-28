import type { BookPage, BookPageCreate } from "@shared/types";
import type { BooksTable } from "./books";
import type { BookChaptersTable } from "./bookChapter";

import { Table } from "./abstract";
import { generateId } from "src/util";

export class BookPagesTable extends Table<BookPage> {
  tableName = "book_pages";

  protected schema = {
    id: "TEXT PRIMARY KEY",
    book_id: "TEXT NOT NULL",
    chapter_id: "TEXT NOT NULL",
    content: "TEXT NOT NULL",
    page_number: "INTEGER NOT NULL",
    content_length: "INTEGER NOT NULL",
    offset_start: "INTEGER NOT NULL",
    offset_end: "INTEGER NOT NULL",
    page_transition_type:
      "TEXT NOT NULL CHECK (page_transition_type IN ('new_chapter', 'line_break', 'space', 'intra_word_break'))",
    created_at: "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
  };

  constructor(
    mainDb: any,
    booksTable: BooksTable,
    bookChaptersTable: BookChaptersTable,
  ) {
    super(mainDb);
    this.constraints.push(
      `FOREIGN KEY (${this.fields.book_id}) REFERENCES ${booksTable.tableName}(${booksTable.fields.id}) ON DELETE CASCADE`,
    );
    this.constraints.push(
      `FOREIGN KEY (${this.fields.chapter_id}) REFERENCES ${bookChaptersTable.tableName}(${bookChaptersTable.fields.id}) ON DELETE CASCADE`,
    );
  }

  async insert(bookPage: BookPageCreate): Promise<BookPage> {
    const id = generateId();
    const createdAt = new Date().toISOString();
    const contentLength = bookPage.content.length;

    let offsetStart = 0;

    if (bookPage.page_number > 1) {
      const lastPage = await this.getByBookIdAndPageNumber(
        bookPage.book_id,
        bookPage.page_number - 1,
      );
      if (!lastPage) {
        throw new Error("Previous page not found");
      }
      offsetStart = lastPage.offset_end;
    }

    const offsetEnd = offsetStart + contentLength - 1;

    const { query, params } = this.generateInsertQuery({
      ...bookPage,
      id,
      content_length: contentLength,
      offset_start: offsetStart,
      offset_end: offsetEnd,
      created_at: createdAt,
    });

    await this.mainDb.run(query, params);

    const newBookPage = await this.getById(id);

    if (!newBookPage) {
      throw new Error("Failed to create book page");
    }

    return newBookPage;
  }

  async getTotalPages(bookId: string): Promise<number> {
    const result = await this.mainDb.get<{ total_pages: number }>(
      `SELECT COUNT(*) AS total_pages FROM ${this.tableName} WHERE book_id = ?`,
      [bookId],
    );
    return result ? result.total_pages : 0;
  }

  async getByBookIdAndPageNumber(
    bookId: string,
    pageNumber: number,
  ): Promise<BookPage | undefined> {
    return await this.mainDb.get<BookPage>(
      `SELECT * FROM ${this.tableName} WHERE ${this.fields.book_id} = ? AND ${this.fields.page_number} = ?`,
      [bookId, pageNumber],
    );
  }
}
