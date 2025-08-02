import type { BookChapter } from "@shared/types";
import type { BookChaptersTable } from "@src/client/maindb/tables/bookChapter";

export class BookChapterService {
  private bookChaptersTable: BookChaptersTable;

  constructor(bookChaptersTable: BookChaptersTable) {
    this.bookChaptersTable = bookChaptersTable;
  }

  async createChapter(
    bookId: string,
    chapterNumber: number,
    title: string,
  ): Promise<BookChapter> {
    return this.bookChaptersTable.createChapter({
      book_id: bookId,
      chapter_number: chapterNumber,
      title,
    });
  }
}
