import type { BookContentVectorCollection } from "@src/component/chromadb/vectorCollections/bookContent";
import type { BooksTable } from "@src/component/maindb/tables/books";
import { OpenAI } from "openai";
import { getSystemPrompt } from "./prompt";
import { BotMessage } from "@shared/types";

const OPENAI_CHAT_MODEL = "gpt-4o-mini";

export class AssistantAgentService {
  private bookContentVectorCollection;
  private booksTable;
  private openai;

  constructor(
    openaiApiKey: string,
    bookContentVectorCollection: BookContentVectorCollection,
    booksTable: BooksTable,
  ) {
    this.bookContentVectorCollection = bookContentVectorCollection;
    this.booksTable = booksTable;

    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    });
  }

  async conversate(
    query: string,
    bookId: string,
    offset: number,
  ): Promise<BotMessage> {
    const book = await this.booksTable.getById(bookId);

    if (!book) {
      throw new Error(`Book with ID ${bookId} not found`);
    }

    // TODO: Improve search logic
    const searchResult = await this.bookContentVectorCollection.search(
      [query],
      bookId,
      offset,
      7,
    );

    const searchResultStr = JSON.stringify(searchResult);

    const result = await this.openai.chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: getSystemPrompt(book.language, searchResultStr),
        },
        { role: "user", content: query },
      ],
    });

    const message = result.choices[0].message.content;

    if (!message) {
      throw new Error("No message returned from OpenAI API");
    }

    console.log(result);

    return { message, id: result.id };
  }
}
