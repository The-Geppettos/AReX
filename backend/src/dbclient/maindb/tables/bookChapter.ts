import type { BookChapter, BookChapterCreate } from "@shared/types";
import type { MainDB } from "..";
import type { BooksTable } from "./books";

import { Table } from "./abstract";
import { generateId } from "@src/util";

export class BookChaptersTable extends Table<BookChapter> {
  tableName = "book_chapters";

  protected schema = {
    id: "TEXT PRIMARY KEY",
    book_id: "TEXT NOT NULL",
    chapter_number: "INTEGER NOT NULL",
    title: "TEXT NOT NULL",
    created_at: "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
  };

  constructor(mainDb: MainDB, booksTable: BooksTable) {
    super(mainDb);
    this.constraints.push(
      `FOREIGN KEY (${this.fields.book_id}) REFERENCES ${booksTable.tableName}(${booksTable.fields.id}) ON DELETE CASCADE`,
    );
  }

  async insert(chapter: BookChapterCreate) {
    const id = generateId();
    const createdAt = new Date().toISOString();

    const { query, params } = this.generateInsertQuery({
      ...chapter,
      id,
      created_at: createdAt,
    });

    await this.mainDb.run(query, params);

    const newChapter = await this.getById(id);

    if (!newChapter) {
      throw new Error("Failed to create book chapter");
    }

    return newChapter;
  }
}
