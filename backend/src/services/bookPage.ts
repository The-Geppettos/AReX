import type { BookPagesTable } from "@src/component/maindb/tables/bookPage";
import type { BookChaptersTable } from "@src/component/maindb/tables/bookChapter";
import type { BookPage, BookPageDetail } from "@shared/types";
import type { NLPPreProcessProducer } from "@src/component/rabbitmq/queues/nlpPreProcess";
import type { BooksTable } from "@src/component/maindb/tables/books";

export class BookPageService {
  private bookPagesTable: BookPagesTable;
  private booksTable: BooksTable;
  private bookChaptersTable: BookChaptersTable;
  private nlpPreProcessProducer: NLPPreProcessProducer;

  constructor(
    bookPagesTable: BookPagesTable,
    booksTable: BooksTable,
    bookChaptersTable: BookChaptersTable,
    nlpPreProcessProducer: NLPPreProcessProducer,
  ) {
    this.bookPagesTable = bookPagesTable;
    this.booksTable = booksTable;
    this.bookChaptersTable = bookChaptersTable;
    this.nlpPreProcessProducer = nlpPreProcessProducer;
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
    const bookPage = await this.bookPagesTable.createBookPage({
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

    const book = await this.booksTable.getById(bookId);
    if (!book) {
      throw new Error("Book not found");
    }

    await this.nlpPreProcessProducer.sendMessage(
      {
        book_page_id: bookPage.id,
        content,
        prev_content: prevContent,
        language: book.language,
      },
      { persistent: true },
    );

    return bookPage;
  }

  async updatePreProcessedData(
    bookPageId: string,
    sentenceBoundaries: Exclude<BookPage["sentence_boundaries"], null>,
  ): Promise<BookPage> {
    const updatedBookPage = await this.bookPagesTable.updatePreProcessedData(
      bookPageId,
      JSON.stringify(sentenceBoundaries),
    );

    if (!updatedBookPage) {
      throw new Error("Book page not found");
    }

    return {
      ...updatedBookPage,
      sentence_boundaries: JSON.parse(updatedBookPage.sentence_boundaries),
    };
  }
}
