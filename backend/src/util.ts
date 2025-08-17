import { v4 as uuidv4 } from "uuid";
import { BookContentMetadata } from "@src/component/chromadb/vectorCollections/bookContent";
import type { Language } from "@shared/book";
import { QueryResult } from "chromadb";

export const generateId = () => uuidv4();

export const searchResultToString = (
  queryResult: QueryResult<BookContentMetadata>,
  language: Language,
): string[] => {
  switch (language) {
    case "ko":
      return queryResult
        .rows()
        .map((rows) => rows.map((row) => `${row.document}`).join("\n"));
    case "en":
      return queryResult
        .rows()
        .map((rows) => rows.map((row) => `${row.document}`).join("\n"));
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};

export const insertMetadataInContent = (
  language: Language,
  content: string,
  metadata: BookContentMetadata,
): string => {
  switch (language) {
    case "ko":
      return `[챕터 ${metadata.chapter_number} ${metadata.chapter_title}] [페이지 ${metadata.page_number}] ${content}`;
    case "en":
      return `[Chapter ${metadata.chapter_number} ${metadata.chapter_title}] [Page ${metadata.page_number}] ${content}`;
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};
