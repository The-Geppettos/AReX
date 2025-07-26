import { generateId } from "../util";
import { maindb } from "../dbclient/maindb";
import { BookChapter, BookPage, BookPageDetail } from "@shared/types";

export class BookPageController {
  static async getBookPage(
    boodId: string,
    pageNumber: number,
  ): Promise<BookPageDetail | null> {
    const bookPage = await maindb.get<BookPage>(
      "SELECT * FROM book_pages WHERE book_id = ? AND page_number = ?",
      [boodId, pageNumber],
    );
    if (!bookPage) return null;

    const isFirstPageOfChapter = await maindb.get<{ is_first: number }>(
      "SELECT COUNT(*) AS is_first FROM book_pages WHERE book_id = ? AND chapter_id = ? AND page_number < ?",
      [boodId, bookPage.chapter_id, pageNumber],
    );

    let chapterTitle: string | null = null;

    if (isFirstPageOfChapter && isFirstPageOfChapter.is_first === 0) {
      const chapter = await maindb.get<BookChapter>(
        "SELECT title FROM book_chapters WHERE id = ?",
        [bookPage.chapter_id],
      );
      chapterTitle = chapter ? chapter.title : null;
    }

    return {
      ...bookPage,
      chapter_title: chapterTitle,
    };
  }

  static async createBookPage(
    bookId: string,
    chapterId: string,
    pageNumber: number,
    content: string,
  ): Promise<BookPage> {
    const bookPageId = generateId();
    const createdAt = new Date().toISOString();

    const contentLength = content.length;

    if (contentLength === 0) {
      throw new Error("Content cannot be empty");
    }

    let offsetStart = 0;

    if (pageNumber > 1) {
      const lastPage = await maindb.get<BookPage>(
        "SELECT offset_end FROM book_pages WHERE book_id = ? AND page_number = ?",
        [bookId, pageNumber - 1],
      );
      if (!lastPage) {
        throw new Error("Previous page not found");
      }
      offsetStart = lastPage.offset_end + 1;
    }

    const offsetEnd = offsetStart + contentLength - 1;

    await maindb.run(
      "INSERT INTO book_pages (id, book_id, chapter_id, content, page_number, content_length, offset_start, offset_end, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        bookPageId,
        bookId,
        chapterId,
        content,
        pageNumber,
        contentLength,
        offsetStart,
        offsetEnd,
        createdAt,
      ],
    );

    return {
      id: bookPageId,
      book_id: bookId,
      chapter_id: chapterId,
      content,
      page_number: pageNumber,
      content_length: contentLength,
      offset_start: offsetStart,
      offset_end: offsetEnd,
      created_at: createdAt,
    };
  }
};
