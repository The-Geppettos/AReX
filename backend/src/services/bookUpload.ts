import type { BookPagesTable } from "@src/component/maindb/tables/bookPage";
import type { BookChaptersTable } from "@src/component/maindb/tables/bookChapter";
import type {
  Book,
  BookChapter,
  BookPage,
  Language,
  PageTransitionType,
} from "@shared/types";
import type { NLPPreProcessProducer } from "@src/component/rabbitmq/queues/nlpPreProcess";
import type { BooksTable } from "@src/component/maindb/tables/books";
import type { PostProcessProducer } from "@src/component/rabbitmq/queues/postProcess";
import type { BookContentVectorCollection } from "@src/component/chromadb/vectorCollections/bookContent";

import { generateId } from "@src/util";

const CHUNK_SENTENCES = 5;
const CHUNK_SENTENCE_OVERLAP = 2;

export class BookUploadService {
  private bookPagesTable;
  private booksTable;
  private bookChaptersTable;
  private nlpPreProcessProducer;
  private postProcessProducer;
  private bookContentVectorCollection;

  constructor(
    bookPagesTable: BookPagesTable,
    booksTable: BooksTable,
    bookChaptersTable: BookChaptersTable,
    nlpPreProcessProducer: NLPPreProcessProducer,
    postProcessProducer: PostProcessProducer,
    bookContentVectorCollection: BookContentVectorCollection,
  ) {
    this.bookPagesTable = bookPagesTable;
    this.booksTable = booksTable;
    this.bookChaptersTable = bookChaptersTable;
    this.nlpPreProcessProducer = nlpPreProcessProducer;
    this.postProcessProducer = postProcessProducer;
    this.bookContentVectorCollection = bookContentVectorCollection;
  }

  async bookUpload1(
    title: string,
    author: string,
    language: Language,
  ): Promise<Book> {
    const id = generateId();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const books = await this.booksTable.insert({
      id,
      title,
      author,
      language,
      created_at: createdAt,
      updated_at: updatedAt,
      status: "uploading",
      total_pages: 0,
    });

    if (books === null) {
      throw new Error("Failed to create book");
    }

    return books;
  }

  async bookUpload2(
    bookId: string,
    chapterNumber: number,
    title: string,
  ): Promise<BookChapter> {
    const id = generateId();
    const createdAt = new Date().toISOString();

    const chapters = await this.bookChaptersTable.insert({
      id,
      book_id: bookId,
      chapter_number: chapterNumber,
      title,
      created_at: createdAt,
    });

    if (chapters === null) {
      throw new Error("Failed to create book chapter");
    }

    return chapters;
  }

  async bookUpload3(
    bookId: string,
    chapterId: string,
    pageNumber: number,
    content: string,
    pageTransitionType: PageTransitionType,
  ): Promise<BookPage> {
    const id = generateId();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    let contentLength = content.length;

    if (pageTransitionType === "space" || pageTransitionType === "line_break") {
      contentLength += 1;
    }

    let offsetStart = 0;
    let prevContent = null;

    if (pageNumber > 1) {
      const prevPage = await this.bookPagesTable.getByBookIdAndPageNumber(
        bookId,
        pageNumber - 1,
      );

      if (prevPage) {
        switch (pageTransitionType) {
          case "line_break":
            prevContent = prevPage.content + "\n";
            break;
          case "space":
            prevContent = prevPage.content + " ";
            break;
          case "intra_word_break":
            prevContent = prevPage.content;
            break;
          case "new_chapter":
            break;
          default:
            throw new Error("Invalid page transition type");
        }
      } else {
        throw new Error("Previous page not found");
      }
      offsetStart = prevPage.offset_end;
    }

    const offsetEnd = offsetStart + contentLength - 1;

    const result = await this.bookPagesTable.insert({
      id,
      content,
      book_id: bookId,
      chapter_id: chapterId,
      page_number: pageNumber,
      page_transition_type: pageTransitionType,
      content_length: contentLength,
      offset_start: offsetStart,
      offset_end: offsetEnd,
      sentence_boundaries: "[]",
      preprocessed: false,
      created_at: createdAt,
      updated_at: updatedAt,
    });

    if (result === null) {
      throw new Error("Failed to create book page");
    }

    const book = await this.booksTable.getById(bookId);
    if (!book) {
      throw new Error("Book not found");
    }

    await this.nlpPreProcessProducer.sendMessage(
      {
        book_page_id: result.id,
        content,
        prev_content: prevContent,
        language: book.language,
      },
      { persistent: true },
    );

    return { ...result, sentence_boundaries: [] };
  }

