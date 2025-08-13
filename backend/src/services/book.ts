import type { Book, BookList } from "@shared/book";
import type { BooksTable } from "@src/component/maindb/tables/books";

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
    const book = await this.booksTable.updateById(id, {
      status: "published",
      updated_at: updatedAt,
    });

    if (!book) {
      throw new Error(`Failed to publish book with ID: ${id}`);
    }

    return book;
  }

  async unPublishBook(id: string): Promise<Book> {
    const updatedAt = new Date().toISOString();
    const book = await this.booksTable.updateById(id, {
      status: "draft",
      updated_at: updatedAt,
    });

    if (!book) {
      throw new Error(`Failed to publish book with ID: ${id}`);
    }

    return book;
  }

  async getById(id: string): Promise<Book | null> {
    return this.booksTable.getById(id);
  }
}
