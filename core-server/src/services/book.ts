import type { Book, BookList } from "@shared/book";
import type { BooksTable } from "@src/component/coredb/tables/books";

export class BookService {
  private booksTable: BooksTable;

  constructor(booksTable: BooksTable) {
    this.booksTable = booksTable;
  }

  async getPublishedBooks(offset: number, limit: number): Promise<BookList> {
    return this.booksTable.getList(offset, limit, "published");
  }

  async getAllBooks(offset: number, limit: number): Promise<BookList> {
    return this.booksTable.getList(offset, limit);
  }

  async publishBook(id: string): Promise<Book> {
    const updatedAt = new Date().toISOString();
    const books = await this.booksTable.update(
      { id, status: "draft" },
      {
        status: "published",
        updated_at: updatedAt,
      },
    );

    if (books.length === 0) {
      throw new Error(`Failed to publish book with ID: ${id}`);
    }

    return books[0];
  }

  async unPublishBook(id: string): Promise<Book> {
    const updatedAt = new Date().toISOString();
    const books = await this.booksTable.update(
      { id, status: "published" },
      {
        status: "draft",
        updated_at: updatedAt,
      },
    );

    if (books.length === 0) {
      throw new Error(`Failed to publish book with ID: ${id}`);
    }

    return books[0];
  }

  async getById(id: string): Promise<Book | null> {
    return this.booksTable.getById(id);
  }
}
