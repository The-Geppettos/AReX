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
        .map((rows) =>
          rows
            .map(
              (row) =>
                `[챕터 ${row.metadata?.chapter_number} - ${row.metadata?.chapterTitle}] [페이지 ${row.metadata?.pageNumber}]: ${row.document}`,
            )
            .join("\n"),
        );
    case "en":
      return queryResult
        .rows()
        .map((rows) =>
          rows
            .map(
              (row) =>
                `[Chapter ${row.metadata?.chapter_number} - ${row.metadata?.chapterTitle}] [Page ${row.metadata?.pageNumber}]: ${row.document}`,
            )
            .join("\n"),
        );
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};
