import type { BookChapter } from "@shared/book";
import type { CoreDB } from "..";
import type { BooksTable } from "./books";

import { Table } from "./abstract";

export class BookChaptersTable extends Table<BookChapter> {
  tableName = "book_chapters";
  idField = "id" as const;

  protected schema = {
    id: "TEXT PRIMARY KEY",
    book_id: "TEXT NOT NULL",
    chapter_number: "INTEGER NOT NULL",
    title: "TEXT NOT NULL",
    created_at: "TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP",
    start_page_number: "INTEGER NOT NULL",
    end_page_number: "INTEGER NOT NULL",
  };

  constructor(coreDb: CoreDB, booksTable: BooksTable) {
    super(coreDb);
    this.addConstraint(
      `FOREIGN KEY (${this.field("book_id")}) REFERENCES ${booksTable.tableName}(${booksTable.field("id")}) ON DELETE CASCADE`,
    );
  }

  async getChaptersByBookId(bookId: string): Promise<BookChapter[]> {
    const result = await this.coreDb.query<BookChapter>(
      `SELECT * FROM ${this.tableName} WHERE ${this.field(
        "book_id",
      )} = $1 ORDER BY ${this.field("chapter_number")} ASC;`,
      [bookId],
    );

    return result.rows;
  }
}
