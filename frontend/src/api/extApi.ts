import type {
  Book,
  BookChapter,
  BookChapterCreate,
  BookCreate,
  BookDetail,
  BookList,
  BookPageCreate,
  BookPageDetail,
} from "@shared/types";
import axios from "axios";

const axiosInstance = axios.create();

class ExtAPI {
  static async getPublishedBookList(
    offset: number,
    limit: number,
  ): Promise<BookList> {
    const response = await axiosInstance.get(
      `/api/books/published/${offset}/${limit}`,
    );
    return response.data;
  }

  static async getAllBookList(
    offset: number,
    limit: number,
  ): Promise<BookList> {
    const response = await axiosInstance.get(
      `/api/books/all/${offset}/${limit}`,
    );
    return response.data;
  }

  static async getBookInfo(id: string): Promise<BookDetail> {
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

  static async createBook(bookInfo: BookCreate): Promise<Book> {
    const response = await axiosInstance.post("/api/book", bookInfo);
    return response.data;
  }

  static async createBookChapter(
    chapterInfo: BookChapterCreate,
  ): Promise<BookChapter> {
    const response = await axiosInstance.post(
      `/api/book/${chapterInfo.book_id}/chapter`,
      chapterInfo,
    );
    return response.data;
  }

  static async createBookPage(
    bookPageInfo: BookPageCreate,
  ): Promise<BookPageDetail> {
    const response = await axiosInstance.post(
      `/api/book/${bookPageInfo.book_id}/page`,
      bookPageInfo,
    );
    const bookPage = response.data;

    return bookPage;
  }

  static async publishBook(id: string): Promise<Book> {
    const response = await axiosInstance.put(`/api/book/${id}/publish`);
    return response.data;
  }

  static async unPublishBook(id: string): Promise<Book> {
    const response = await axiosInstance.put(`/api/book/${id}/unpublish`);
    return response.data;
  }
}

export default ExtAPI;
