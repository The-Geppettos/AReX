import type { BookPagesTable } from "@src/client/maindb/tables/bookPage";
import type { BookChaptersTable } from "@src/client/maindb/tables/bookChapter";
import type { BookPage, BookPageDetail } from "@shared/types";
import type { ContentAnalysisQueue } from "@src/client/rabbitmq/queues/contentAnalysis";

export class BookPageController {
  private bookPagesTable: BookPagesTable;
  private bookChaptersTable: BookChaptersTable;
  private contentAnalysisQueue: ContentAnalysisQueue;

  constructor(
    bookPagesTable: BookPagesTable,
    bookChaptersTable: BookChaptersTable,
    contentAnalysisQueue: ContentAnalysisQueue,
  ) {
    this.bookPagesTable = bookPagesTable;
    this.bookChaptersTable = bookChaptersTable;
    this.contentAnalysisQueue = contentAnalysisQueue;
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

    let prevContent = null;

    if (bookPage.page_transition_type !== "new_chapter") {
      const prevPage = await this.bookPagesTable.getByBookIdAndPageNumber(
        bookId,
        pageNumber - 1,
      );

      if (prevPage) {
        switch (bookPage.page_transition_type) {
          case "line_break":
            prevContent = prevPage.content + "\n";
            break;
          case "space":
            prevContent = prevPage.content + " ";
            break;
          case "intra_word_break":
            prevContent = prevPage.content;
            break;
          default:
            throw new Error("Invalid page transition type");
        }
      } else {
        throw new Error("Previous page not found");
      }
    }

    await this.contentAnalysisQueue.sendMessage(bookPage.id, content, prevContent);

    return bookPage;
  }
}
