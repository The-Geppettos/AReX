import { PAGE_TRANSITION_TYPES, type BookPageSchema } from "@shared/book";
import type { BooksTable } from "./books";
import type { BookChaptersTable } from "./bookChapter";
import type { CoreDB } from "..";

import { Table } from "./abstract";

export class BookPagesTable extends Table<BookPageSchema> {
  tableName = "book_pages";
  idField = "id" as const;

  protected schema = {
    id: "TEXT PRIMARY KEY",
    book_id: "TEXT NOT NULL",
    chapter_id: "TEXT NOT NULL",
    content: "TEXT NOT NULL",
    page_number: "INTEGER NOT NULL",
    content_length: "INTEGER NOT NULL",
    offset_start: "INTEGER NOT NULL",
    offset_end: "INTEGER NOT NULL",
    page_transition_type: "TEXT NOT NULL",
    sentence_boundaries: "TEXT",
    preprocessed: "BOOLEAN NOT NULL",
    created_at: "TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP",
    updated_at: "TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP",
  };

  constructor(
    coreDb: CoreDB,
    booksTable: BooksTable,
    bookChaptersTable: BookChaptersTable,
  ) {
    super(coreDb);
    this.addConstraint(
      `FOREIGN KEY (${this.field("book_id")}) REFERENCES ${booksTable.tableName}(${booksTable.field("id")}) ON DELETE CASCADE`,
    );
    this.addConstraint(
      `FOREIGN KEY (${this.field("chapter_id")}) REFERENCES ${bookChaptersTable.tableName}(${bookChaptersTable.field("id")}) ON DELETE CASCADE`,
    );
    this.addConstraint(
      `CHECK (${this.field("page_transition_type")} IN (${PAGE_TRANSITION_TYPES.map((p) => `'${p}'`).join(", ")}))`,
    );
    this.addIndex([this.field("book_id"), this.field("page_number")]);
  }

  async getByBookIdAndPageNumber(
    bookId: string,
    pageNumber: number,
  ): Promise<BookPageSchema | undefined> {
    const result = await this.coreDb.query<BookPageSchema>(
      `SELECT * FROM ${this.tableName} WHERE ${this.field("book_id")} = $1 AND ${this.field("page_number")} = $2 LIMIT 1`,
      [bookId, pageNumber],
    );

    return result.rows?.[0];
  }
}
