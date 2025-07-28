import type { BookPagesTable } from "src/dbclient/maindb/tables/bookPage";
import type { BookChaptersTable } from "src/dbclient/maindb/tables/bookChapter";
import type { BookContentVectorCollection } from "src/dbclient/chromadb/vectorCollections/bookContent";
import type { BookPage, BookPageDetail } from "@shared/types";

export class BookPageController {
  private bookPagesTable: BookPagesTable;
  private bookChaptersTable: BookChaptersTable;
  private bookContentVectorCollection: BookContentVectorCollection;

  constructor(
    bookPagesTable: BookPagesTable,
    bookChaptersTable: BookChaptersTable,
    bookContentVectorCollection: BookContentVectorCollection,
  ) {
    this.bookPagesTable = bookPagesTable;
    this.bookChaptersTable = bookChaptersTable;
    this.bookContentVectorCollection = bookContentVectorCollection;
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
    };
  }

  async createBookPage(
    bookId: string,
    chapterId: string,
    pageNumber: number,
    content: string,
    pageTransitionType:
      | "new_chapter"
      | "line_break"
      | "space"
      | "intra_word_break",
  ): Promise<BookPage> {
    const bookPage = await this.bookPagesTable.insert({
      book_id: bookId,
      chapter_id: chapterId,
      page_number: pageNumber,
      content,
      page_transition_type: pageTransitionType,
    });

    await this.bookContentVectorCollection.insert({
      book_id: bookId,
      chapter_id: chapterId,
      page_number: pageNumber,
      content,
    });

    return bookPage;
  }
}
