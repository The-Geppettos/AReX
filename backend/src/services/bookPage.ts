import type { BookPagesTable } from "@src/component/maindb/tables/bookPage";
import type { BookChaptersTable } from "@src/component/maindb/tables/bookChapter";
import type { BookPageDetail } from "@shared/types";

export class BookPageService {
  private bookPagesTable: BookPagesTable;
  private bookChaptersTable: BookChaptersTable;

  constructor(
    bookPagesTable: BookPagesTable,
    bookChaptersTable: BookChaptersTable,
  ) {
    this.bookPagesTable = bookPagesTable;
    this.bookChaptersTable = bookChaptersTable;
  }

  async getBookPage(
    boodId: string,
    pageNumber: number,
  ): Promise<BookPageDetail | null> {
    const bookPage = await this.bookPagesTable.getByBookIdAndPageNumber(
      boodId,
      pageNumber,
    );
    if (!bookPage) return null;

    let chapterTitle: string | null = null;

    if (bookPage.page_transition_type === "new_chapter") {
      const chapter = await this.bookChaptersTable.getById(bookPage.chapter_id);
      chapterTitle = chapter ? chapter.title : null;
    }

    return {
      ...bookPage,
      chapter_title: chapterTitle,
      sentence_boundaries:
        bookPage.sentence_boundaries !== null
          ? JSON.parse(bookPage.sentence_boundaries)
          : null,
    };
  }
}
