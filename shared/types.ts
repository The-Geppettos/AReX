export const LANGUAGES = ["ko", "en"] as const;

export const BOOK_STATUS = [
  "uploading",
  "uploaded",
  "preprocessing",
  "draft",
  "published",
] as const;

export const PAGE_TRANSITION_TYPES = [
  "new_chapter",
  "line_break",
  "space",
  "intra_word_break",
] as const;

export const LANGUAGE_LABELS: Record<Language, string> = {
  ko: "한국어",
  en: "English",
};

export type Language = (typeof LANGUAGES)[number];
export type BookStatus = (typeof BOOK_STATUS)[number];
export type PageTransitionType = (typeof PAGE_TRANSITION_TYPES)[number];

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  language: Language;
  total_pages: number;
  created_at: string;
  updated_at: string;
}

export interface BookUpload
  extends Pick<Book, "title" | "author" | "language"> {}

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

export interface BookChapterUpload
  extends Pick<BookChapter, "chapter_number" | "title"> {}

export interface BookPage {
  id: string;
  book_id: string;
  chapter_id: string;
  content: string;
  page_number: number;
  content_length: number;
  offset_start: number;
  offset_end: number;
  sentence_boundaries: [number, number][];
  page_transition_type: PageTransitionType;
  preprocessed: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookPageSchema extends Omit<BookPage, "sentence_boundaries"> {
  sentence_boundaries: string; // Stored as JSON string in the database
}

export interface BookPageUpload
  extends Pick<
    BookPage,
    "chapter_id" | "content" | "page_number" | "page_transition_type"
  > {}

export interface BookPageDetail extends BookPage {
  chapter_title: string | null;
}

export interface NLPPreProcessReq {
  book_page_id: string;
  content: string;
  prev_content: string | null;
  language: Language;
}

export type NLPPreProcessRes =
  | {
      success: true;
      book_page_id: string;
      result: {
        sentence_boundaries: [number, number][];
      };
    }
  | { success: false; book_page_id: string };
