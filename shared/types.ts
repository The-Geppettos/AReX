export interface Book {
  id: string;
  title: string;
  author: string;
  created_at: string;
}

export interface BookDetail extends Book {
  total_pages: number;
}

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

export interface BookPageDetail extends BookPage {
  chapter_title: string | null;
}

export interface BookChapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
  created_at: string;
}
