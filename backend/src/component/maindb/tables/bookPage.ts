import {
  PAGE_TRANSITION_TYPES,
  type BookPageSchema,
  type BookPageCreate,
} from "@shared/types";
import type { BooksTable } from "./books";
import type { BookChaptersTable } from "./bookChapter";
import type { MainDB } from "..";

import { Table } from "./abstract";
import { generateId } from "@src/util";

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
    created_at: "TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP",
    updated_at: "TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP",
  };

  constructor(
    mainDb: MainDB,
    booksTable: BooksTable,
    bookChaptersTable: BookChaptersTable,
  ) {
    super(mainDb);
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

  async createBookPage(
    bookPage: BookPageCreate,
  ): Promise<BookPageSchema<null>> {
    const id = generateId();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    let contentLength = bookPage.content.length;

    if (
      bookPage.page_transition_type === "space" ||
      bookPage.page_transition_type === "line_break"
    ) {
      contentLength += 1;
    }

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

    const result = await this.insert({
      ...bookPage,
      id,
      content_length: contentLength,
      offset_start: offsetStart,
      offset_end: offsetEnd,
      sentence_boundaries: null,
      created_at: createdAt,
      updated_at: updatedAt,
    });

    return result[0] as BookPageSchema<null>;
  }

  async getTotalPages(bookId: string): Promise<number> {
    const result = await this.mainDb.query<{ total_pages: string }>(
      `SELECT COUNT(*) AS total_pages FROM ${this.tableName} WHERE ${this.field("book_id")} = $1`,
      [bookId],
    );

    return result.rows?.[0]?.total_pages
      ? parseInt(result.rows[0].total_pages, 10)
      : 0;
  }

  async getByBookIdAndPageNumber(
    bookId: string,
    pageNumber: number,
  ): Promise<BookPageSchema | undefined> {
    const result = await this.mainDb.query<BookPageSchema>(
      `SELECT * FROM ${this.tableName} WHERE ${this.field("book_id")} = $1 AND ${this.field("page_number")} = $2 LIMIT 1`,
      [bookId, pageNumber],
    );

    return result.rows?.[0];
  }

  async updatePreProcessedData(
    bookPageId: string,
    sentenceBoundaries: Exclude<BookPageSchema["sentence_boundaries"], null>,
  ): Promise<BookPageSchema<string>> {
    const updatedAt = new Date().toISOString();
    const result = await this.mainDb.query<BookPageSchema<string>>(
      `UPDATE ${this.tableName}
       SET ${this.field("sentence_boundaries")} = $1, ${this.field("updated_at")} = $2
       WHERE ${this.field("id")} = $3
       RETURNING *`,
      [sentenceBoundaries, updatedAt, bookPageId],
    );

    if (result.rowCount === 0) {
      throw new Error(`Failed to update book page with id ${bookPageId}`);
    }

    return result.rows[0];
  }
}