  private linkPrevSentenceBoundaries(
    prevSentenceBoundaries: BookPage["sentence_boundaries"],
    prevContentLength: number,
    nextSentenceBoundaries: BookPage["sentence_boundaries"],
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
    sentenceBoundaries: BookPage["sentence_boundaries"],
  ) {
    const bookPage = await this.bookPagesTable.getById(bookPageId);

    if (!bookPage) {
      throw new Error("Book page not found");
    }

    const book = await this.booksTable.getById(bookPage.book_id);

    if (!book) {
      throw new Error("Book not found");
    }

    const updatedAt = new Date().toISOString();

    if (bookPage.page_number > 1 && sentenceBoundaries[0][0] < 0) {
      const prevPage = await this.bookPagesTable.getByBookIdAndPageNumber(
        bookPage.book_id,
        bookPage.page_number - 1,
      );

      if (prevPage && prevPage.preprocessed) {
        const prevSentenceBoundaries = JSON.parse(
          prevPage.sentence_boundaries,
        ) as BookPage["sentence_boundaries"];

        const [newPrevSentenceBoundaries, newSentenceBoundaries] =
          this.linkPrevSentenceBoundaries(
            prevSentenceBoundaries,
            prevPage.content_length,
            sentenceBoundaries,
          );
        sentenceBoundaries = newSentenceBoundaries;

        await this.bookPagesTable.updateById(prevPage.id, {
          sentence_boundaries: JSON.stringify(newPrevSentenceBoundaries),
          updated_at: updatedAt,
        });
      }
    }

    const nextPage = await this.bookPagesTable.getByBookIdAndPageNumber(
      bookPage.book_id,
      bookPage.page_number + 1,
    );

    if (nextPage && nextPage.preprocessed) {
      const nextSentenceBoundaries = JSON.parse(
        nextPage.sentence_boundaries,
      ) as BookPage["sentence_boundaries"];

      if (nextSentenceBoundaries[nextSentenceBoundaries.length - 1][0] < 0) {
        const [newSentenceBoundaries, newNextSentenceBoundaries] =
          this.linkPrevSentenceBoundaries(
            sentenceBoundaries,
            bookPage.content_length,
            nextSentenceBoundaries,
          );
        sentenceBoundaries = newSentenceBoundaries;

        await this.bookPagesTable.updateById(nextPage.id, {
          sentence_boundaries: JSON.stringify(newNextSentenceBoundaries),
          updated_at: updatedAt,
        });
      }
    }

    await this.bookPagesTable.updateById(bookPageId, {
      sentence_boundaries: JSON.stringify(sentenceBoundaries),
      preprocessed: true,
      updated_at: updatedAt,
    });

    const preProcessedPages = await this.bookPagesTable.count({
      book_id: bookPage.book_id,
      preprocessed: true,
    });

    if (preProcessedPages === book.total_pages) {
      await this.postProcessProducer.sendMessage(
        {
          book_id: bookPage.book_id,
        },
        { persistent: true },
      );
    }
  }

