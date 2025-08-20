import { Language } from "./book";

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
        color_code: string;
      };
    }
  | { success: false; book_page_id: string };

export type PostProcess = {
  book_id: string;
};
