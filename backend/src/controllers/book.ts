import type { Book, BookDetail, BookList } from "@shared/types";
import type { BooksTable } from "../dbclient/maindb/tables/books";
import type { BookPagesTable } from "../dbclient/maindb/tables/bookPage";

export class BookController {
  private booksTable: BooksTable;
  private bookPagesTable: BookPagesTable;

  constructor(booksTable: BooksTable, bookPagesTable: BookPagesTable) {
    this.booksTable = booksTable;
    this.bookPagesTable = bookPagesTable;
  }

  async getPublishedBooks(offset: number, limit: number): Promise<BookList> {
    return this.booksTable.getList(offset, limit, "published");
  }

  async getAllBooks(offset: number, limit: number): Promise<BookList> {
    return this.booksTable.getList(offset, limit);
  }

  async publishBook(id: string): Promise<Book> {
    return this.booksTable.changeBookStatus(id, "published");
  }

  async unPublishBook(id: string): Promise<Book> {
    return this.booksTable.changeBookStatus(id, "draft");
  }

  async getById(id: string): Promise<BookDetail | null> {
    const book = await this.booksTable.getById(id);

    if (!book) return null;

    const totalPages = await this.bookPagesTable.getTotalPages(id);

    return {
      ...book,
      total_pages: totalPages || 0,
    };
  }

  async createBook(title: string, author: string): Promise<Book> {
    return await this.booksTable.insert({ title, author });
  }
}
