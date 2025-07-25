export interface Book {
  id: string;
  title: string;
  author: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

export interface BookCreate extends Pick<Book, "title" | "author"> {}

export interface BookDetail extends Book {
  total_pages: number;
}

export interface BookList {
  books: Book[];
  offset: number;
  limit: number;
  total: number;
}

export interface BookChapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
  created_at: string;
}

export interface BookChapterCreate
  extends Pick<BookChapter, "book_id" | "chapter_number" | "title"> {}

export interface BookPage {
  id: string;
  book_id: string;
  chapter_id: string;
  content: string;
  page_number: number;
  content_length: number;
  offset_start: number;
  offset_end: number;
  created_at: string;
}

export interface BookPageCreate
  extends Pick<
    BookPage,
    "book_id" | "chapter_id" | "content" | "page_number"
  > {}

export interface BookPageDetail extends BookPage {
  chapter_title: string | null;
}

export interface ContentAnalysis {
  characters: string[];
}
