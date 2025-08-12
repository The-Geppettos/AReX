import type {
  Book,
  BookChapter,
  BookChapterUpload,
  BookUpload,
  BookPageUpload,
  BookPageDetail,
} from "@shared/types";
import axios from "axios";

const axiosInstance = axios.create();

export class BookUploadAPI {
  static async uploadBook(bookInfo: BookUpload): Promise<Book> {
    const response = await axiosInstance.post(
      "/api/book_upload/book",
      bookInfo,
    );
    return response.data;
  }

  static async uploadChapter(
    chapterInfo: BookChapterUpload,
  ): Promise<BookChapter> {
    const response = await axiosInstance.post(
      "/api/book_upload/chapter",
      chapterInfo,
    );
    return response.data;
  }

  static async uploadPage(
    bookPageInfo: BookPageUpload,
  ): Promise<BookPageDetail> {
    const response = await axiosInstance.post(
      "/api/book_upload/page/",
      bookPageInfo,
    );
    const bookPage = response.data;

    return bookPage;
  }

  static async finishUpload(id: string): Promise<Book> {
    const response = await axiosInstance.post(`/api/book_upload/finish/${id}`);
    return response.data;
  }
}
