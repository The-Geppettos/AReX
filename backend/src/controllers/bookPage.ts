import type BookPagesTable from "../dbclient/maindb/tables/bookPage";
import type BookChaptersTable from "../dbclient/maindb/tables/bookChapter";
import type BookContentVectorCollection from "../dbclient/chromadb/vectorCollections/bookContent";
import type { BookPage, BookPageDetail } from "@shared/types";

export default class BookPageController {
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

    const isFirstPageOfChapter =
      await this.bookPagesTable.getIsFirstPageOfChapter(
        boodId,
        pageNumber,
        bookPage.chapter_id,
      );

    let chapterTitle: string | null = null;

    if (isFirstPageOfChapter) {
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
  ): Promise<BookPage> {
    const bookPage = await this.bookPagesTable.insert({
      book_id: bookId,
      chapter_id: chapterId,
      page_number: pageNumber,
      content,
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
