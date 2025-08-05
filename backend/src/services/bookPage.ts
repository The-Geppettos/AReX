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

  private linkPrevSentenceBoundaries(
    prevSentenceBoundaries: Exclude<BookPage["sentence_boundaries"], null>,
    prevContentLength: number,
    nextSentenceBoundaries: Exclude<BookPage["sentence_boundaries"], null>,
  ) {
    let linkIndex = prevSentenceBoundaries.findIndex(
      ([start, _]) =>
        start === prevContentLength + nextSentenceBoundaries[0][0],
    );

    if (linkIndex === -1) {
      const newPrevSentenceBoundaries = [
        ...prevSentenceBoundaries.slice(0, -1),
        [
          prevSentenceBoundaries[prevSentenceBoundaries.length - 1][0],
          nextSentenceBoundaries[0][1] + prevContentLength,
        ] as [number, number],
      ];

      const newNextSentenceBoundaries = [
        [
          prevSentenceBoundaries[prevSentenceBoundaries.length - 1][0] -
            prevContentLength,
          nextSentenceBoundaries[0][1],
        ] as [number, number],
        ...nextSentenceBoundaries.slice(1),
      ];

      return [newPrevSentenceBoundaries, newNextSentenceBoundaries];
    }

    const newPrevSentenceBoundaries = [
      ...prevSentenceBoundaries.slice(0, linkIndex),
      [
        prevSentenceBoundaries[linkIndex][0],
        nextSentenceBoundaries[0][1] + prevContentLength,
      ] as [number, number],
    ];

    return [newPrevSentenceBoundaries, nextSentenceBoundaries];
  }

  async updatePreProcessedData(
    bookPageId: string,
    sentenceBoundaries: Exclude<BookPage["sentence_boundaries"], null>,
  ) {
    const bookPage = await this.bookPagesTable.getById(bookPageId);

    if (!bookPage) {
      throw new Error("Book page not found");
    }

    if (bookPage.page_number > 1 && sentenceBoundaries[0][0] < 0) {
      const prevPage = await this.bookPagesTable.getByBookIdAndPageNumber(
        bookPage.book_id,
        bookPage.page_number - 1,
      );

      if (prevPage && prevPage.sentence_boundaries !== null) {
        const prevSentenceBoundaries = JSON.parse(
          prevPage.sentence_boundaries,
        ) as Exclude<BookPage["sentence_boundaries"], null>;

        const [newPrevSentenceBoundaries, newSentenceBoundaries] =
          this.linkPrevSentenceBoundaries(
            prevSentenceBoundaries,
            prevPage.content_length,
            sentenceBoundaries,
          );
        sentenceBoundaries = newSentenceBoundaries;

        await this.bookPagesTable.updatePreProcessedData(
          prevPage.id,
          JSON.stringify(newPrevSentenceBoundaries),
        );
      }
    }

    const nextPage = await this.bookPagesTable.getByBookIdAndPageNumber(
      bookPage.book_id,
      bookPage.page_number + 1,
    );

    if (nextPage && nextPage.sentence_boundaries !== null) {
      const nextSentenceBoundaries = JSON.parse(
        nextPage.sentence_boundaries,
      ) as Exclude<BookPage["sentence_boundaries"], null>;

      if (nextSentenceBoundaries[nextSentenceBoundaries.length - 1][0] < 0) {
        const [newSentenceBoundaries, newNextSentenceBoundaries] =
          this.linkPrevSentenceBoundaries(
            sentenceBoundaries,
            bookPage.content_length,
            nextSentenceBoundaries,
          );
        sentenceBoundaries = newSentenceBoundaries;

        await this.bookPagesTable.updatePreProcessedData(
          nextPage.id,
          JSON.stringify(newNextSentenceBoundaries),
        );
      }
    }

    await this.bookPagesTable.updatePreProcessedData(
      bookPageId,
      JSON.stringify(sentenceBoundaries),
    );
  }
}
