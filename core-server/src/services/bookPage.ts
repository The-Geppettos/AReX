import type { BookPagesTable } from "@src/component/coredb/tables/bookPage";
import type { BookChaptersTable } from "@src/component/coredb/tables/bookChapter";
import type { BookPageDetail } from "@shared/book";

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

    const chapter = await this.bookChaptersTable.getById(bookPage.chapter_id);

    if (!chapter) {
      throw new Error(`Chapter with ID ${bookPage.chapter_id} not found`);
    }
    const { characters_info, ...rest } = bookPage;

    return {
      ...rest,
      chapter_title: chapter.title,
      chapter_number: chapter.chapter_number,
      sentence_boundaries:
        bookPage.sentence_boundaries !== null
          ? JSON.parse(bookPage.sentence_boundaries)
          : null,
      characters: JSON.parse(characters_info).map(
        (charInfo: any) => charInfo.name,
      ),
    };
  }
}
