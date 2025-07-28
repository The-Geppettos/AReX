import type { BookChapter } from "@shared/types";
import type { BookChaptersTable } from "@src/dbclient/maindb/tables/bookChapter";

export class BookChapterController {
  private bookChaptersTable: BookChaptersTable;

  constructor(bookChaptersTable: BookChaptersTable) {
    this.bookChaptersTable = bookChaptersTable;
  }

  async createChapter(
    bookId: string,
    chapterNumber: number,
    title: string,
  ): Promise<BookChapter> {
    return this.bookChaptersTable.insert({
      book_id: bookId,
      chapter_number: chapterNumber,
      title,
    });
  }
}
