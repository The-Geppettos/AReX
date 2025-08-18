import type { Book, BookList, BookPageDetail } from "@shared/book";
import { axiosInstance } from "./axios";

export class ReadBookAPI {
  static async getBookList(offset: number, limit: number): Promise<BookList> {
    const response = await axiosInstance.get(
      `/api/books/published/${offset}/${limit}`,
    );
    return response.data;
  }

  static async getBookInfo(id: string): Promise<Book> {
    const response = await axiosInstance.get(`/api/book/${id}`);
    return response.data;
  }

  private static bookPageCache: Map<string, Map<number, BookPageDetail>> =
    new Map();

  static async getBookPage(
    bookId: string,
    page_number: number,
  ): Promise<BookPageDetail> {
    let cached = this.bookPageCache.get(bookId);
    if (cached) {
      const bookPage = cached.get(page_number);

      if (bookPage) {
        return bookPage;
      }
    } else {
      cached = new Map<number, BookPageDetail>();
      this.bookPageCache.set(bookId, cached);
    }

    const response = await axiosInstance.get(
      `/api/book/${bookId}/page/${page_number}`,
    );

    cached.set(page_number, response.data);

    return response.data;
  }
}
