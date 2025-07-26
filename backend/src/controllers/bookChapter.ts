import { generateId } from "../util";
import { maindb } from "../dbclient/maindb";
import { BookChapter } from "@shared/types";

export class BookChapterController {
  static async createChapter(
    bookId: string,
    chapterNumber: number,
    title: string,
  ): Promise<BookChapter> {
    const chapterId = generateId();
    const createdAt = new Date().toISOString();

    await maindb.run(
      "INSERT INTO book_chapters (id, book_id, chapter_number, title, created_at) VALUES (?, ?, ?, ?, ?)",
      [chapterId, bookId, chapterNumber, title, createdAt],
    );

    return {
      id: chapterId,
      book_id: bookId,
      chapter_number: chapterNumber,
      title: title,
      created_at: createdAt,
    };
  }
}