  async bookUpload4(bookId: string): Promise<Book> {
    const totalPages = await this.bookPagesTable.count({ book_id: bookId });
    const updatedAt = new Date().toISOString();

    const book = await this.booksTable.updateById(bookId, {
      status: "preprocessing",
      total_pages: totalPages,
      updated_at: updatedAt,
    });

    if (!book) {
      throw new Error(`Failed to finish book upload for ID: ${bookId}`);
    }

    const preProcessedPages = await this.bookPagesTable.count({
      book_id: bookId,
      preprocessed: true,
    });

    if (preProcessedPages === totalPages) {
      await this.postProcessProducer.sendMessage(
        {
          book_id: bookId,
        },
        { persistent: true },
      );
    }

    return book;
  }

  async postProcess(bookId: string) {
    await this.booksTable.updateById(bookId, {
      status: "preprocessing",
      updated_at: new Date().toISOString(),
    });

    const book = await this.booksTable.getById(bookId);

    if (!book) {
      throw new Error(`Book not found for ID: ${bookId}`);
    }

    const cursor = [1, -1]; // [pageNumber, sentenceIndex]

    let bookPage = await this.bookPagesTable.getByBookIdAndPageNumber(
      bookId,
      cursor[0],
    );

    if (!bookPage) {
      throw new Error(
        `Book page not found for book ID: ${bookId}, page: ${cursor[0]}`,
      );
    }

    let sentenceBoundaries = JSON.parse(
      bookPage.sentence_boundaries,
    ) as BookPage["sentence_boundaries"];
    let lastOffset = bookPage.offset_start;
    let lastChapterId = bookPage.chapter_id;

    let sentences: string[] = [];
    let sentenceContinue = "";

    while (bookPage) {
      while (sentences.length < CHUNK_SENTENCES) {
        const isLastSentence = cursor[1] === sentenceBoundaries.length - 1;
        const isNextSentenceLinked =
          cursor[1] + 1 === sentenceBoundaries.length - 1 &&
          sentenceBoundaries[cursor[1] + 1][1] > bookPage.content_length;

        if (isLastSentence || isNextSentenceLinked) {
          if (isNextSentenceLinked) {
            sentenceContinue = bookPage.content.slice(
              sentenceBoundaries[cursor[1] + 1][0],
            );
          }

          lastOffset = bookPage.offset_start + sentenceBoundaries[cursor[1]][0];
          lastChapterId = bookPage.chapter_id;

          cursor[0]++;
          cursor[1] = 0;

          bookPage = await this.bookPagesTable.getByBookIdAndPageNumber(
            bookId,
            cursor[0],
          );

          if (!bookPage) {
            break;
          }

          sentenceBoundaries = JSON.parse(
            bookPage.sentence_boundaries,
          ) as BookPage["sentence_boundaries"];

          if (bookPage.page_transition_type === "new_chapter") {
            break;
          }
        } else {
          cursor[1]++;
        }

        let sentence;

        if (sentenceBoundaries[cursor[1]][0] < 0) {
          sentence = sentenceContinue;
          if (bookPage.page_transition_type === "space") {
            sentence = sentence + " ";
          }
          sentence =
            sentence +
            bookPage.content.slice(0, sentenceBoundaries[cursor[1]][1]);
        } else {
          sentence = bookPage.content.slice(
            sentenceBoundaries[cursor[1]][0],
            sentenceBoundaries[cursor[1]][1],
          );
        }

        sentences.push(sentence);
      }

      let offset;
      if (bookPage) {
        offset = bookPage.offset_start + sentenceBoundaries[cursor[1]][0];
      } else {
        offset = lastOffset;
      }

      let chapterId;
      if (bookPage) {
        chapterId = bookPage.chapter_id;
      } else {
        chapterId = lastChapterId;
      }

      await this.bookContentVectorCollection.insert({
        book_id: bookId,
        chapter_id: chapterId,
        offset,
        content: sentences.join(" "),
      });

      sentences = sentences.slice(-CHUNK_SENTENCE_OVERLAP);
    }

    await this.booksTable.updateById(bookId, {
      status: "draft",
      updated_at: new Date().toISOString(),
    });
  }
}
