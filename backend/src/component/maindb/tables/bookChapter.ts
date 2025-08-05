import type { BookChapter } from "@shared/types";
import type { MainDB } from "..";
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
  };

  constructor(mainDb: MainDB, booksTable: BooksTable) {
    super(mainDb);
    this.addConstraint(
      `FOREIGN KEY (${this.field("book_id")}) REFERENCES ${booksTable.tableName}(${booksTable.field("id")}) ON DELETE CASCADE`,
    );
  }
}
